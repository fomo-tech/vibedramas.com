import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import TopupOrder from "@/models/TopupOrder";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ orderId: string }> };

/** GET /api/wallet/topup/check/[orderId] */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await getUserSession();
  if (!session)
    return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });

  const { orderId } = await params;

  await connectDB();

  const order = await TopupOrder.findOne({
    orderId,
    userId: String(session.userId),
  }).lean<{
    orderId: string;
    status: string;
    coins: number;
    packageLabel: string;
    amount: number;
    expiresAt: Date;
    paidAt?: Date;
  }>();

  if (!order) {
    return NextResponse.json({ error: "Đơn không tồn tại" }, { status: 404 });
  }

  // Auto-expire
  const isExpired =
    order.status === "pending" && new Date() > new Date(order.expiresAt);

  return NextResponse.json({
    orderId: order.orderId,
    status: isExpired ? "expired" : order.status,
    coins: order.coins,
    packageLabel: order.packageLabel,
    amount: order.amount,
    expiresAt: order.expiresAt,
    paidAt: order.paidAt,
  });
}
