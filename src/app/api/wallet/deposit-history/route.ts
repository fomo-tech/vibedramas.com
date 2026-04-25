import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import DepositOrder from "@/models/DepositOrder";

export const dynamic = "force-dynamic";

/** GET /api/wallet/deposit-history?page=1&limit=20 */
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
    DepositOrder.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    DepositOrder.countDocuments({ userId }),
  ]);

  return NextResponse.json({
    items: items.map((d) => ({
      id: String(d._id),
      type: "deposit",
      amount: d.amount,
      description: `Nạp tiền #${d.orderCode}`,
      status: d.status,
      metadata: {
        orderCode: d.orderCode,
        completedAt: d.completedAt,
      },
      createdAt: (d.createdAt as Date).toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
