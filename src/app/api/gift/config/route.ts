import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import RankConfig, { DEFAULT_RANKS } from "@/models/RankConfig";
import User from "@/models/User";
import GiftLog from "@/models/GiftLog";
import { getUserSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import {
  expRewardForRank,
  findRankForExp,
  requiredExpForRank,
} from "@/lib/giftRanks";
import GiftWatchProgress from "@/models/GiftWatchProgress";

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

    // Watch progress is user-visible and must survive an immediate refresh.
    // Do not serve a cached snapshot here; it otherwise briefly resets the
    // ring to zero even though GiftWatchProgress has verified seconds.

    // Seed ranks if collection is empty
    const count = await RankConfig.countDocuments();
    if (count === 0) {
      await RankConfig.insertMany(DEFAULT_RANKS);
    }

    const rewardUser = await User.findById(session.userId).select(
      "giftLevel giftExp",
    );
    if (!rewardUser) {
      return NextResponse.json(
        { error: "Không tìm thấy user" },
        { status: 404 },
      );
    }

    const savedLevel = Math.max(1, toFiniteNumber(rewardUser.giftLevel, 1));
    const ranks = await RankConfig.find().sort({ rank: 1 }).lean();

    if (!Array.isArray(ranks) || ranks.length === 0) {
      return NextResponse.json(
        { error: "Chưa có cấu hình hộp quà" },
        { status: 400 },
      );
    }

    // Preserve the level of existing users, then let EXP drive every upgrade.
    const savedRank =
      ranks.find((r) => toFiniteNumber(r.rank, -1) === savedLevel) ?? ranks[0];
    const giftExp = Math.max(
      toFiniteNumber(rewardUser.giftExp, 0),
      requiredExpForRank(savedRank),
    );
    const currentRank = findRankForExp(ranks, giftExp) ?? ranks[0];
    const normalizedLevel = Math.max(1, toFiniteNumber(currentRank.rank, 1));

    if (
      normalizedLevel !== savedLevel ||
      giftExp !== toFiniteNumber(rewardUser.giftExp, 0)
    ) {
      rewardUser.giftLevel = normalizedLevel;
      rewardUser.giftExp = giftExp;
      await rewardUser.save();
    }

    const effectiveWatchSeconds = Math.max(
      1,
      toFiniteNumber(currentRank.watchSeconds, 60),
    );
    const coinsReward = Math.max(0, toFiniteNumber(currentRank.coinsReward, 0));
    const expReward = expRewardForRank(currentRank);
    const currentRankIndex = ranks.findIndex(
      (rank) => toFiniteNumber(rank.rank, -1) === normalizedLevel,
    );
    const nextRank =
      currentRankIndex >= 0 ? (ranks[currentRankIndex + 1] ?? null) : null;
    const currentRankExp = requiredExpForRank(currentRank);
    const nextRankExp = nextRank ? requiredExpForRank(nextRank) : null;

    // Coins earned from gift box: today & all-time
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const [todayAgg, totalAgg, watchProgress] = await Promise.all([
      GiftLog.aggregate([
        { $match: { userId: userIdStr, createdAt: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: "$coinsEarned" } } },
      ]),
      GiftLog.aggregate([
        { $match: { userId: userIdStr } },
        { $group: { _id: null, total: { $sum: "$coinsEarned" } } },
      ]),
      GiftWatchProgress.findOne({ userId: userIdStr }).lean(),
    ]);
    const coinsToday = Math.max(0, toFiniteNumber(todayAgg[0]?.total, 0));
    const coinsTotal = Math.max(0, toFiniteNumber(totalAgg[0]?.total, 0));
    const watchExp = Math.min(
      effectiveWatchSeconds,
      Math.max(0, toFiniteNumber(watchProgress?.verifiedSeconds, 0)),
    );

    const responsePayload = {
      rank: normalizedLevel,
      rankName: String(currentRank.name ?? "Khán Giả"),
      nextRankName: nextRank ? String(nextRank.name ?? "") : null,
      watchMax: effectiveWatchSeconds,
      watchExp,
      ready: watchExp >= effectiveWatchSeconds,
      coinsReward,
      expReward,
      giftExp,
      currentRankExp,
      nextRankExp,
      coinsToday,
      coinsTotal,
      isFirstClaim: false,
    };

    return NextResponse.json(responsePayload, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("[gift/config] failed", error);
    return NextResponse.json(
      { error: "Không thể tải cấu hình hộp quà" },
      { status: 500 },
    );
  }
}
