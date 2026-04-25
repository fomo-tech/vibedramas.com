import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import ReferralConfig from "@/models/ReferralConfig";
import { ensureReferralConfig, sanitizeReferralConfig } from "@/lib/referral";

// GET /api/admin/referral - Lấy cấu hình referral
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const config = await ensureReferralConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error("Error reading referral config:", error);
    return NextResponse.json(
      { error: "Không thể đọc cấu hình" },
      { status: 500 },
    );
  }
}

// POST /api/admin/referral - Cập nhật cấu hình referral
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const sanitized = sanitizeReferralConfig({
      milestones: body?.milestones,
      rewardPerReferral: body?.rewardPerReferral,
      enableSystem: body?.enableSystem,
    });

    await connectDB();
    await ReferralConfig.findOneAndUpdate({}, sanitized, {
      returnDocument: "after",
      upsert: true,
      setDefaultsOnInsert: true,
    });

    return NextResponse.json({ success: true, ...sanitized });
  } catch (error) {
    console.error("Error updating referral config:", error);
    return NextResponse.json(
      { error: "Không thể lưu cấu hình" },
      { status: 500 },
    );
  }
}
