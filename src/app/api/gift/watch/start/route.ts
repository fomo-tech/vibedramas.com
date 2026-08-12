import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { getUserSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import GiftWatchProgress from "@/models/GiftWatchProgress";
import {
  GIFT_SESSION_LOCK_SECONDS,
  getGiftWatchRequirement,
  giftProgressPayload,
} from "@/lib/giftWatch";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, {
    windowMs: 60,
    max: 30,
    keyPrefix: "rl:gift:watch:start",
  });
  if (limited) return limited;

  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    clientId?: string;
    episodeId?: string;
    position?: number;
  };
  const clientId = body.clientId?.trim().slice(0, 100);
  const episodeId = body.episodeId?.trim().slice(0, 100);
  const position = Math.max(0, Number(body.position) || 0);
  if (!clientId || !episodeId) {
    return NextResponse.json({ error: "Thiếu thông tin phiên xem" }, { status: 400 });
  }

  await connectDB();
  // Imported feeds may use a stable provider episode identifier rather than a
  // Mongo ObjectId. Requiring Episode._id here rejected legitimate playback
  // before a progress document could ever be created. The heartbeat still
  // validates session ownership, sequence, elapsed time and position delta.
  const requirement = await getGiftWatchRequirement(String(session.userId));
  if (!requirement) {
    return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 });
  }

  const now = new Date();
  const existing = await GiftWatchProgress.findOne({ userId: session.userId });
  const locked =
    existing &&
    existing.clientId !== clientId &&
    now.getTime() - existing.lastHeartbeatAt.getTime() <
      GIFT_SESSION_LOCK_SECONDS * 1000 &&
    existing.verifiedSeconds < existing.requiredSeconds;

  if (locked) {
    return NextResponse.json(
      { error: "Hộp quà đang được tích lũy trên tab hoặc thiết bị khác" },
      { status: 409 },
    );
  }

  const progress = await GiftWatchProgress.findOneAndUpdate(
    { userId: session.userId },
    {
      $set: {
        clientId,
        episodeId,
        requiredSeconds: requirement.requiredSeconds,
        lastHeartbeatAt: now,
        lastClientPosition: position,
        lastSequence: 0,
      },
      $setOnInsert: { verifiedSeconds: 0, claimVersion: 0 },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  return NextResponse.json(giftProgressPayload(progress));
}
