"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Runs once on mount to sync the server-side user_session cookie
 * with the Zustand auth store on the client.
 */
export default function AuthInitializer() {
  const { setUser, setCoins, setVip, setGiftLevel, logout } = useAuthStore();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then(({ user }) => {
        if (user) {
          setUser(user);
          setCoins(user.coins ?? 0);
          setVip(
            user.vipStatus ?? false,
            user.vipExpiry ?? null,
            user.vipCoinsPerMinute ?? 0,
            user.vipPackageName ?? "",
          );
          if (user.giftLevel != null) setGiftLevel(user.giftLevel);
        } else {
          // Session expired or invalid — clear stale local state
          logout();
        }
      })
      .catch(() => {
        // Network error — keep existing local state
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
