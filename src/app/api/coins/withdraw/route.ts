import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import WithdrawRequest from "@/models/WithdrawRequest";
import User from "@/models/User";
import { getUserSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { sendTelegram, fmtVND } from "@/lib/telegram";
import { MIN_WITHDRAW_COINS } from "@/constants/coinPackages";

// POST: Tạo yêu cầu rút tiền
export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 withdraw requests per 5 minutes per IP
    const limited = await rateLimit(req, {
      windowMs: 300,
      max: 5,
      keyPrefix: "rl:withdraw",
    });
    if (limited) return limited;

    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const { amount, bankName, accountNumber, accountName, userNote } = body;

    if (!amount || amount < MIN_WITHDRAW_COINS) {
      return NextResponse.json(
        {
          error: `Số tiền rút tối thiểu ${MIN_WITHDRAW_COINS.toLocaleString("vi-VN")} xu`,
        },
        { status: 400 },
      );
    }

    if (!bankName || !accountNumber || !accountName) {
      return NextResponse.json(
        { error: "Thiếu thông tin tài khoản ngân hàng" },
        { status: 400 },
      );
    }

    // Lấy user
    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Kiểm tra số dư
    if (user.coins < amount) {
      return NextResponse.json({ error: "Số dư không đủ" }, { status: 400 });
    }

    // Trừ tiền tài khoản ngay
    user.coins -= amount;
    await user.save();

    // Tạo withdraw request
    const request = await WithdrawRequest.create({
      userId: user._id.toString(),
      amount,
      paymentMethodSnapshot: {
        type: "bank",
        bankName,
        accountNumber,
        accountName,
      },
      status: "pending",
      userNote: userNote || "",
    });

    // Notify admin via Telegram (non-blocking)
    sendTelegram(
      `💸 <b>Yêu cầu rút tiền mới</b>\n` +
        `👤 User: <b>${user.username || user.email}</b>\n` +
        `💵 Số tiền: <b>${fmtVND(amount)}</b>\n` +
        `🏦 Ngân hàng: ${bankName} - ${accountNumber}\n` +
        `👤 Chủ TK: ${accountName}`,
    );

    return NextResponse.json(
      {
        message: "Yêu cầu rút tiền đã được tạo",
        request: {
          _id: request._id,
          amount: request.amount,
          status: request.status,
          createdAt: request.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 },
    );
  }
}

// GET: Lấy lịch sử rút tiền của user
export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const requests = await WithdrawRequest.find({ userId: user._id.toString() })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json(requests);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 },
    );
  }
}
