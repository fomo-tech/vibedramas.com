import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import WelfareClaim from "@/models/WelfareClaim";
import { ensureWelfareConfig, getDateKey } from "@/lib/welfare";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
  }

  await connectDB();

  const [{ taskId }, config] = await Promise.all([
    params,
    ensureWelfareConfig(),
  ]);
  const task = config.tasks.find((item) => item.id === taskId && item.enabled);

  if (!task) {
    return NextResponse.json(
      { error: "Nhiệm vụ không tồn tại" },
      { status: 404 },
    );
  }

  const body = await req.json().catch(() => ({}));
  if (
    task.actionType === "notifications" &&
    body.notificationPermission !== "granted"
  ) {
    return NextResponse.json(
      { error: "Cần cấp quyền thông báo để nhận thưởng" },
      { status: 400 },
    );
  }

  if (task.requiresImageProof) {
    const proofImageData =
      typeof body.proofImageData === "string" ? body.proofImageData : "";
    if (!proofImageData.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Nhiệm vụ này yêu cầu upload ảnh minh chứng" },
        { status: 400 },
      );
    }
    if (proofImageData.length > 2_000_000) {
      return NextResponse.json(
        { error: "Ảnh quá lớn, vui lòng chọn ảnh nhỏ hơn 1.5MB" },
        { status: 400 },
      );
    }
  }

  const userId = String(session.userId);
  const todayKey = getDateKey();
  const [todayCount, totalCount] = await Promise.all([
    WelfareClaim.countDocuments({ userId, taskId, dayKey: todayKey }),
    WelfareClaim.countDocuments({ userId, taskId }),
  ]);

  if (task.dailyLimit > 0 && todayCount >= task.dailyLimit) {
    return NextResponse.json(
      { error: "Bạn đã đạt giới hạn hôm nay" },
      { status: 409 },
    );
  }

  if (task.totalLimit > 0 && totalCount >= task.totalLimit) {
    return NextResponse.json(
      { error: "Nhiệm vụ này đã nhận đủ" },
      { status: 409 },
    );
  }

  await WelfareClaim.create({
    userId,
    taskId,
    actionType: task.actionType,
    reward: task.reward,
    dayKey: todayKey,
    metadata:
      task.actionType === "notifications"
        ? { notificationPermission: body.notificationPermission }
        : task.requiresImageProof
          ? {
              proofImageData: body.proofImageData,
              proofImageName:
                typeof body.proofImageName === "string"
                  ? body.proofImageName
                  : undefined,
            }
          : task.linkUrl
            ? { linkUrl: task.linkUrl }
            : {},
  });

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $inc: { coins: task.reward } },
    { returnDocument: "after", select: "coins" },
  ).lean<{ coins?: number } | null>();

  return NextResponse.json({
    ok: true,
    reward: task.reward,
    coins: updatedUser?.coins ?? task.reward,
    taskId,
  });
}
