import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

export const dynamic = "force-dynamic";

/** GET /api/wallet/summary */
export async function GET() {
  const session = await getUserSession();
  if (!session)
    return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });

  await connectDB();

  const user = await User.findById(session.userId)
    .select("coins bonusCoins")
    .lean<{ coins: number; bonusCoins: number }>();

  if (!user)
    return NextResponse.json({ error: "Không tìm thấy user" }, { status: 404 });

  // Monthly totals
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const userIdStr = String(session.userId);

  const [earnedAgg, spentAgg] = await Promise.all([
    Transaction.aggregate([
      {
        $match: {
          userId: userIdStr,
          direction: "credit",
          createdAt: { $gte: startOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      {
        $match: {
          userId: userIdStr,
          direction: "debit",
          createdAt: { $gte: startOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  return NextResponse.json({
    coins: user.coins ?? 0,
    bonusCoins: user.bonusCoins ?? 0,
    earnedThisMonth: earnedAgg[0]?.total ?? 0,
    spentThisMonth: spentAgg[0]?.total ?? 0,
  });
}
