import RankConfig, { DEFAULT_RANKS } from "@/models/RankConfig";
import User from "@/models/User";
import { findRankForExp, requiredExpForRank } from "@/lib/giftRanks";

export const GIFT_HEARTBEAT_SECONDS = 5;
export const GIFT_SESSION_LOCK_SECONDS = 20;
export const GIFT_MAX_HEARTBEAT_GAP_SECONDS = 15;

function finite(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function getGiftWatchRequirement(userId: string) {
  if ((await RankConfig.countDocuments()) === 0) {
    await RankConfig.insertMany(DEFAULT_RANKS);
  }

  const [user, ranks] = await Promise.all([
    User.findById(userId).select("giftLevel giftExp").lean(),
    RankConfig.find().sort({ rank: 1 }).lean(),
  ]);
  if (!user || ranks.length === 0) return null;

  const savedLevel = Math.max(1, finite(user.giftLevel, 1));
  const savedRank =
    ranks.find((rank) => finite(rank.rank, -1) === savedLevel) ?? ranks[0];
  const giftExp = Math.max(
    finite(user.giftExp, 0),
    requiredExpForRank(savedRank),
  );
  const currentRank = findRankForExp(ranks, giftExp) ?? ranks[0];

  return {
    requiredSeconds: Math.max(1, finite(currentRank.watchSeconds, 60)),
  };
}

export function giftProgressPayload(progress: {
  verifiedSeconds: number;
  requiredSeconds: number;
}) {
  const watchMax = Math.max(1, finite(progress.requiredSeconds, 60));
  const watchExp = Math.min(
    watchMax,
    Math.max(0, finite(progress.verifiedSeconds, 0)),
  );
  return {
    watchExp,
    watchMax,
    ready: watchExp >= watchMax,
  };
}
