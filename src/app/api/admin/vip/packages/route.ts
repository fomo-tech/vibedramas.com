import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import RankConfig, { DEFAULT_RANKS } from "@/models/RankConfig";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function ensureSeeded() {
  const count = await RankConfig.countDocuments();
  if (count === 0) {
    await RankConfig.insertMany(DEFAULT_RANKS);
  }
}

// GET /api/admin/vip/packages — compatibility list from unified tiers
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  await ensureSeeded();
  const packages = await RankConfig.find().sort({ order: 1, rank: 1 }).lean();
  return NextResponse.json(
    packages.map((tier) => ({
      _id: String(tier._id),
      name: tier.name,
      days: Number(tier.days ?? 30),
      price: Number(tier.price ?? 0),
      coinsPerMinute: Number(tier.coinsPerMinute ?? 1),
      giftRank: Number(tier.rank),
      badge: tier.badge,
      badgeVariant: tier.badgeVariant,
      isActive: tier.isActive !== false,
      order: Number(tier.order ?? tier.rank),
      updatedAt: tier.updatedAt,
    })),
  );
}

// POST /api/admin/vip/packages — compatibility upsert into unified tier
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    name,
    days,
    price,
    coinsPerMinute,
    giftRank,
    badge,
    badgeVariant,
    isActive,
    order,
  } = body;

  if (!name || !days || price == null || coinsPerMinute == null) {
    return NextResponse.json(
      { error: "Thiếu thông tin bắt buộc" },
      { status: 400 },
    );
  }
  if (
    days < 1 ||
    price < 0 ||
    coinsPerMinute < 0 ||
    Number(giftRank ?? 1) < 1 ||
    Number(giftRank ?? 1) > 5
  ) {
    return NextResponse.json(
      { error: "Giá trị không hợp lệ" },
      { status: 400 },
    );
  }

  await connectDB();
  await ensureSeeded();

  const rank = Number(giftRank ?? 1);
  const pkg = await RankConfig.findOneAndUpdate(
    { rank },
    {
      name: String(name).trim(),
      days: Number(days),
      price: Number(price),
      coinsPerMinute: Number(coinsPerMinute),
      badge: badge || undefined,
      badgeVariant:
        badgeVariant === "popular" || badgeVariant === "best"
          ? badgeVariant
          : undefined,
      isActive: isActive !== false,
      order: Number(order ?? rank),
    },
    { returnDocument: "after" },
  ).lean();

  if (!pkg) {
    return NextResponse.json({ error: "Không tìm thấy bậc" }, { status: 404 });
  }

  return NextResponse.json(
    {
      _id: String(pkg._id),
      name: pkg.name,
      days: Number(pkg.days ?? 30),
      price: Number(pkg.price ?? 0),
      coinsPerMinute: Number(pkg.coinsPerMinute ?? 1),
      giftRank: Number(pkg.rank),
      badge: pkg.badge,
      badgeVariant: pkg.badgeVariant,
      isActive: pkg.isActive !== false,
      order: Number(pkg.order ?? pkg.rank),
      updatedAt: pkg.updatedAt,
    },
    { status: 201 },
  );
}
