import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = process.env.JWT_SECRET;
if (!secretKey) {
  // Warn loudly — do not use a fallback in any environment
  console.error(
    "[AUTH] CRITICAL: JWT_SECRET env var is not set. Authentication is insecure. Set a strong random secret in your .env.local",
  );
}
const key = new TextEncoder().encode(
  secretKey ?? "MISSING_SECRET_REPLACE_IMMEDIATELY",
);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}

// ─── Admin session ───────────────────────────────────────────────────────────

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function createSession(userId: string, role: string) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
  const session = await encrypt({ userId, role });

  const cookieStore = await cookies();
  cookieStore.set("admin_session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
}

// ─── User session (Google OAuth) ─────────────────────────────────────────────

export interface UserSessionPayload {
  userId: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
}

export async function createUserSession(payload: UserSessionPayload) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const session = await encrypt({ ...payload, role: "user" });

  const cookieStore = await cookies();
  cookieStore.set("user_session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires,
    path: "/",
  });
}

export async function getUserSession(): Promise<UserSessionPayload | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("user_session")?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function deleteUserSession() {
  const cookieStore = await cookies();
  cookieStore.delete("user_session");
}
