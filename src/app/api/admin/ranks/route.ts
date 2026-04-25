import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import RankConfig, { DEFAULT_RANKS } from "@/models/RankConfig";
import { getSession } from "@/lib/auth";

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
  return NextResponse.json(ranks);
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
    watchSeconds,
    price,
    days,
    coinsPerMinute,
    isActive,
    order,
    badge,
    badgeVariant,
  } = body;

  const rankNum = Number(rank);
  const coinsRewardNum = Number(coinsReward);
  const watchSecondsNum = Number(watchSeconds);
  const priceNum = Number(price);
  const daysNum = Number(days);
  const coinsPerMinuteNum = Number(coinsPerMinute);

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
    !Number.isFinite(watchSecondsNum) ||
    !Number.isFinite(priceNum) ||
    !Number.isFinite(daysNum) ||
    !Number.isFinite(coinsPerMinuteNum) ||
    coinsRewardNum < 1 ||
    watchSecondsNum < 10 ||
    priceNum < 0 ||
    daysNum < 1 ||
    coinsPerMinuteNum < 0
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
      watchSeconds: watchSecondsNum,
      price: priceNum,
      days: daysNum,
      coinsPerMinute: coinsPerMinuteNum,
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
