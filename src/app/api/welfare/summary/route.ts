import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import WelfareClaim from "@/models/WelfareClaim";
import {
  ensureWelfareConfig,
  getCheckInState,
  getDateKey,
  getWelfareUserSnapshot,
} from "@/lib/welfare";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getUserSession();

  await connectDB();
  const config = await ensureWelfareConfig();

  if (!session) {
    return NextResponse.json({ config, user: null });
  }

  const userId = String(session.userId);
  const todayKey = getDateKey();

  const [snapshot, lastCheckIn, todayTaskAgg, totalTaskAgg] = await Promise.all(
    [
      getWelfareUserSnapshot(userId),
      WelfareClaim.findOne({ userId, actionType: "daily_checkin" })
        .sort({ createdAt: -1 })
        .lean<{
          dayKey: string;
          streakDay?: number;
          createdAt: Date;
        } | null>(),
      WelfareClaim.aggregate([
        {
          $match: {
            userId,
            taskId: { $ne: "daily_checkin" },
            dayKey: todayKey,
          },
        },
        { $group: { _id: "$taskId", count: { $sum: 1 } } },
      ]),
      WelfareClaim.aggregate([
        { $match: { userId, taskId: { $ne: "daily_checkin" } } },
        { $group: { _id: "$taskId", count: { $sum: 1 } } },
      ]),
    ],
  );

  const todayCounts = new Map<string, number>(
    todayTaskAgg.map((item) => [String(item._id), Number(item.count ?? 0)]),
  );
  const totalCounts = new Map<string, number>(
    totalTaskAgg.map((item) => [String(item._id), Number(item.count ?? 0)]),
  );

  const checkIn = getCheckInState(
    lastCheckIn,
    config.dailyCheckInRewards.length,
  );
  const tasks = config.tasks
    .filter((task) => task.enabled)
    .map((task) => {
      const todayCount = todayCounts.get(task.id) ?? 0;
      const totalCount = totalCounts.get(task.id) ?? 0;
      const dailyRemaining =
        task.dailyLimit > 0 ? Math.max(0, task.dailyLimit - todayCount) : null;
      const totalRemaining =
        task.totalLimit > 0 ? Math.max(0, task.totalLimit - totalCount) : null;

      return {
        ...task,
        todayCount,
        totalCount,
        dailyRemaining,
        totalRemaining,
        canClaim:
          (task.dailyLimit === 0 || todayCount < task.dailyLimit) &&
          (task.totalLimit === 0 || totalCount < task.totalLimit),
      };
    });

  return NextResponse.json({
    config,
    user: {
      coins: snapshot.coins,
      bonusCoins: snapshot.bonusCoins,
      stats: snapshot.stats,
      checkIn: {
        ...checkIn,
        rewards: config.dailyCheckInRewards,
        nextReward:
          config.dailyCheckInRewards[checkIn.nextDay - 1] ??
          config.dailyCheckInRewards[0] ??
          0,
      },
      tasks,
    },
  });
}
