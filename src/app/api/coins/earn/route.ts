import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import CoinLog from "@/models/CoinLog";
import redis from "@/lib/redis";
import { getUserSession } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Verify authenticated session — reject unauthenticated or mismatched userId
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { episodeId, minuteIndex } = body;

    // Always use the session userId — ignore any userId from the body to prevent abuse
    const userId = session.userId;

    // Validate input
    if (!episodeId || minuteIndex === undefined || minuteIndex < 0) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    await connectDB();

    // Check user tồn tại và có VIP
    const user = (await User.findById(userId)
      .select("coins vipStatus vipExpiry vipCoinsPerMinute")
      .lean()) as any;
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!user.vipStatus) {
      return NextResponse.json(
        { vip: false, message: "VIP required" },
        { status: 403 },
      );
    }
    if (user.vipExpiry && new Date(user.vipExpiry) < new Date()) {
      return NextResponse.json(
        { vip: false, message: "VIP expired" },
        { status: 403 },
      );
    }

    // Rate limit: 1 earn per 58s per user (Redis)
    const rateLimitKey = `earn:${userId}`;
    const lastEarn = await redis.get(rateLimitKey);
    if (lastEarn) {
      return NextResponse.json({ error: "Too early" }, { status: 429 });
    }

    // Tính rate từ gói bậc đã mua (fallback về 1 nếu chưa set)
    const rate: number =
      user.vipCoinsPerMinute > 0 ? user.vipCoinsPerMinute : 1;

    // Credit xu — CoinLog unique index tự chặn duplicate
    try {
      await CoinLog.create({ userId, amount: rate, episodeId, minuteIndex });
    } catch (err: any) {
      // Duplicate key → đã credit rồi
      if (err.code === 11000) {
        return NextResponse.json({ skipped: true }, { status: 409 });
      }
      throw err;
    }

    // Update coins trong DB
    const updated = (await User.findByIdAndUpdate(
      userId,
      { $inc: { coins: rate } },
      { returnDocument: "after", select: "coins" },
    ).lean()) as any;

    // Set Redis rate limit 58s
    await redis.set(rateLimitKey, "1", "EX", 58);

    return NextResponse.json({ amount: rate, total: updated.coins });
  } catch (err) {
    console.error("[coins/earn]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
