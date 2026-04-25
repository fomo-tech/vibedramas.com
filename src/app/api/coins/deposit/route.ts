import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import DepositOrder from "@/models/DepositOrder";
import BankAccount from "@/models/BankAccount";
import User from "@/models/User";
import { getUserSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { sendTelegram, fmtVND } from "@/lib/telegram";

// Hàm generate mã order unique
function generateOrderCode(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `VD${timestamp}${random}`.toUpperCase();
}

// Hàm tạo QR code URL (VietQR)
function generateQRCodeUrl(
  bankCode: string,
  accountNumber: string,
  accountName: string,
  amount: number,
  orderCode: string,
): string {
  const template = "compact"; // hoặc "compact2", "qr_only"
  const description = encodeURIComponent(orderCode);

  // VietQR API
  return `https://img.vietqr.io/image/${bankCode}-${accountNumber}-${template}.png?amount=${amount}&addInfo=${description}&accountName=${encodeURIComponent(accountName)}`;
}

// Mapping tên ngân hàng sang mã ngân hàng (cần expand thêm)
const BANK_CODE_MAP: Record<string, string> = {
  Vietcombank: "VCB",
  Techcombank: "TCB",
  BIDV: "BIDV",
  Vietinbank: "CTG",
  ACB: "ACB",
  MB: "MB",
  Sacombank: "STB",
  VPBank: "VPB",
  Agribank: "AGR",
  OCB: "OCB",
  TPBank: "TPB",
  VIB: "VIB",
  SHB: "SHB",
};

// POST: Tạo order nạp tiền
export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 deposit requests per minute per IP
    const limited = await rateLimit(req, {
      windowMs: 60,
      max: 10,
      keyPrefix: "rl:deposit",
    });
    if (limited) return limited;

    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const { amount } = body;

    if (!amount || amount < 10000) {
      return NextResponse.json(
        { error: "Số tiền tối thiểu 10,000 VNĐ" },
        { status: 400 },
      );
    }

    // Lấy user
    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Lấy bank account active đầu tiên
    const bankAccount = await BankAccount.findOne({ isActive: true });
    if (!bankAccount) {
      return NextResponse.json(
        { error: "Không có tài khoản ngân hàng khả dụng" },
        { status: 400 },
      );
    }

    // Generate order code
    const orderCode = generateOrderCode();

    // Generate QR code
    const bankCode = BANK_CODE_MAP[bankAccount.bankName] || "VCB";
    const qrCodeUrl = generateQRCodeUrl(
      bankCode,
      bankAccount.accountNumber,
      bankAccount.accountName,
      amount,
      orderCode,
    );

    // Tạo order với thời gian hết hạn 15 phút
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const order = await DepositOrder.create({
      userId: user._id.toString(),
      amount,
      orderCode,
      bankAccountId: bankAccount._id.toString(),
      qrCodeUrl,
      status: "pending",
      expiresAt,
    });

    // Notify admin via Telegram (non-blocking)
    sendTelegram(
      `💰 <b>Yêu cầu nạp tiền mới</b>\n` +
        `👤 User: <b>${user.username || user.email}</b>\n` +
        `💵 Số tiền: <b>${fmtVND(amount)}</b>\n` +
        `🔑 Mã lệnh: <code>${orderCode}</code>\n` +
        `⏰ Hết hạn: 15 phút`,
    );

    return NextResponse.json(
      {
        order: {
          _id: order._id,
          orderCode: order.orderCode,
          amount: order.amount,
          qrCodeUrl: order.qrCodeUrl,
          expiresAt: order.expiresAt,
          bankInfo: {
            bankName: bankAccount.bankName,
            accountNumber: bankAccount.accountNumber,
            accountName: bankAccount.accountName,
          },
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

// GET: Lấy lịch sử nạp tiền của user
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

    const orders = await DepositOrder.find({ userId: user._id.toString() })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 },
    );
  }
}
