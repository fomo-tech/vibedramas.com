import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { getUserSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import GiftLog from "@/models/GiftLog";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, {
    windowMs: 60,
    max: 30,
    keyPrefix: "rl:gift:shopee-click",
  });
  if (limited) return limited;

  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { claimId?: string };
  const claimId = body.claimId?.trim().slice(0, 160);
  if (!claimId) {
    return NextResponse.json({ error: "Thiếu mã nhận quà" }, { status: 400 });
  }

  await connectDB();
  const claimed = await GiftLog.findOneAndUpdate(
    {
      claimId,
      userId: String(session.userId),
      shopeeClickedAt: { $exists: false },
    },
    {
      $set: { shopeeClickedAt: new Date() },
    },
    { returnDocument: "after" },
  );

  if (!claimed) {
    const existing = await GiftLog.findOne({
      claimId,
      userId: String(session.userId),
    }).lean();
    if (!existing) {
      return NextResponse.json({ error: "Phần quà không hợp lệ" }, { status: 404 });
    }
    return NextResponse.json({
      alreadyClaimed: true,
      coinsEarned: Number(existing.shopeeCoinsEarned) || 0,
      newCoins: null,
      productUrl: existing.productUrl || null,
    });
  }

  const coinsEarned = Math.max(0, Number(claimed.shopeeCoinsReward) || 0);
  const updatedUser = await User.findByIdAndUpdate(
    session.userId,
    { $inc: { coins: coinsEarned } },
    { returnDocument: "after" },
  ).select("coins");

  if (!updatedUser) {
    await GiftLog.updateOne(
      { _id: claimed._id, shopeeClickedAt: claimed.shopeeClickedAt },
      { $unset: { shopeeClickedAt: 1 } },
    );
    return NextResponse.json({ error: "Không thể cộng xu" }, { status: 500 });
  }

  await GiftLog.updateOne(
    { _id: claimed._id },
    { $set: { shopeeCoinsEarned: coinsEarned } },
  );

  return NextResponse.json({
    alreadyClaimed: false,
    coinsEarned,
    newCoins: updatedUser.coins,
    productUrl: claimed.productUrl || null,
  });
}
