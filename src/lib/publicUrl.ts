import type { NextRequest } from "next/server";

function trimTrailingSlashes(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function isLocalHost(hostname: string) {
  const host = hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

function isSafeOriginForProd(value: string) {
  try {
    const url = new URL(value);
    return !isLocalHost(url.hostname);
  } catch {
    return false;
  }
}

export function getPublicOrigin(req: NextRequest) {
  const forwardedProto = req.headers.get("x-forwarded-proto") || "https";
  const forwardedHost =
    req.headers.get("x-forwarded-host") || req.headers.get("host");

  const requestOrigin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : req.nextUrl.origin;

  const candidates = [
    process.env.APP_URL,
    requestOrigin,
    process.env.NEXT_PUBLIC_APP_URL,
    req.nextUrl.origin,
  ]
    .filter((value): value is string => Boolean(value))
    .map(trimTrailingSlashes);

  if (process.env.NODE_ENV === "production") {
    const safe = candidates.find(isSafeOriginForProd);
    return safe || "https://vibedramas.com";
  }

  return candidates[0] || req.nextUrl.origin;
}

export function getGoogleRedirectUri(req: NextRequest) {
  const fallback = `${getPublicOrigin(req)}/api/auth/google/callback`;
  const configured = process.env.GOOGLE_REDIRECT_URI?.trim();

  if (!configured) return fallback;

  if (process.env.NODE_ENV === "production") {
    return isSafeOriginForProd(configured) ? configured : fallback;
  }

  return configured;
}
