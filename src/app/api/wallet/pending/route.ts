import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import DepositOrder from "@/models/DepositOrder";
import WithdrawRequest from "@/models/WithdrawRequest";

export const dynamic = "force-dynamic";

/** GET /api/wallet/pending — returns count of user's pending deposit + withdraw */
export async function GET() {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ count: 0 });

  await connectDB();
  const userIdStr = String(session.userId);

  const [depositCount, withdrawCount] = await Promise.all([
    DepositOrder.countDocuments({ userId: userIdStr, status: "pending" }),
    WithdrawRequest.countDocuments({
      userId: userIdStr,
      status: { $in: ["pending", "processing"] },
    }),
  ]);

  return NextResponse.json({ count: depositCount + withdrawCount });
}
