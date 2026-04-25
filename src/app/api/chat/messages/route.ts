import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ChatMessage from "@/models/ChatMessage";
import ChatRoom from "@/models/ChatRoom";
import { getUserSession } from "@/lib/auth";

// GET /api/chat/messages?roomId=xxx
export async function GET(req: NextRequest) {
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const roomId = req.nextUrl.searchParams.get("roomId");

  // Users can only read their own room
  if (user.role !== "admin") {
    const room = await ChatRoom.findOne({ userId: user.userId });
    if (!room || room.id !== roomId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const messages = await ChatMessage.find({ roomId })
    .sort({ createdAt: 1 })
    .limit(100)
    .lean();

  return NextResponse.json(messages);
}
