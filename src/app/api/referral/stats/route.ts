import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import ReferralLog from "@/models/ReferralLog";
import { ensureReferralConfig } from "@/lib/referral";
import {
  DEFAULT_REFERRAL_CONFIG,
  type IReferralMilestone,
} from "@/models/ReferralConfig";

export const dynamic = "force-dynamic";

export function getMilestone(count: number, milestones: IReferralMilestone[]) {
  return (
    milestones.find((m) => count >= m.min) ??
    milestones[milestones.length - 1] ??
    DEFAULT_REFERRAL_CONFIG.milestones[
      DEFAULT_REFERRAL_CONFIG.milestones.length - 1
    ]
  );
}

export function getNextMilestone(
  count: number,
  milestones: IReferralMilestone[],
) {
  const sorted = [...milestones].reverse(); // ascending
  return sorted.find((m) => count < m.min) ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId)
      return NextResponse.json({ error: "userId required" }, { status: 400 });

    await connectDB();
    const referralConfig = await ensureReferralConfig();

    const user = (await User.findById(userId)
      .select("referralCode referralCount coins")
      .lean()) as any;

    if (!user)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const logs = await ReferralLog.find({ referrerId: userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const current = getMilestone(
      user.referralCount ?? 0,
      referralConfig.milestones,
    );
    const next = getNextMilestone(
      user.referralCount ?? 0,
      referralConfig.milestones,
    );

    return NextResponse.json({
      referralCode: user.referralCode ?? null,
      referralCount: user.referralCount ?? 0,
      coins: user.coins ?? 0,
      currentMilestone: current,
      nextMilestone: next,
      allMilestones: referralConfig.milestones,
      recentReferrals: logs.map((l: any) => ({
        id: l._id,
        coinsAwarded: l.coinsAwarded,
        bonusAwarded: l.bonusAwarded,
        milestone: l.milestone,
        createdAt: l.createdAt,
      })),
    });
  } catch (err) {
    console.error("[referral/stats]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
