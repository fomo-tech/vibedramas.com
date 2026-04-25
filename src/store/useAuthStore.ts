import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface AuthState {
  user: AuthUser | null;
  coins: number;
  bonusCoins: number;
  vipStatus: boolean;
  vipExpiry: string | null; // ISO string
  vipCoinsPerMinute: number;
  vipPackageName: string;
  giftLevel: number;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  setUser: (user: AuthUser | null) => void;
  addCoins: (amount: number) => void;
  setCoins: (total: number) => void;
  setBonusCoins: (total: number) => void;
  setVip: (
    status: boolean,
    expiry: string | null,
    coinsPerMinute?: number,
    packageName?: string,
  ) => void;
  setGiftLevel: (level: number) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      coins: 0,
      bonusCoins: 0,
      vipStatus: false,
      vipExpiry: null,
      vipCoinsPerMinute: 0,
      vipPackageName: "",
      giftLevel: 1,
      isLoginModalOpen: false,
      openLoginModal: () => set({ isLoginModalOpen: true }),
      closeLoginModal: () => set({ isLoginModalOpen: false }),
      setUser: (user) => set({ user, isLoginModalOpen: false }),
      addCoins: (amount) => set((s) => ({ coins: s.coins + amount })),
      setCoins: (total) => set({ coins: total }),
      setBonusCoins: (total) => set({ bonusCoins: total }),
      setVip: (status, expiry, coinsPerMinute, packageName) =>
        set({
          vipStatus: status,
          vipExpiry: expiry,
          ...(coinsPerMinute !== undefined && {
            vipCoinsPerMinute: coinsPerMinute,
          }),
          ...(packageName !== undefined && { vipPackageName: packageName }),
        }),
      setGiftLevel: (level) => set({ giftLevel: level }),
      logout: () => {
        fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
        localStorage.removeItem("vibe_watch_history");

        try {
          const localKeys = Object.keys(localStorage);
          localKeys.forEach((key) => {
            if (
              key.startsWith("vd_gift_watch_") ||
              key.startsWith("vd_gift_max_") ||
              key.startsWith("vd_timer_leader_") ||
              key === "vd_timer_leader"
            ) {
              localStorage.removeItem(key);
            }
          });
        } catch {}

        try {
          const sessionKeys = Object.keys(sessionStorage);
          sessionKeys.forEach((key) => {
            if (
              key.startsWith("vd_gift_watch_") ||
              key.startsWith("vd_gift_max_")
            ) {
              sessionStorage.removeItem(key);
            }
          });
        } catch {}

        set({
          user: null,
          coins: 0,
          bonusCoins: 0,
          vipStatus: false,
          vipExpiry: null,
          vipCoinsPerMinute: 0,
          vipPackageName: "",
          giftLevel: 1,
        });
      },
    }),
    {
      name: "vibe_auth",
      partialize: (state) => ({
        user: state.user,
        coins: state.coins,
        bonusCoins: state.bonusCoins,
        vipStatus: state.vipStatus,
        vipExpiry: state.vipExpiry,
        vipCoinsPerMinute: state.vipCoinsPerMinute,
        vipPackageName: state.vipPackageName,
        giftLevel: state.giftLevel,
      }),
    },
  ),
);
