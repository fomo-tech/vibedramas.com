import { NextResponse } from "next/server";
import { getUserSession, encrypt } from "@/lib/auth";

// GET /api/chat/token — return a short-lived socket token for the current user
export async function GET() {
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // The socket server verifies this token with the same secret. Never issue
  // a token signed with the development fallback when the secret is missing.
  if (!process.env.JWT_SECRET?.trim()) {
    console.error("[chat/token] JWT_SECRET is not configured");
    return NextResponse.json(
      { error: "Chat authentication is not configured" },
      { status: 503 },
    );
  }

  const token = await encrypt({
    userId: user.userId,
    name: user.name,
    avatar: user.avatar || "",
    role: "user",
  });

  return NextResponse.json({ token });
}
