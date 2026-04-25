import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/auth";

const adminProtectedRoute = "/admin";
const adminLoginRoute = "/admin/login";

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Save referral code from ?ref= query param as cookie (30 days)
  const refCode = req.nextUrl.searchParams.get("ref");
  const response = NextResponse.next();
  if (refCode && !req.cookies.get("vibe_ref")) {
    response.cookies.set("vibe_ref", refCode, {
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
      httpOnly: true, // prevent JS read — referral codes should be server-only
    });
  }

  // ─── Admin routes ────────────────────────────────────────────────────────
  const isAdminProtected =
    path.startsWith("/admin") && path !== adminLoginRoute;
  const isAdminLogin = path === adminLoginRoute;

  const adminCookie = req.cookies.get("admin_session")?.value;
  const adminSession = adminCookie ? await decrypt(adminCookie) : null;

  if (isAdminProtected && (!adminSession || adminSession.role !== "admin")) {
    return NextResponse.redirect(new URL("/admin/login", req.nextUrl));
  }

  if (isAdminLogin && adminSession?.role === "admin") {
    return NextResponse.redirect(new URL("/admin", req.nextUrl));
  }

  // ─── User-protected routes ───────────────────────────────────────────────
  const isUserProtected = ["/referral"].some((r) => path.startsWith(r));

  if (isUserProtected) {
    const userCookie = req.cookies.get("user_session")?.value;
    const userSession = userCookie ? await decrypt(userCookie) : null;

    if (!userSession) {
      // Redirect to home; the client will open the login modal
      return NextResponse.redirect(new URL("/?require_login=1", req.nextUrl));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
