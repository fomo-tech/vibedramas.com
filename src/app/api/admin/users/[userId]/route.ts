import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import CoinLog from "@/models/CoinLog";
import GiftLog from "@/models/GiftLog";
import ReferralLog from "@/models/ReferralLog";
import Transaction from "@/models/Transaction";
import VipLog from "@/models/VipLog";
import WatchHistory from "@/models/WatchHistory";
import WelfareClaim from "@/models/WelfareClaim";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function parsePage(value: string | null) {
  const page = Number(value ?? 1);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function parseLimit(value: string | null, fallback: number) {
  const limit = Number(value ?? fallback);
  if (!Number.isFinite(limit) || limit <= 0) return fallback;
  return Math.min(Math.floor(limit), 50);
}

function paginationMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const session = await getSession();
  if (!session || session.role !== "admin") return unauthorized();

  const { userId } = await params;
  const searchParams = req.nextUrl.searchParams;
  const transactionsPage = parsePage(searchParams.get("transactionsPage"));
  const vipLogsPage = parsePage(searchParams.get("vipLogsPage"));
  const giftLogsPage = parsePage(searchParams.get("giftLogsPage"));
  const welfareClaimsPage = parsePage(searchParams.get("welfareClaimsPage"));
  const referralLogsPage = parsePage(searchParams.get("referralLogsPage"));
  const coinLogsPage = parsePage(searchParams.get("coinLogsPage"));
  const watchHistoryPage = parsePage(searchParams.get("watchHistoryPage"));

  const transactionsLimit = parseLimit(
    searchParams.get("transactionsLimit"),
    20,
  );
  const vipLogsLimit = parseLimit(searchParams.get("vipLogsLimit"), 10);
  const giftLogsLimit = parseLimit(searchParams.get("giftLogsLimit"), 10);
  const welfareClaimsLimit = parseLimit(
    searchParams.get("welfareClaimsLimit"),
    10,
  );
  const referralLogsLimit = parseLimit(
    searchParams.get("referralLogsLimit"),
    10,
  );
  const coinLogsLimit = parseLimit(searchParams.get("coinLogsLimit"), 10);
  const watchHistoryLimit = parseLimit(
    searchParams.get("watchHistoryLimit"),
    10,
  );

  await connectDB();

  const user = await User.findById(userId).lean();
  if (!user) {
    return NextResponse.json(
      { error: "Không tìm thấy người dùng" },
      { status: 404 },
    );
  }

  const userIdString = String(user._id);

  const referralFilter = {
    $or: [{ referrerId: userIdString }, { refereeId: userIdString }],
  };
  const [
    latestGiftLog,
    allTransactions,
    allWelfareClaims,
    allReferralLogs,
    allGiftLogs,
    allWatchHistory,
    allVipLogs,
    transactions,
    transactionsTotal,
    vipLogs,
    vipLogsTotal,
    giftLogs,
    giftLogsTotal,
    welfareClaims,
    welfareClaimsTotal,
    referralLogs,
    referralLogsTotal,
    coinLogs,
    coinLogsTotal,
    watchHistory,
    watchHistoryTotal,
  ] = await Promise.all([
    GiftLog.findOne({ userId: userIdString }).sort({ createdAt: -1 }).lean(),
    Transaction.find({ userId: userIdString }).lean(),
    WelfareClaim.find({ userId: userIdString }).lean(),
    ReferralLog.find(referralFilter).lean(),
    GiftLog.find({ userId: userIdString }).lean(),
    WatchHistory.find({ userId: userIdString }).lean(),
    VipLog.find({ userId: userIdString }).lean(),

    Transaction.find({ userId: userIdString })
      .sort({ createdAt: -1 })
      .skip((transactionsPage - 1) * transactionsLimit)
      .limit(transactionsLimit)
      .lean(),
    Transaction.countDocuments({ userId: userIdString }),

    VipLog.find({ userId: userIdString })
      .sort({ createdAt: -1 })
      .skip((vipLogsPage - 1) * vipLogsLimit)
      .limit(vipLogsLimit)
      .lean(),
    VipLog.countDocuments({ userId: userIdString }),

    GiftLog.find({ userId: userIdString })
      .sort({ createdAt: -1 })
      .skip((giftLogsPage - 1) * giftLogsLimit)
      .limit(giftLogsLimit)
      .lean(),
    GiftLog.countDocuments({ userId: userIdString }),

    WelfareClaim.find({ userId: userIdString })
      .sort({ createdAt: -1 })
      .skip((welfareClaimsPage - 1) * welfareClaimsLimit)
      .limit(welfareClaimsLimit)
      .lean(),
    WelfareClaim.countDocuments({ userId: userIdString }),

    ReferralLog.find(referralFilter)
      .sort({ createdAt: -1 })
      .skip((referralLogsPage - 1) * referralLogsLimit)
      .limit(referralLogsLimit)
      .lean(),
    ReferralLog.countDocuments(referralFilter),

    CoinLog.find({ userId: userIdString })
      .sort({ createdAt: -1 })
      .skip((coinLogsPage - 1) * coinLogsLimit)
      .limit(coinLogsLimit)
      .lean(),
    CoinLog.countDocuments({ userId: userIdString }),

    WatchHistory.find({ userId: userIdString })
      .sort({ watchedAt: -1 })
      .skip((watchHistoryPage - 1) * watchHistoryLimit)
      .limit(watchHistoryLimit)
      .lean(),
    WatchHistory.countDocuments({ userId: userIdString }),
  ]);

  const totalCredits = allTransactions
    .filter((item) => item.direction === "credit")
    .reduce((sum, item) => sum + item.amount, 0);
  const totalDebits = allTransactions
    .filter((item) => item.direction === "debit")
    .reduce((sum, item) => sum + item.amount, 0);

  const summary = {
    soDuXu: user.coins ?? 0,
    xuThuong: user.bonusCoins ?? 0,
    tongNap: allTransactions
      .filter((item) => item.type === "topup")
      .reduce((sum, item) => sum + item.amount, 0),
    tongRutMoKhoa: allTransactions
      .filter((item) => item.type === "spend_unlock")
      .reduce((sum, item) => sum + item.amount, 0),
    tongTangXu: allTransactions
      .filter((item) => item.type === "coin_gift_sent")
      .reduce((sum, item) => sum + item.amount, 0),
    tongNhanXu: allTransactions
      .filter((item) => item.type === "coin_gift_received")
      .reduce((sum, item) => sum + item.amount, 0),
    tongKiemTuXem: allTransactions
      .filter((item) => item.type === "earn_watch")
      .reduce((sum, item) => sum + item.amount, 0),
    tongKiemTuHopQua: allTransactions
      .filter((item) => item.type === "earn_gift_box")
      .reduce((sum, item) => sum + item.amount, 0),
    tongKiemTuGioiThieu: allTransactions
      .filter((item) => item.type === "earn_referral")
      .reduce((sum, item) => sum + item.amount, 0),
    tongPhucLoi: allWelfareClaims.reduce((sum, item) => sum + item.reward, 0),
    tongCongXu: totalCredits,
    tongTruXu: totalDebits,
    tongLanMuaVip: allVipLogs.length,
    tongLanMoHopQua: allGiftLogs.length,
    tongLanXemGanDay: allWatchHistory.length,
    tongGiaoDich: allTransactions.length,
    tongLuotNhanPhucLoi: allWelfareClaims.length,
    tongLuotGioiThieu: allReferralLogs.filter(
      (item) => String(item.referrerId) === userIdString,
    ).length,
  };

  return NextResponse.json({
    user: {
      ...user,
      _id: userIdString,
      lastLoginIp: user.lastLoginIp || latestGiftLog?.ip || "unknown",
      lastLoginUserAgent:
        user.lastLoginUserAgent || latestGiftLog?.ua || "unknown",
      lastLoginAt:
        (user.lastLoginAt as Date | undefined)?.toISOString?.() ||
        (latestGiftLog?.createdAt as Date | undefined)?.toISOString?.(),
      createdAt: (user.createdAt as Date)?.toISOString(),
      updatedAt: (user.updatedAt as Date)?.toISOString(),
      vipExpiry: (user.vipExpiry as Date | undefined)?.toISOString?.(),
    },
    summary,
    pagination: {
      transactions: paginationMeta(
        transactionsTotal,
        transactionsPage,
        transactionsLimit,
      ),
      vipLogs: paginationMeta(vipLogsTotal, vipLogsPage, vipLogsLimit),
      giftLogs: paginationMeta(giftLogsTotal, giftLogsPage, giftLogsLimit),
      welfareClaims: paginationMeta(
        welfareClaimsTotal,
        welfareClaimsPage,
        welfareClaimsLimit,
      ),
      referralLogs: paginationMeta(
        referralLogsTotal,
        referralLogsPage,
        referralLogsLimit,
      ),
      coinLogs: paginationMeta(coinLogsTotal, coinLogsPage, coinLogsLimit),
      watchHistory: paginationMeta(
        watchHistoryTotal,
        watchHistoryPage,
        watchHistoryLimit,
      ),
    },
    activities: {
      transactions: transactions.map((item) => ({
        ...item,
        _id: String(item._id),
        createdAt: (item.createdAt as Date)?.toISOString(),
      })),
      vipLogs: vipLogs.map((item) => ({
        _id: String(item._id),
        userId: String(item.userId),
        packageId: String(item.packageId),
        packageName: String(item.packageName),
        days: Number(item.days ?? 0),
        coinsPaid: Number(item.coinsPaid ?? 0),
        coinsPerMinute: Number(item.coinsPerMinute ?? 0),
        giftRank: Number(item.giftRank ?? 1),
        createdAt: (item.createdAt as Date)?.toISOString(),
        vipFrom: (item.vipFrom as Date)?.toISOString(),
        vipTo: (item.vipTo as Date)?.toISOString(),
      })),
      giftLogs: giftLogs.map((item) => ({
        ...item,
        _id: String(item._id),
        createdAt: (item.createdAt as Date)?.toISOString(),
      })),
      welfareClaims: welfareClaims.map((item) => ({
        ...item,
        _id: String(item._id),
        createdAt: (item.createdAt as Date)?.toISOString(),
      })),
      referralLogs: referralLogs.map((item) => ({
        ...item,
        _id: String(item._id),
        createdAt: (item.createdAt as Date)?.toISOString(),
      })),
      coinLogs: coinLogs.map((item) => ({
        ...item,
        _id: String(item._id),
        createdAt: (item.createdAt as Date)?.toISOString(),
      })),
      watchHistory: watchHistory.map((item) => ({
        ...item,
        _id: String(item._id),
        watchedAt: (item.watchedAt as Date)?.toISOString(),
      })),
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const session = await getSession();
  if (!session || session.role !== "admin") return unauthorized();

  const { userId } = await params;
  const body = await req.json();

  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json(
      { error: "Không tìm thấy người dùng" },
      { status: 404 },
    );
  }

  const username = normalizeText(body.username);
  const email = normalizeText(body.email).toLowerCase();
  const referralCode = normalizeText(body.referralCode).toUpperCase();
  const avatar = normalizeText(body.avatar);
  const role = normalizeText(body.role);
  const vipPackageName = normalizeText(body.vipPackageName);
  const vipExpiryInput = body.vipExpiry;

  if (!username || !email) {
    return NextResponse.json(
      { error: "Tên user và email là bắt buộc" },
      { status: 400 },
    );
  }

  if (role && role !== "user" && role !== "admin") {
    return NextResponse.json(
      { error: "Vai trò không hợp lệ" },
      { status: 400 },
    );
  }

  const duplicateUser = await User.findOne({
    _id: { $ne: userId },
    $or: [{ username }, { email }, ...(referralCode ? [{ referralCode }] : [])],
  })
    .select("username email referralCode")
    .lean();

  if (duplicateUser) {
    return NextResponse.json(
      { error: "Tên user, email hoặc mã giới thiệu đã tồn tại" },
      { status: 409 },
    );
  }

  let vipExpiry: Date | undefined;
  if (vipExpiryInput) {
    const parsedDate = new Date(String(vipExpiryInput));
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "Hạn VIP không hợp lệ" },
        { status: 400 },
      );
    }
    vipExpiry = parsedDate;
  }

  const vipStatus = Boolean(body.vipStatus);

  user.username = username;
  user.email = email;
  user.role = role === "admin" ? "admin" : "user";
  user.avatar = avatar || undefined;
  user.coins = Math.max(0, normalizeNumber(body.coins, user.coins ?? 0));
  user.bonusCoins = Math.max(
    0,
    normalizeNumber(body.bonusCoins, user.bonusCoins ?? 0),
  );
  user.vipStatus = vipStatus;
  user.vipCoinsPerMinute = vipStatus
    ? Math.max(0, normalizeNumber(body.vipCoinsPerMinute, 0))
    : 0;
  user.vipPackageName = vipStatus ? vipPackageName : "";
  user.vipExpiry = vipStatus ? vipExpiry : undefined;
  user.giftLevel = Math.min(5, Math.max(1, normalizeNumber(body.giftLevel, 1)));
  user.referralCode = referralCode || user.referralCode;
  user.referralCount = Math.max(
    0,
    normalizeNumber(body.referralCount, user.referralCount ?? 0),
  );

  await user.save();

  return NextResponse.json({
    ok: true,
    user: {
      _id: String(user._id),
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      coins: user.coins,
      bonusCoins: user.bonusCoins,
      vipStatus: user.vipStatus,
      vipExpiry: user.vipExpiry?.toISOString?.(),
      vipPackageName: user.vipPackageName,
      vipCoinsPerMinute: user.vipCoinsPerMinute,
      giftLevel: user.giftLevel,
      referralCode: user.referralCode,
      referralCount: user.referralCount,
      updatedAt: user.updatedAt?.toISOString?.(),
    },
  });
}
