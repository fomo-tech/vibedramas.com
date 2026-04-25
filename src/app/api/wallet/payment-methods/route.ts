import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import PaymentMethod from "@/models/PaymentMethod";

export const dynamic = "force-dynamic";

/** GET /api/wallet/payment-methods */
export async function GET() {
  const session = await getUserSession();
  if (!session)
    return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });

  await connectDB();

  const methods = await PaymentMethod.find({ userId: String(session.userId) })
    .sort({ isDefault: -1, createdAt: -1 })
    .lean();

  return NextResponse.json({
    items: methods.map((m) => ({
      id: String(m._id),
      type: m.type,
      bankName: m.bankName,
      bankCode: m.bankCode,
      accountNumber: m.accountNumber,
      accountName: m.accountName,
      isDefault: m.isDefault,
      createdAt: m.createdAt,
    })),
  });
}

/** POST /api/wallet/payment-methods */
export async function POST(req: NextRequest) {
  const session = await getUserSession();
  if (!session)
    return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body)
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ" },
      { status: 400 },
    );

  const { type, bankName, bankCode, accountNumber, accountName } = body;

  if (!["bank", "momo"].includes(type))
    return NextResponse.json(
      { error: "Loại phương thức không hợp lệ" },
      { status: 400 },
    );
  if (!bankName?.trim() || !accountNumber?.trim() || !accountName?.trim())
    return NextResponse.json(
      { error: "Vui lòng điền đầy đủ thông tin" },
      { status: 400 },
    );

  // Sanitize account number: digits only for bank, digits/phone for others
  const sanitizedAccount = String(accountNumber).replace(/\s/g, "");
  if (sanitizedAccount.length < 8 || sanitizedAccount.length > 30)
    return NextResponse.json(
      { error: "Số tài khoản không hợp lệ" },
      { status: 400 },
    );

  await connectDB();

  const userId = String(session.userId);

  // Per user limit: max 10 methods
  const count = await PaymentMethod.countDocuments({ userId });
  if (count >= 10)
    return NextResponse.json(
      { error: "Tối đa 10 phương thức thanh toán" },
      { status: 400 },
    );

  // If this is the first method, make it default
  const makeDefault = count === 0;

  const method = await PaymentMethod.create({
    userId,
    type,
    bankName: bankName.trim(),
    bankCode: bankCode?.trim() || undefined,
    accountNumber: sanitizedAccount,
    accountName: accountName.trim(),
    isDefault: makeDefault,
  });

  return NextResponse.json({
    id: String(method._id),
    type: method.type,
    bankName: method.bankName,
    bankCode: method.bankCode,
    accountNumber: method.accountNumber,
    accountName: method.accountName,
    isDefault: method.isDefault,
  });
}
