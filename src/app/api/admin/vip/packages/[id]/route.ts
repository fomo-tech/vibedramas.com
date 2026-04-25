import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import RankConfig from "@/models/RankConfig";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// PATCH /api/admin/vip/packages/[id] — compatibility patch on unified tiers
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  await connectDB();
  const pkg = await RankConfig.findByIdAndUpdate(
    id,
    {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.days !== undefined && { days: Number(body.days) }),
      ...(body.price !== undefined && { price: Number(body.price) }),
      ...(body.coinsPerMinute !== undefined && {
        coinsPerMinute: Number(body.coinsPerMinute),
      }),
      ...(body.giftRank !== undefined && { rank: Number(body.giftRank) }),
      ...(body.badge !== undefined && { badge: body.badge || undefined }),
      ...(body.badgeVariant !== undefined && {
        badgeVariant: body.badgeVariant || undefined,
      }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.order !== undefined && { order: Number(body.order) }),
    },
    { returnDocument: "after" },
  ).lean();

  if (!pkg)
    return NextResponse.json({ error: "Không tìm thấy bậc" }, { status: 404 });
  return NextResponse.json({
    _id: String(pkg._id),
    name: pkg.name,
    days: Number(pkg.days ?? 30),
    price: Number(pkg.price ?? 0),
    coinsPerMinute: Number(pkg.coinsPerMinute ?? 1),
    giftRank: Number(pkg.rank),
    badge: pkg.badge,
    badgeVariant: pkg.badgeVariant,
    isActive: pkg.isActive !== false,
    order: Number(pkg.order ?? pkg.rank),
    updatedAt: pkg.updatedAt,
  });
}

// DELETE /api/admin/vip/packages/[id] — compatibility soft-disable tier
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();
  await RankConfig.findByIdAndUpdate(id, { isActive: false });
  return NextResponse.json({ ok: true });
}
