import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import connectDB from "@/lib/db";
import User from "@/models/User";
import RankConfig, { DEFAULT_RANKS } from "@/models/RankConfig";
import GiftLog from "@/models/GiftLog";
import { getUserSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { deleteCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

function toFiniteNumber(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** POST /api/gift/open — user claims their filled gift box */
export async function POST(req: NextRequest) {
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

    // Seed ranks if needed
    const count = await RankConfig.countDocuments();
    if (count === 0) await RankConfig.insertMany(DEFAULT_RANKS);

    const user = await User.findById(session.userId).select("coins giftLevel");

    if (!user) {
      return NextResponse.json(
        { error: "Không tìm thấy người dùng" },
        { status: 404 },
      );
    }

    const currentLevel = toFiniteNumber(user.giftLevel, 1);
    const ranks = await RankConfig.find().sort({ rank: 1 }).lean();

    if (!Array.isArray(ranks) || ranks.length === 0) {
      return NextResponse.json(
        { error: "Chưa có cấu hình hộp quà" },
        { status: 400 },
      );
    }

    const currentRank =
      ranks.find((r) => toFiniteNumber(r.rank, -1) === currentLevel) ??
      ranks[0];

    // Award coins only; tier is set directly by purchased package
    const normalizedLevel = Math.max(1, toFiniteNumber(currentRank.rank, 1));
    const coinsEarned = Math.max(0, toFiniteNumber(currentRank.coinsReward, 0));
    const newLevel = normalizedLevel;

    const currentCoins = toFiniteNumber(user.coins, 0);
    user.giftLevel = normalizedLevel;
    user.coins = currentCoins + coinsEarned;
    await user.save();

    // Log for abuse detection (fire-and-forget)
    const hdrs = await headers();
    const ip =
      hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      hdrs.get("x-real-ip") ??
      "unknown";
    const ua = hdrs.get("user-agent") ?? "unknown";
    GiftLog.create({
      userId: session.userId,
      giftLevel: normalizedLevel,
      rank: normalizedLevel,
      coinsEarned,
      expEarned: 0,
      leveledUp: false,
      ip,
      ua,
    }).catch(() => {});

    // Invalidate per-user gift config cache so next poll reflects updated coinsToday/Total
    deleteCache(`gift:cfg:${String(session.userId)}`).catch(() => {});

    // Determine rank after potential level-up
    const newRank =
      ranks.find((r) => toFiniteNumber(r.rank, -1) === newLevel) ?? currentRank;
    return NextResponse.json({
      coinsEarned,
      newLevel,
      newCoins: user.coins,
      rankName: String(newRank.name ?? "Khán Giả"),
      rank: Math.max(1, toFiniteNumber(newRank.rank, 1)),
    });
  } catch (error) {
    console.error("[gift/open] failed", error);
    return NextResponse.json(
      { error: "Không thể mở hộp quà lúc này" },
      { status: 500 },
    );
  }
}
