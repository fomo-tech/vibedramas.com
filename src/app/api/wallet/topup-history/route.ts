import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import Transaction from "@/models/Transaction";

export const dynamic = "force-dynamic";

/** GET /api/wallet/topup-history?page=1&limit=20 */
export async function GET(req: NextRequest) {
  const session = await getUserSession();
  if (!session)
    return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));
  const skip = (page - 1) * limit;

  await connectDB();

  const [items, total] = await Promise.all([
    Transaction.find({ userId: String(session.userId), type: "topup" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Transaction.countDocuments({
      userId: String(session.userId),
      type: "topup",
    }),
  ]);

  return NextResponse.json({
    items: items.map((t) => ({
      id: String(t._id),
      amount: t.amount,
      description: t.description,
      metadata: t.metadata ?? {},
      createdAt: (t.createdAt as Date).toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
