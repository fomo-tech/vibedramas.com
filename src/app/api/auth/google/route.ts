import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";
import { rateLimit } from "@/lib/rateLimit";
import { getGoogleRedirectUri } from "@/lib/publicUrl";

export async function GET(req: NextRequest) {
  // Rate limit: 10 OAuth initiations/hour per IP — prevents redirect flooding
  const limited = await rateLimit(req, {
    windowMs: 3600,
    max: 10,
    keyPrefix: "rl:oauth:google",
  });
  if (limited) return limited;

  const rawCallback = req.nextUrl.searchParams.get("callback");
  const callbackPath =
    rawCallback && rawCallback.startsWith("/") && !rawCallback.startsWith("//")
      ? rawCallback
      : "/";

  const redirectUri = getGoogleRedirectUri(req);

  // Generate CSRF state token
  const state = crypto.randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state,
  });

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
  );

  // Store state in cookie for CSRF validation (5 min expiry)
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 5,
    path: "/",
  });

  response.cookies.set("oauth_callback", callbackPath, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 5,
    path: "/",
  });

  return response;
}
