import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ChatRoom from "@/models/ChatRoom";
import { getUserSession } from "@/lib/auth";

// GET /api/chat/room — get or create the current user's room
export async function GET(req: NextRequest) {
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  let room = await ChatRoom.findOne({ userId: user.userId });
  if (!room) {
    room = await ChatRoom.create({
      userId: user.userId,
      userName: user.name,
      userAvatar: user.avatar || "",
    });
  }

  return NextResponse.json(room);
}

// PATCH /api/chat/room — mark user messages as read (user opens chat)
export async function PATCH(req: NextRequest) {
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  await ChatRoom.updateOne({ userId: user.userId }, { userUnread: 0 });
  return NextResponse.json({ ok: true });
}
