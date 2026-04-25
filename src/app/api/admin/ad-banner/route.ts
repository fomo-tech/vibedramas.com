import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AdBanner from "@/models/AdBanner";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") return unauthorized();
  await dbConnect();
  const banners = await AdBanner.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(banners);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") return unauthorized();
  await dbConnect();
  const body = await req.json();
  const banner = await AdBanner.create(body);
  return NextResponse.json(banner, { status: 201 });
}
