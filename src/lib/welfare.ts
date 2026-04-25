import CoinLog from "@/models/CoinLog";
import GiftLog from "@/models/GiftLog";
import ReferralLog from "@/models/ReferralLog";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import VipLog from "@/models/VipLog";
import WelfareClaim from "@/models/WelfareClaim";
import WelfareConfig, {
  DEFAULT_WELFARE_CONFIG,
  type IWelfareTask,
} from "@/models/WelfareConfig";

export interface CoinActivityStats {
  earnedToday: number;
  earnedAllTime: number;
  spentToday: number;
  spentAllTime: number;
}

export interface CheckInState {
  todayClaimed: boolean;
  currentDay: number;
  nextDay: number;
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWrappedDay(day: number, rewardsLength: number) {
  if (rewardsLength <= 1) return 1;
  return day >= rewardsLength ? 1 : day + 1;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function ensureUniqueTaskId(base: string, used: Set<string>) {
  let next = base || `task-${Date.now()}`;
  let counter = 2;
  while (used.has(next)) {
    next = `${base || "task"}-${counter}`;
    counter += 1;
  }
  used.add(next);
  return next;
}

function normalizeTask(
  task: IWelfareTask,
  index: number,
  usedIds: Set<string>,
): IWelfareTask {
  const fallbackTitle = `Nhiệm vụ ${index + 1}`;
  const normalizedTitle = String(task.title || fallbackTitle).trim();
  const baseId =
    slugify(String(task.id || "")) ||
    slugify(normalizedTitle) ||
    `task-${index + 1}`;

  return {
    id: ensureUniqueTaskId(baseId, usedIds),
    title: normalizedTitle,
    subtitle: String(task.subtitle || "").trim(),
    reward: Number(task.reward ?? 0),
    actionLabel: String(task.actionLabel || "Nhận ngay").trim(),
    icon: task.icon,
    actionType: task.actionType,
    enabled: task.enabled !== false,
    dailyLimit: Math.max(0, Number(task.dailyLimit ?? 0)),
    totalLimit: Math.max(0, Number(task.totalLimit ?? 0)),
    requiresImageProof: task.requiresImageProof === true,
    linkUrl: task.linkUrl,
    order: Number(task.order ?? index + 1),
  };
}

export function normalizeDailyRewards(values: number[] | undefined) {
  const source = Array.isArray(values)
    ? values
    : DEFAULT_WELFARE_CONFIG.dailyCheckInRewards;

  return source
    .map((value) => Math.max(0, Math.floor(Number(value) || 0)))
    .filter((value) => value > 0)
    .slice(0, 7);
}

export function sanitizeWelfareConfig(config: {
  headerTitle?: string;
  headerSubtitle?: string;
  rewardsTabLabel?: string;
  memberTabLabel?: string;
  dailyCheckInRewards?: number[];
  tasks?: IWelfareTask[];
}) {
  const usedIds = new Set<string>();

  return {
    headerTitle: config.headerTitle || DEFAULT_WELFARE_CONFIG.headerTitle,
    headerSubtitle:
      config.headerSubtitle || DEFAULT_WELFARE_CONFIG.headerSubtitle,
    rewardsTabLabel:
      config.rewardsTabLabel || DEFAULT_WELFARE_CONFIG.rewardsTabLabel,
    memberTabLabel:
      config.memberTabLabel || DEFAULT_WELFARE_CONFIG.memberTabLabel,
    dailyCheckInRewards: normalizeDailyRewards(config.dailyCheckInRewards),
    tasks: (Array.isArray(config.tasks)
      ? config.tasks
      : DEFAULT_WELFARE_CONFIG.tasks
    )
      .map((task, index) => normalizeTask(task, index, usedIds))
      .sort((left, right) => left.order - right.order),
  };
}

export async function ensureWelfareConfig() {
  const existing = await WelfareConfig.findOne().lean();
  if (existing) {
    return sanitizeWelfareConfig(existing);
  }

  const created = await WelfareConfig.create(DEFAULT_WELFARE_CONFIG);
  return sanitizeWelfareConfig(created.toObject());
}

export function getCheckInState(
  lastClaim: {
    dayKey: string;
    streakDay?: number;
    createdAt?: Date | string;
  } | null,
  rewardsLength: number,
): CheckInState {
  if (!lastClaim) {
    return { todayClaimed: false, currentDay: 0, nextDay: 1 };
  }

  const currentDay = Math.max(1, Math.floor(lastClaim.streakDay ?? 1));
  const todayKey = getDateKey();

  if (lastClaim.dayKey === todayKey) {
    return {
      todayClaimed: true,
      currentDay,
      nextDay: getWrappedDay(currentDay, rewardsLength),
    };
  }

  const lastDate = startOfDay(
    new Date(lastClaim.createdAt ?? lastClaim.dayKey),
  );
  const today = startOfDay(new Date());
  const diffDays = Math.round(
    (today.getTime() - lastDate.getTime()) / 86400000,
  );

  if (diffDays === 1) {
    return {
      todayClaimed: false,
      currentDay,
      nextDay: getWrappedDay(currentDay, rewardsLength),
    };
  }

  return {
    todayClaimed: false,
    currentDay: 0,
    nextDay: 1,
  };
}

async function aggregateTotal(
  model: {
    aggregate: (...args: any[]) => Promise<Array<{ total?: number }>>;
  },
  match: Record<string, unknown>,
  sumExpression: string | Record<string, unknown>,
) {
  const result = await model.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: sumExpression } } },
  ]);

  return result[0]?.total ?? 0;
}

export async function getCoinActivityStats(
  userId: string,
): Promise<CoinActivityStats> {
  const startToday = startOfDay(new Date());
  const transactionCreditMatch = {
    userId,
    direction: "credit",
    type: { $in: ["coin_gift_received", "bonus"] },
  };

  const [
    todayGift,
    totalGift,
    todayWatch,
    totalWatch,
    todayReferral,
    totalReferral,
    todayWelfare,
    totalWelfare,
    todayCreditTx,
    totalCreditTx,
    todayDebitTx,
    totalDebitTx,
    todayVipSpent,
    totalVipSpent,
  ] = await Promise.all([
    aggregateTotal(
      GiftLog,
      { userId, createdAt: { $gte: startToday } },
      "$coinsEarned",
    ),
    aggregateTotal(GiftLog, { userId }, "$coinsEarned"),
    aggregateTotal(
      CoinLog,
      { userId, createdAt: { $gte: startToday } },
      "$amount",
    ),
    aggregateTotal(CoinLog, { userId }, "$amount"),
    aggregateTotal(
      ReferralLog,
      { referrerId: userId, createdAt: { $gte: startToday } },
      { $add: ["$coinsAwarded", "$bonusAwarded"] },
    ),
    aggregateTotal(
      ReferralLog,
      { referrerId: userId },
      { $add: ["$coinsAwarded", "$bonusAwarded"] },
    ),
    aggregateTotal(
      WelfareClaim,
      { userId, createdAt: { $gte: startToday } },
      "$reward",
    ),
    aggregateTotal(WelfareClaim, { userId }, "$reward"),
    aggregateTotal(
      Transaction,
      { ...transactionCreditMatch, createdAt: { $gte: startToday } },
      "$amount",
    ),
    aggregateTotal(Transaction, transactionCreditMatch, "$amount"),
    aggregateTotal(
      Transaction,
      { userId, direction: "debit", createdAt: { $gte: startToday } },
      "$amount",
    ),
    aggregateTotal(Transaction, { userId, direction: "debit" }, "$amount"),
    aggregateTotal(
      VipLog,
      { userId, createdAt: { $gte: startToday } },
      "$coinsPaid",
    ),
    aggregateTotal(VipLog, { userId }, "$coinsPaid"),
  ]);

  return {
    earnedToday:
      todayGift + todayWatch + todayReferral + todayWelfare + todayCreditTx,
    earnedAllTime:
      totalGift + totalWatch + totalReferral + totalWelfare + totalCreditTx,
    spentToday: todayDebitTx + todayVipSpent,
    spentAllTime: totalDebitTx + totalVipSpent,
  };
}

export async function getWelfareUserSnapshot(userId: string) {
  const [user, stats] = await Promise.all([
    User.findById(userId).select("coins bonusCoins").lean<{
      coins?: number;
      bonusCoins?: number;
    } | null>(),
    getCoinActivityStats(userId),
  ]);

  return {
    coins: user?.coins ?? 0,
    bonusCoins: user?.bonusCoins ?? 0,
    stats,
  };
}
