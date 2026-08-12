import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import connectDB from "@/lib/db";
import User from "@/models/User";
import RankConfig, { DEFAULT_RANKS } from "@/models/RankConfig";
import GiftLog from "@/models/GiftLog";
import { getUserSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { deleteCache } from "@/lib/cache";
import {
  expRewardForRank,
  findRankForExp,
  requiredExpForRank,
} from "@/lib/giftRanks";
import { getRandomGiftProductLink } from "@/lib/giftProductLinks";
import GiftWatchProgress from "@/models/GiftWatchProgress";

export const dynamic = "force-dynamic";

function toFiniteNumber(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** POST /api/gift/open — user claims their filled gift box */
export async function POST(req: NextRequest) {
  let rewardPersisted = false;
  let claimedProgress:
    | {
        id: string;
        claimVersion: number;
        verifiedSeconds: number;
      }
    | undefined;

  try {
    // IP-level rate limit: max 20 claims per hour per IP (anti-bot)
    const ipLimited = await rateLimit(req, {
      windowMs: 3600,
      max: 20,
      keyPrefix: "rl:gift:open",
    });
    if (ipLimited) return ipLimited;

    const session = await getUserSession();
    if (!session) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập" },
        { status: 401 },
      );
    }

    await connectDB();

    // Atomically consume this user's completed watch cycle. clientId identifies
    // the heartbeat owner, but must not prevent a legitimate claim after a
    // reload creates/recover a browser session. Authentication + verified
    // server progress remain the claim authority.
    const readyProgress = await GiftWatchProgress.findOne({
      userId: session.userId,
      $expr: { $gte: ["$verifiedSeconds", "$requiredSeconds"] },
    });
    if (!readyProgress) {
      return NextResponse.json(
        { error: "Bạn chưa xem đủ thời gian để mở hộp quà" },
        { status: 409 },
      );
    }

    const consumedProgress = await GiftWatchProgress.findOneAndUpdate(
      {
        _id: readyProgress._id,
        claimVersion: readyProgress.claimVersion,
        $expr: { $gte: ["$verifiedSeconds", "$requiredSeconds"] },
      },
      {
        $set: {
          verifiedSeconds: 0,
          lastClaimAt: new Date(),
          lastSequence: 0,
          lastClientPosition: 0,
        },
        $inc: { claimVersion: 1 },
      },
      { new: true },
    );
    if (!consumedProgress) {
      return NextResponse.json(
        { error: "Hộp quà đã được nhận ở một yêu cầu khác" },
        { status: 409 },
      );
    }
    claimedProgress = {
      id: String(consumedProgress._id),
      claimVersion: consumedProgress.claimVersion,
      verifiedSeconds: readyProgress.verifiedSeconds,
    };

    // Seed ranks if needed
    const count = await RankConfig.countDocuments();
    if (count === 0) await RankConfig.insertMany(DEFAULT_RANKS);

    const user = await User.findById(session.userId).select(
      "coins giftLevel giftExp",
    );

    if (!user) {
      throw new Error("Gift user not found");
    }

    const ranks = await RankConfig.find().sort({ rank: 1 }).lean();

    if (!Array.isArray(ranks) || ranks.length === 0) {
      throw new Error("Gift rank configuration missing");
    }

    const savedLevel = Math.max(1, toFiniteNumber(user.giftLevel, 1));
    const savedRank =
      ranks.find((r) => toFiniteNumber(r.rank, -1) === savedLevel) ?? ranks[0];
    const currentExp = Math.max(
      toFiniteNumber(user.giftExp, 0),
      requiredExpForRank(savedRank),
    );
    const currentRank = findRankForExp(ranks, currentExp) ?? ranks[0];
    const normalizedLevel = Math.max(1, toFiniteNumber(currentRank.rank, 1));
    const coinsEarned = Math.max(0, toFiniteNumber(currentRank.coinsReward, 0));
    const shopeeCoinsReward = Math.max(
      0,
      toFiniteNumber(currentRank.shopeeCoinsReward, 0),
    );
    const expEarned = expRewardForRank(currentRank);
    const newGiftExp = currentExp + expEarned;
    const newRank = findRankForExp(ranks, newGiftExp) ?? currentRank;
    const newLevel = Math.max(1, toFiniteNumber(newRank.rank, 1));
    const leveledUp = newLevel > normalizedLevel;

    const updatedUser = await User.findOneAndUpdate(
      // The completed watch cycle was already consumed atomically above.
      // Requiring an exact historical giftExp here made valid claims fail if
      // the profile/config request normalized an older account concurrently.
      { _id: user._id },
      {
        $set: { giftLevel: newLevel, giftExp: newGiftExp },
        $inc: { coins: coinsEarned },
      },
      { new: true },
    );
    if (!updatedUser) {
      throw new Error("Concurrent gift reward update");
    }
    rewardPersisted = true;

    // Log for abuse detection (fire-and-forget)
    const hdrs = await headers();
    const ip =
      hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      hdrs.get("x-real-ip") ??
      "unknown";
    const ua = hdrs.get("user-agent") ?? "unknown";
    const claimId = `${String(session.userId)}:${claimedProgress.claimVersion}`;
    const productUrl = getRandomGiftProductLink();
    await GiftLog.create({
      claimId,
      userId: session.userId,
      giftLevel: normalizedLevel,
      rank: normalizedLevel,
      coinsEarned,
      expEarned,
      leveledUp,
      ip,
      ua,
      verifiedSeconds: claimedProgress.verifiedSeconds,
      productUrl: productUrl || undefined,
      shopeeCoinsReward,
      shopeeCoinsEarned: 0,
    });

    // Invalidate per-user gift config cache so next poll reflects updated coinsToday/Total
    deleteCache(`gift:cfg:v2:${String(session.userId)}`).catch(() => {});

    const newRankIndex = ranks.findIndex(
      (rank) => toFiniteNumber(rank.rank, -1) === newLevel,
    );
    const nextRank =
      newRankIndex >= 0 ? (ranks[newRankIndex + 1] ?? null) : null;
    return NextResponse.json({
      coinsEarned,
      expEarned,
      giftExp: newGiftExp,
      nextRankExp: nextRank ? requiredExpForRank(nextRank) : null,
      leveledUp,
      newLevel,
      newCoins: updatedUser.coins,
      rankName: String(newRank.name ?? "Khán Giả"),
      rank: Math.max(1, toFiniteNumber(newRank.rank, 1)),
      claimId,
      productUrl,
      shopeeCoinsReward,
    });
  } catch (error) {
    console.error("[gift/open] failed", error);
    if (claimedProgress && !rewardPersisted) {
      // Restore the consumed progress when reward persistence fails. The
      // claimVersion guard prevents restoring over a newer successful claim.
      await GiftWatchProgress.updateOne(
        {
          _id: claimedProgress.id,
          claimVersion: claimedProgress.claimVersion,
          verifiedSeconds: 0,
        },
        { $set: { verifiedSeconds: claimedProgress.verifiedSeconds } },
      ).catch(() => {});
    }
    return NextResponse.json(
      { error: "Không thể mở hộp quà lúc này" },
      { status: 500 },
    );
  }
}
