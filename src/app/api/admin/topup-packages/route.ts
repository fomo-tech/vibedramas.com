import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import TopupPackage, { DEFAULT_TOPUP_PACKAGES } from "@/models/TopupPackage";
import { getSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getSession();
  if (!session) return null;
  return session;
}

// GET all packages (admin)
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  let packages = await TopupPackage.find().sort({ order: 1, amount: 1 }).lean();

  if (packages.length === 0) {
    await TopupPackage.insertMany(DEFAULT_TOPUP_PACKAGES);
    packages = await TopupPackage.find().sort({ order: 1, amount: 1 }).lean();
  }

  return NextResponse.json(packages);
}

// POST create package
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const body = await req.json();
  const { label, amount, coins, bonus, hot, isActive, order } = body;

  if (!label || !amount || !coins) {
    return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
  }

  const pkg = await TopupPackage.create({ label, amount, coins, bonus: bonus ?? 0, hot: hot ?? false, isActive: isActive ?? true, order: order ?? 0 });
  return NextResponse.json(pkg, { status: 201 });
}
