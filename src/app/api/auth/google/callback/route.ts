import { NextRequest, NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { createUserSession } from "@/lib/auth";
import crypto from "crypto";
import { getGoogleRedirectUri, getPublicOrigin } from "@/lib/publicUrl";

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  error?: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = getPublicOrigin(req);
  const redirectUri = getGoogleRedirectUri(req);
  const cookieStore = await cookies();
  const rawCallbackPath = cookieStore.get("oauth_callback")?.value;
  const callbackPath =
    rawCallbackPath &&
    rawCallbackPath.startsWith("/") &&
    !rawCallbackPath.startsWith("//")
      ? rawCallbackPath
      : "/";

  const getRedirectUrl = (authError?: string) => {
    if (!authError) return `${appUrl}${callbackPath}`;

    const separator = callbackPath.includes("?") ? "&" : "?";
    return `${appUrl}${callbackPath}${separator}auth_error=${authError}`;
  };

  // User denied access
  if (error) {
    return NextResponse.redirect(getRedirectUrl("access_denied"));
  }

  if (!code || !state) {
    return NextResponse.redirect(getRedirectUrl("missing_params"));
  }

  // Validate CSRF state
  const storedState = cookieStore.get("oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(getRedirectUrl("invalid_state"));
  }

  try {
    const headerStore = await headers();
    const clientIp =
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headerStore.get("x-real-ip") ??
      "unknown";
    const clientUserAgent = headerStore.get("user-agent") ?? "unknown";

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData: GoogleTokenResponse = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      return NextResponse.redirect(getRedirectUrl("token_exchange_failed"));
    }

    // Get user info from Google
    const userInfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      },
    );

    const googleUser: GoogleUserInfo = await userInfoRes.json();

    if (!googleUser.email_verified) {
      return NextResponse.redirect(getRedirectUrl("email_not_verified"));
    }

    // Find or create user in DB
    await connectDB();

    let user = await User.findOne({ googleId: googleUser.sub });

    if (!user) {
      // Try to find by email (existing account)
      user = await User.findOne({ email: googleUser.email });

      // Styles: adventurer, avataaars, bottts, fun-emoji, lorelei, micah, notionists, open-peeps, personas, pixel-art, rings, shapes, thumbs
      const AVATAR_STYLES = [
        "adventurer",
        "avataaars",
        "bottts",
        "fun-emoji",
        "lorelei",
        "micah",
        "open-peeps",
        "pixel-art",
      ];
      const randomStyle =
        AVATAR_STYLES[Math.floor(Math.random() * AVATAR_STYLES.length)];
      const avatarSeed = crypto.randomBytes(8).toString("hex");
      const appAvatar = `https://api.dicebear.com/9.x/${randomStyle}/png?seed=${avatarSeed}&backgroundColor=0f0f0f&size=128`;

      if (user) {
        // Link Google to existing account
        user.googleId = googleUser.sub;
        if (!user.avatar) user.avatar = appAvatar;
      } else {
        // Create new user
        const referralCode = crypto
          .randomBytes(4)
          .toString("hex")
          .toUpperCase();

        // Check for referral from cookie
        const refCode = cookieStore.get("vibe_ref")?.value;

        user = await User.create({
          username:
            googleUser.name.replace(/\s+/g, "_").toLowerCase() +
            "_" +
            crypto.randomBytes(3).toString("hex"),
          email: googleUser.email,
          googleId: googleUser.sub,
          avatar: appAvatar,
          role: "user",
          coins: 0,
          referralCode,
          referredBy: refCode || undefined,
          lastLoginIp: clientIp,
          lastLoginUserAgent: clientUserAgent,
          lastLoginAt: new Date(),
        });

        // Credit referrer if valid
        if (refCode) {
          await User.findOneAndUpdate(
            { referralCode: refCode },
            { $inc: { coins: 50, referralCount: 1 } },
          );
          // Clear referral cookie via response below
        }
      }
    }

    user.lastLoginIp = clientIp;
    user.lastLoginUserAgent = clientUserAgent;
    user.lastLoginAt = new Date();
    await user.save();

    // Create user session
    await createUserSession({
      userId: user._id.toString(),
      name: googleUser.name,
      email: googleUser.email,
      avatar: user.avatar || "",
      role: user.role,
    });

    const response = NextResponse.redirect(getRedirectUrl());

    // Clear temporary auth cookies and referral cookie
    response.cookies.delete("oauth_state");
    response.cookies.delete("oauth_callback");
    response.cookies.delete("vibe_ref");

    return response;
  } catch (err) {
    console.error("[Google OAuth Callback Error]", err);
    return NextResponse.redirect(getRedirectUrl("server_error"));
  }
}
