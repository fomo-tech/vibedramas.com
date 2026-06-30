import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import RankConfig, { DEFAULT_RANKS } from "@/models/RankConfig";
import { getSession } from "@/lib/auth";
import { expRewardForRank, requiredExpForRank } from "@/lib/giftRanks";

export const dynamic = "force-dynamic";

async function ensureSeeded() {
  const count = await RankConfig.countDocuments();
  if (count === 0) await RankConfig.insertMany(DEFAULT_RANKS);
}

/** GET /api/admin/ranks — list all 5 ranks */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  await ensureSeeded();
  const ranks = await RankConfig.find().sort({ rank: 1 }).lean();
  return NextResponse.json(
    ranks.map((rank) => ({
      ...rank,
      expReward: expRewardForRank(rank),
      requiredExp: requiredExpForRank(rank),
    })),
  );
}

/** PUT /api/admin/ranks — update a single rank */
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    rank,
    name,
    coinsReward,
    expReward,
    requiredExp,
    watchSeconds,
    isActive,
    order,
    badge,
    badgeVariant,
  } = body;

  const rankNum = Number(rank);
  const coinsRewardNum = Number(coinsReward);
  const expRewardNum = Number(expReward);
  const requiredExpNum = Number(requiredExp);
  const watchSecondsNum = Number(watchSeconds);

  if (!name || Number.isNaN(rankNum)) {
    return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
  }
  if (rankNum < 1 || rankNum > 5) {
    return NextResponse.json(
      { error: "Rank phải từ 1 đến 5" },
      { status: 400 },
    );
  }
  if (
    !Number.isFinite(coinsRewardNum) ||
    !Number.isFinite(expRewardNum) ||
    !Number.isFinite(requiredExpNum) ||
    !Number.isFinite(watchSecondsNum) ||
    coinsRewardNum < 1 ||
    expRewardNum < 1 ||
    requiredExpNum < 0 ||
    watchSecondsNum < 10 ||
    !Number.isInteger(requiredExpNum)
  ) {
    return NextResponse.json(
      { error: "Giá trị không hợp lệ" },
      { status: 400 },
    );
  }

  await connectDB();
  await ensureSeeded();

  const updated = await RankConfig.findOneAndUpdate(
    { rank: rankNum },
    {
      name: String(name).trim(),
      coinsReward: coinsRewardNum,
      expReward: expRewardNum,
      requiredExp: requiredExpNum,
      watchSeconds: watchSecondsNum,
      isActive: isActive !== false,
      order: Number(order ?? rankNum),
      badge: String(badge ?? "").trim() || undefined,
      badgeVariant:
        badgeVariant === "popular" || badgeVariant === "best"
          ? badgeVariant
          : undefined,
    },
    { returnDocument: "after", upsert: true },
  );

  return NextResponse.json(updated);
}
