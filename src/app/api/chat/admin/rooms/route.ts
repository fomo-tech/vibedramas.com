import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ChatRoom from "@/models/ChatRoom";
import { getSession } from "@/lib/auth";

// GET /api/chat/admin/rooms — admin only
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();
  const rooms = await ChatRoom.find({ status: "open" })
    .sort({ lastMessageAt: -1 })
    .limit(100)
    .lean();

  return NextResponse.json(rooms);
}

// PATCH /api/chat/admin/rooms — mark admin read for a room
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { roomId } = await req.json();
  await dbConnect();
  await ChatRoom.updateOne({ _id: roomId }, { adminUnread: 0 });
  return NextResponse.json({ ok: true });
}
