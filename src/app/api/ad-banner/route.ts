import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AdBanner from "@/models/AdBanner";

export const dynamic = "force-dynamic";

export async function GET() {
  await dbConnect();
  const banners = await AdBanner.find({ isActive: true })
    .sort({ createdAt: 1 })
    .lean();
  if (!banners.length) return NextResponse.json([]);
  return NextResponse.json(banners);
}
