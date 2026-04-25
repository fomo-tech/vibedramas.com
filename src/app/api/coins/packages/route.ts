import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import TopupPackage, { DEFAULT_TOPUP_PACKAGES } from "@/models/TopupPackage";

// Public: list active topup packages
export async function GET() {
  try {
    await dbConnect();
    let packages = await TopupPackage.find({ isActive: true })
      .sort({ order: 1, amount: 1 })
      .lean();

    // Seed defaults if empty
    if (packages.length === 0) {
      await TopupPackage.insertMany(DEFAULT_TOPUP_PACKAGES);
      packages = await TopupPackage.find({ isActive: true })
        .sort({ order: 1, amount: 1 })
        .lean();
    }

    return NextResponse.json(packages);
  } catch {
    return NextResponse.json(DEFAULT_TOPUP_PACKAGES);
  }
}
