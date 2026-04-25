import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import PaymentMethod from "@/models/PaymentMethod";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/wallet/payment-methods/[id] — set default */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await getUserSession();
  if (!session)
    return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });

  const { id } = await params;
  const userId = String(session.userId);

  await connectDB();

  const method = await PaymentMethod.findOne({ _id: id, userId });
  if (!method)
    return NextResponse.json(
      { error: "Không tìm thấy phương thức" },
      { status: 404 },
    );

  // Unset all other defaults for this user
  await PaymentMethod.updateMany(
    { userId, isDefault: true },
    { isDefault: false },
  );

  method.isDefault = true;
  await method.save();

  return NextResponse.json({ success: true });
}

/** DELETE /api/wallet/payment-methods/[id] */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await getUserSession();
  if (!session)
    return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });

  const { id } = await params;
  const userId = String(session.userId);

  await connectDB();

  const method = await PaymentMethod.findOneAndDelete({ _id: id, userId });
  if (!method)
    return NextResponse.json(
      { error: "Không tìm thấy phương thức" },
      { status: 404 },
    );

  // If deleted method was default, promote the most recent remaining one
  if (method.isDefault) {
    const next = await PaymentMethod.findOne({ userId }).sort({
      createdAt: -1,
    });
    if (next) {
      next.isDefault = true;
      await next.save();
    }
  }

  return NextResponse.json({ success: true });
}
