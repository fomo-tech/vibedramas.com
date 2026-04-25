import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import RankConfig, { DEFAULT_RANKS } from "@/models/RankConfig";

export const dynamic = "force-dynamic";

// GET /api/gift/ranks — public rank tiers for user guidance
export async function GET() {
  await connectDB();

  const count = await RankConfig.countDocuments();
  if (count === 0) {
    await RankConfig.insertMany(DEFAULT_RANKS);
  }

  const ranks = await RankConfig.find()
    .sort({ rank: 1 })
    .select("rank name coinsReward watchSeconds")
    .lean();

  return NextResponse.json(Array.isArray(ranks) ? ranks : []);
}
