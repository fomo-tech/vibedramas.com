import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { getUserSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import GiftWatchProgress from "@/models/GiftWatchProgress";
import {
  GIFT_MAX_HEARTBEAT_GAP_SECONDS,
  giftProgressPayload,
} from "@/lib/giftWatch";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, {
    windowMs: 60,
    max: 20,
    keyPrefix: "rl:gift:watch:heartbeat",
  });
  if (limited) return limited;

  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    clientId?: string;
    episodeId?: string;
    sequence?: number;
    position?: number;
  };
  const clientId = body.clientId?.trim().slice(0, 100);
  const episodeId = body.episodeId?.trim().slice(0, 100);
  const sequence = Math.floor(Number(body.sequence));
  const position = Math.max(0, Number(body.position) || 0);
  if (!clientId || !episodeId || !Number.isInteger(sequence) || sequence < 1) {
    return NextResponse.json({ error: "Heartbeat không hợp lệ" }, { status: 400 });
  }

  await connectDB();
  const progress = await GiftWatchProgress.findOne({
    userId: session.userId,
    clientId,
    episodeId,
  });
  if (!progress) {
    return NextResponse.json({ error: "Phiên xem không hợp lệ" }, { status: 409 });
  }
  if (progress.verifiedSeconds >= progress.requiredSeconds) {
    return NextResponse.json(giftProgressPayload(progress));
  }
  if (sequence !== progress.lastSequence + 1) {
    return NextResponse.json({ error: "Heartbeat sai thứ tự" }, { status: 409 });
  }

  const now = new Date();
  const elapsed = (now.getTime() - progress.lastHeartbeatAt.getTime()) / 1000;
  const positionDelta = position - progress.lastClientPosition;
  const validPlayback =
    elapsed >= 2 &&
    elapsed <= GIFT_MAX_HEARTBEAT_GAP_SECONDS &&
    positionDelta >= Math.min(1, elapsed * 0.25) &&
    positionDelta <= elapsed * 2.25 + 2;
  const credited = validPlayback ? Math.min(elapsed, positionDelta, 6) : 0;
  const verifiedSeconds = Math.min(
    progress.requiredSeconds,
    progress.verifiedSeconds + credited,
  );

  const updated = await GiftWatchProgress.findOneAndUpdate(
    { _id: progress._id, clientId, lastSequence: progress.lastSequence },
    {
      $set: {
        verifiedSeconds,
        lastHeartbeatAt: now,
        lastClientPosition: position,
        lastSequence: sequence,
      },
    },
    { new: true },
  );
  if (!updated) {
    return NextResponse.json({ error: "Heartbeat đã được xử lý" }, { status: 409 });
  }

  return NextResponse.json({
    ...giftProgressPayload(updated),
    creditedSeconds: credited,
  });
}
