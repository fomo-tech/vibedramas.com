import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import WelfareClaim from "@/models/WelfareClaim";
import {
  ensureWelfareConfig,
  getCheckInState,
  getDateKey,
} from "@/lib/welfare";
import { rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Rate limit: 5 attempts/hour per IP — prevent scripted check-in farming
  const limited = await rateLimit(req, {
    windowMs: 3600,
    max: 5,
    keyPrefix: "rl:checkin",
  });
  if (limited) return limited;

  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
  }

  await connectDB();

  const [config, lastCheckIn] = await Promise.all([
    ensureWelfareConfig(),
    WelfareClaim.findOne({
      userId: String(session.userId),
      actionType: "daily_checkin",
    })
      .sort({ createdAt: -1 })
      .lean<{
        dayKey: string;
        streakDay?: number;
        createdAt: Date;
      } | null>(),
  ]);

  const state = getCheckInState(lastCheckIn, config.dailyCheckInRewards.length);
  if (state.todayClaimed) {
    return NextResponse.json(
      { error: "Bạn đã điểm danh hôm nay" },
      { status: 409 },
    );
  }

  const reward =
    config.dailyCheckInRewards[state.nextDay - 1] ??
    config.dailyCheckInRewards[0] ??
    0;
  const userId = String(session.userId);

  try {
    await WelfareClaim.create({
      userId,
      taskId: "daily_checkin",
      actionType: "daily_checkin",
      reward,
      dayKey: getDateKey(),
      streakDay: state.nextDay,
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        { error: "Bạn đã điểm danh hôm nay" },
        { status: 409 },
      );
    }

    throw error;
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $inc: { coins: reward } },
    { returnDocument: "after", select: "coins" },
  ).lean<{ coins?: number } | null>();

  return NextResponse.json({
    ok: true,
    reward,
    streakDay: state.nextDay,
    coins: updatedUser?.coins ?? reward,
  });
}
