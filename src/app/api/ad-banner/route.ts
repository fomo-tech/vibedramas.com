import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AdBanner from "@/models/AdBanner";
import { getRandomAffLink } from "@/lib/affLinks";

export const dynamic = "force-dynamic";

export async function GET() {
  await dbConnect();
  const banners = await AdBanner.find({ isActive: true })
    .sort({ createdAt: 1 })
    .lean();

  if (banners.length) return NextResponse.json(banners);

  // Fallback: trả về 1 affiliate link ngẫu nhiên từ danh sách mặc định
  const aff = getRandomAffLink();
  const fallback = {
    _id: "aff-fallback",
    imageUrl: "/icons/shopee-ad.svg",
    linkUrl: aff.link,
    altText: aff.name,
    showAfterSeconds: 30,
    rehideAfterSeconds: 60,
    isActive: true,
    showToVip: false,
  };
  return NextResponse.json([fallback]);
}
