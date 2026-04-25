/**
 * Centralized API route constants + typed fetch utility.
 *
 * Client components: use relative paths — no hardcoded host.
 * Server-side (generateMetadata, server actions): call DB models directly,
 * never fetch() against localhost (causes ECONNREFUSED on cold start).
 */

export const API_ROUTES = {
  auth: {
    logout: "/api/auth/logout",
    me: "/api/auth/me",
    google: "/api/auth/google",
  },
  gift: {
    config: "/api/gift/config",
    open: "/api/gift/open",
    ranks: "/api/gift/ranks",
  },
  vip: {
    purchase: "/api/vip/purchase",
    packages: "/api/vip/packages",
  },
  dramas: {
    feed: "/api/dramas/feed",
    episodes: (episodeId: string) => `/api/dramas/episodes/${episodeId}`,
    comments: (episodeId: string) =>
      `/api/dramas/episodes/${episodeId}/comments`,
    likes: (episodeId: string) => `/api/dramas/episodes/${episodeId}/likes`,
  },
  welfare: {
    checkIn: "/api/welfare/check-in",
  },
  wallet: {
    paymentMethods: "/api/wallet/payment-methods",
  },
  liked: "/api/liked",
} as const;

export type ApiOk<T> = { data: T; error: null; status: number };
export type ApiErr = { data: null; error: string; status: number };
export type ApiResponse<T> = ApiOk<T> | ApiErr;

/**
 * Typed fetch wrapper for client-side API calls.
 * Automatically adds Content-Type: application/json.
 * Returns { data, error, status } — never throws.
 */
export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    const data = res.status !== 204 ? await res.json().catch(() => null) : null;

    if (!res.ok) {
      return {
        data: null,
        error: (data as { error?: string } | null)?.error ?? res.statusText,
        status: res.status,
      };
    }

    return { data: data as T, error: null, status: res.status };
  } catch {
    return { data: null, error: "Network error", status: 0 };
  }
}
