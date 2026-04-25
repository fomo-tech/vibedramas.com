import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import PaymentMethod from "@/models/PaymentMethod";
import WithdrawRequest from "@/models/WithdrawRequest";
import { rateLimit } from "@/lib/rateLimit";
import { MIN_WITHDRAW_COINS } from "@/constants/coinPackages";

export const dynamic = "force-dynamic";

/** POST /api/wallet/withdraw */
export async function POST(req: NextRequest) {
  // Rate limit: 5 withdraw requests per 5 minutes per IP
  const limited = await rateLimit(req, {
    windowMs: 300,
    max: 5,
    keyPrefix: "rl:wallet-withdraw",
  });
  if (limited) return limited;

  const session = await getUserSession();
  if (!session)
    return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body)
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ" },
      { status: 400 },
    );

  const { amount, paymentMethodId, note } = body;

  const amountNum = Number(amount);
  if (!Number.isInteger(amountNum) || amountNum < MIN_WITHDRAW_COINS)
    return NextResponse.json(
      {
        error: `Số xu tối thiểu để rút là ${MIN_WITHDRAW_COINS.toLocaleString("vi-VN")} xu`,
      },
      { status: 400 },
    );

  if (!paymentMethodId)
    return NextResponse.json(
      { error: "Vui lòng chọn phương thức thanh toán" },
      { status: 400 },
    );

  const userId = String(session.userId);
  await connectDB();

  // Validate payment method belongs to user
  const method = await PaymentMethod.findOne({ _id: paymentMethodId, userId });
  if (!method)
    return NextResponse.json(
      { error: "Phương thức thanh toán không hợp lệ" },
      { status: 400 },
    );

  // Check user balance
  const user = await User.findById(userId).select("coins");
  if (!user || (user.coins ?? 0) < amountNum)
    return NextResponse.json(
      { error: "Số dư xu không đủ để thực hiện yêu cầu rút" },
      { status: 400 },
    );

  // Create pending withdraw request (no deduction until admin approves)
  const request = await WithdrawRequest.create({
    userId,
    amount: amountNum,
    paymentMethodSnapshot: {
      type: method.type,
      bankName: method.bankName,
      accountNumber: method.accountNumber,
      accountName: method.accountName,
    },
    status: "pending",
    userNote: note?.trim() || undefined,
  });

  return NextResponse.json({
    id: String(request._id),
    amount: request.amount,
    status: request.status,
    createdAt: request.createdAt,
  });
}

/** GET /api/wallet/withdraw — list user's withdraw requests */
export async function GET(req: NextRequest) {
  const session = await getUserSession();
  if (!session)
    return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = 20;
  const skip = (page - 1) * limit;

  const userId = String(session.userId);
  await connectDB();

  const [items, total] = await Promise.all([
    WithdrawRequest.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    WithdrawRequest.countDocuments({ userId }),
  ]);

  return NextResponse.json({
    items: items.map((r) => ({
      id: String(r._id),
      amount: r.amount,
      paymentMethodSnapshot: r.paymentMethodSnapshot,
      status: r.status,
      userNote: r.userNote,
      adminNote: r.adminNote,
      processedAt: r.processedAt,
      createdAt: r.createdAt,
    })),
    totalPages: Math.ceil(total / limit),
  });
}
