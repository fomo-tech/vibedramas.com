import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import VipLog from "@/models/VipLog";

export const dynamic = "force-dynamic";

/** GET /api/wallet/vip-history?page=1&limit=20 */
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
    VipLog.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    VipLog.countDocuments({ userId }),
  ]);

  return NextResponse.json({
    items: items.map((v) => ({
      id: String(v._id),
      type: "vip_purchase",
      amount: v.coinsPaid,
      description: `Mua gói ${v.packageName}`,
      metadata: {
        packageName: v.packageName,
        days: v.days,
        vipFrom: v.vipFrom,
        vipTo: v.vipTo,
        coinsPerMinute: v.coinsPerMinute,
      },
      createdAt: (v.createdAt as Date).toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
