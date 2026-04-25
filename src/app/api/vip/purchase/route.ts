import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import RankConfig, { DEFAULT_RANKS } from "@/models/RankConfig";
import VipLog from "@/models/VipLog";
import User from "@/models/User";
import { getUserSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

function toFiniteNumber(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

// POST /api/vip/purchase — user buys a tier package with coins
export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const packageId = String(body?.packageId ?? "").trim();
    if (!packageId) {
      return NextResponse.json({ error: "Thiếu packageId" }, { status: 400 });
    }
    if (!mongoose.isValidObjectId(packageId)) {
      return NextResponse.json(
        { error: "packageId không hợp lệ" },
        { status: 400 },
      );
    }

    await connectDB();

    const count = await RankConfig.countDocuments();
    if (count === 0) {
      await RankConfig.insertMany(DEFAULT_RANKS);
    }

    const pkg = await RankConfig.findById(packageId).lean<{
      _id: { toString(): string };
      rank: number;
      name: string;
      days: number;
      price: number;
      coinsPerMinute: number;
      isActive: boolean;
    }>();

    if (!pkg || pkg.isActive === false) {
      return NextResponse.json(
        { error: "Gói không tồn tại hoặc không còn hoạt động" },
        { status: 404 },
      );
    }

    const pkgPrice = toFiniteNumber(pkg.price, 0);
    const pkgDays = toFiniteNumber(pkg.days, 30);
    const pkgCoinsPerMinute = toFiniteNumber(pkg.coinsPerMinute, 1);

    if (pkgPrice < 0 || pkgDays < 1 || pkgCoinsPerMinute < 0) {
      return NextResponse.json(
        { error: "Gói chưa được cấu hình hợp lệ, vui lòng liên hệ admin" },
        { status: 400 },
      );
    }

    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json(
        { error: "Không tìm thấy người dùng" },
        { status: 404 },
      );
    }

    const userCoins = toFiniteNumber(user.coins, 0);

    if (userCoins < pkgPrice) {
      return NextResponse.json(
        { error: "Không đủ xu", required: pkgPrice, current: userCoins },
        { status: 402 },
      );
    }

    const now = new Date();
    // New package purchase always starts from now, not from previous VIP expiry.
    const vipFrom = now;
    const newExpiry = new Date(
      vipFrom.getTime() + pkgDays * 24 * 60 * 60 * 1000,
    );

    user.coins = userCoins - pkgPrice;
    user.vipStatus = true;
    user.vipExpiry = newExpiry;
    user.vipCoinsPerMinute = pkgCoinsPerMinute;
    user.vipPackageName = pkg.name;
    user.giftLevel = Number(pkg.rank ?? 1);
    await user.save();

    await VipLog.create({
      userId: session.userId,
      packageId: pkg._id.toString(),
      packageName: pkg.name,
      days: pkgDays,
      coinsPaid: pkgPrice,
      coinsPerMinute: pkgCoinsPerMinute,
      giftRank: Number(pkg.rank ?? 1),
      vipFrom,
      vipTo: newExpiry,
    });

    return NextResponse.json({
      ok: true,
      newCoins: user.coins,
      vipStatus: true,
      vipExpiry: newExpiry.toISOString(),
      packageName: pkg.name,
      giftRank: Number(pkg.rank ?? 1),
      newGiftLevel: Number(user.giftLevel ?? 1),
      coinsPerMinute: pkgCoinsPerMinute,
    });
  } catch (error) {
    console.error("[vip/purchase] failed", error);
    return NextResponse.json(
      { error: "Không thể xử lý mua gói lúc này" },
      { status: 500 },
    );
  }
}
