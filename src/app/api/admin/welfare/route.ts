import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import WelfareConfig from "@/models/WelfareConfig";
import {
  ensureWelfareConfig,
  normalizeDailyRewards,
  sanitizeWelfareConfig,
} from "@/lib/welfare";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") return unauthorized();

  await connectDB();
  const config = await ensureWelfareConfig();
  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") return unauthorized();

  const body = await req.json();
  const sanitized = sanitizeWelfareConfig({
    headerTitle: String(body.headerTitle ?? "").trim(),
    headerSubtitle: String(body.headerSubtitle ?? "").trim(),
    rewardsTabLabel: String(body.rewardsTabLabel ?? "").trim(),
    memberTabLabel: String(body.memberTabLabel ?? "").trim(),
    dailyCheckInRewards: normalizeDailyRewards(body.dailyCheckInRewards),
    tasks: Array.isArray(body.tasks) ? body.tasks : [],
  });

  if (!sanitized.headerTitle) {
    return NextResponse.json(
      { error: "Thiếu tiêu đề Trung tâm phúc lợi" },
      { status: 400 },
    );
  }

  if (sanitized.dailyCheckInRewards.length === 0) {
    return NextResponse.json(
      { error: "Cần ít nhất 1 mốc điểm danh" },
      { status: 400 },
    );
  }

  await connectDB();

  const updated = await WelfareConfig.findOneAndUpdate({}, sanitized, {
    returnDocument: "after",
    upsert: true,
    setDefaultsOnInsert: true,
  }).lean();

  return NextResponse.json(sanitizeWelfareConfig(updated ?? sanitized));
}
