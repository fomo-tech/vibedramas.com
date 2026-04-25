import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import WithdrawRequest from "@/models/WithdrawRequest";

export const dynamic = "force-dynamic";

/** GET /api/wallet/withdraw-history?page=1&limit=20 */
export async function GET(req: NextRequest) {
  const session = await getUserSession();
  if (!session)
    return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));
  const skip = (page - 1) * limit;

  await connectDB();

  const userId = String(session.userId);

  const [items, total] = await Promise.all([
    WithdrawRequest.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    WithdrawRequest.countDocuments({ userId }),
  ]);

  return NextResponse.json({
    items: items.map((w) => ({
      id: String(w._id),
      type: "withdraw",
      amount: w.amount,
      description: `Rút xu về ${w.paymentMethodSnapshot?.bankName ?? "tài khoản"}`,
      status: w.status,
      metadata: {
        bankName: w.paymentMethodSnapshot?.bankName,
        accountNumber: w.paymentMethodSnapshot?.accountNumber,
        accountName: w.paymentMethodSnapshot?.accountName,
        adminNote: w.adminNote,
        processedAt: w.processedAt,
      },
      createdAt: (w.createdAt as Date).toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
