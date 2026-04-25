import { NextResponse } from "next/server";
import { getUserSession, encrypt } from "@/lib/auth";

// GET /api/chat/token — return a short-lived socket token for the current user
export async function GET() {
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await encrypt({
    userId: user.userId,
    name: user.name,
    avatar: user.avatar || "",
    role: "user",
  });

  return NextResponse.json({ token });
}
