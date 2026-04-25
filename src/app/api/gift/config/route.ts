import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import RankConfig, { DEFAULT_RANKS } from "@/models/RankConfig";
import User from "@/models/User";
import GiftLog from "@/models/GiftLog";
import { getUserSession } from "@/lib/auth";
import { getCache, setCache } from "@/lib/cache";
import { rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

function toFiniteNumber(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** GET /api/gift/config — returns the current user's gift config based on rank */
export async function GET(req: NextRequest) {
  try {
    // Rate limit: 60 req/min per IP (route polled every few seconds by all watching users)
    const limited = await rateLimit(req, {
      windowMs: 60,
      max: 60,
      keyPrefix: "rl:gift:cfg",
    });
    if (limited) return limited;

    const session = await getUserSession();
    if (!session) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập" },
        { status: 401 },
      );
    }

    await connectDB();

    const userIdStr = String(session.userId);

    // Cache per-user for 30s — aggregation is expensive, this route is polled frequently
    const cacheKey = `gift:cfg:${userIdStr}`;
    const cached = await getCache<object>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Seed ranks if collection is empty
    const count = await RankConfig.countDocuments();
    if (count === 0) {
      await RankConfig.insertMany(DEFAULT_RANKS);
    }

    const vipUser = await User.findById(session.userId).select("giftLevel");
    if (!vipUser) {
      return NextResponse.json(
        { error: "Không tìm thấy user" },
        { status: 404 },
      );
    }

    const giftLevel = toFiniteNumber(vipUser.giftLevel, 1);
    const ranks = await RankConfig.find().sort({ rank: 1 }).lean();

    if (!Array.isArray(ranks) || ranks.length === 0) {
      return NextResponse.json(
        { error: "Chưa có cấu hình hộp quà" },
        { status: 400 },
      );
    }

    const currentRank =
      ranks.find((r) => toFiniteNumber(r.rank, -1) === giftLevel) ?? ranks[0];
    const normalizedLevel = Math.max(1, toFiniteNumber(currentRank.rank, 1));

    if (normalizedLevel !== giftLevel) {
      vipUser.giftLevel = normalizedLevel;
      await vipUser.save();
    }

    const effectiveWatchSeconds = Math.max(
      1,
      toFiniteNumber(currentRank.watchSeconds, 60),
    );
    const coinsReward = Math.max(0, toFiniteNumber(currentRank.coinsReward, 0));

    // Coins earned from gift box: today & all-time
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const [todayAgg, totalAgg] = await Promise.all([
      GiftLog.aggregate([
        { $match: { userId: userIdStr, createdAt: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: "$coinsEarned" } } },
      ]),
      GiftLog.aggregate([
        { $match: { userId: userIdStr } },
        { $group: { _id: null, total: { $sum: "$coinsEarned" } } },
      ]),
    ]);
    const coinsToday = Math.max(0, toFiniteNumber(todayAgg[0]?.total, 0));
    const coinsTotal = Math.max(0, toFiniteNumber(totalAgg[0]?.total, 0));

    const responsePayload = {
      rank: normalizedLevel,
      rankName: String(currentRank.name ?? "Khán Giả"),
      nextRankName: null,
      watchMax: effectiveWatchSeconds,
      coinsReward,
      coinsToday,
      coinsTotal,
      // First-time flag: gift box is immediately ready so new users get a taste
      isFirstClaim: coinsTotal === 0,
    };

    // Cache for 30s — stale by at most 30s, but saves 2 aggregations per poll
    await setCache(cacheKey, responsePayload, 30);

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("[gift/config] failed", error);
    return NextResponse.json(
      { error: "Không thể tải cấu hình hộp quà" },
      { status: 500 },
    );
  }
}
