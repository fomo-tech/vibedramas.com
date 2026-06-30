export const DEFAULT_REQUIRED_EXP = [0, 100, 300, 700, 1500] as const;
export const DEFAULT_EXP_REWARD = [10, 15, 20, 30, 40] as const;

export interface GiftRankLike {
  rank?: unknown;
  requiredExp?: unknown;
  expReward?: unknown;
}

function finiteNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function requiredExpForRank(rank: GiftRankLike) {
  const level = Math.max(1, Math.min(5, finiteNumber(rank.rank, 1)));
  return Math.max(
    0,
    finiteNumber(rank.requiredExp, DEFAULT_REQUIRED_EXP[level - 1]),
  );
}

export function expRewardForRank(rank: GiftRankLike) {
  const level = Math.max(1, Math.min(5, finiteNumber(rank.rank, 1)));
  return Math.max(
    1,
    finiteNumber(rank.expReward, DEFAULT_EXP_REWARD[level - 1]),
  );
}

export function findRankForExp<T extends GiftRankLike>(ranks: T[], exp: number) {
  const sorted = [...ranks].sort(
    (a, b) => finiteNumber(a.rank, 1) - finiteNumber(b.rank, 1),
  );
  return (
    [...sorted]
      .reverse()
      .find((rank) => exp >= requiredExpForRank(rank)) ?? sorted[0]
  );
}
