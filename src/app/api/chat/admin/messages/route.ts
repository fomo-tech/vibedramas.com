import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ChatMessage from "@/models/ChatMessage";
import ChatRoom from "@/models/ChatRoom";
import { getSession } from "@/lib/auth";

// GET /api/chat/admin/messages?roomId=xxx
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const roomId = req.nextUrl.searchParams.get("roomId");
  if (!roomId) {
    return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
  }

  await dbConnect();
  const messages = await ChatMessage.find({ roomId })
    .sort({ createdAt: 1 })
    .limit(100)
    .lean();

  return NextResponse.json(messages);
}
