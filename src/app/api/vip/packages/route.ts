import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import RankConfig, { DEFAULT_RANKS } from "@/models/RankConfig";

export const dynamic = "force-dynamic";

// GET /api/vip/packages — public: list active packages
export async function GET() {
  await connectDB();
  const count = await RankConfig.countDocuments();
  if (count === 0) {
    await RankConfig.insertMany(DEFAULT_RANKS);
  }

  const packages = await RankConfig.find({ isActive: { $ne: false } })
    .sort({ order: 1, rank: 1 })
    .lean();
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
      isActive: Boolean(tier.isActive),
      order: Number(tier.order ?? tier.rank),
      updatedAt: tier.updatedAt,
    })),
  );
}
