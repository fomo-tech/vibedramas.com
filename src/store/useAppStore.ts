import { create } from "zustand";

interface AppState {
  isMenuOpen: boolean;
  theme: "light" | "dark" | "system";
  /** Number of active playing+loaded HlsPlayer instances */
  activePlayerCount: number;
  isWatching: boolean;
  giftEpisodeId: string;
  giftPlaybackPosition: number;
  setMenuOpen: (isOpen: boolean) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  /** Call with true when a player starts playing, false when it stops */
  updatePlayerActive: (active: boolean) => void;
  updateGiftPlayback: (
    active: boolean,
    episodeId: string,
    position?: number,
  ) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isMenuOpen: false,
  theme: "system",
  activePlayerCount: 0,
  isWatching: false,
  giftEpisodeId: "",
  giftPlaybackPosition: 0,
  setMenuOpen: (isOpen) => set({ isMenuOpen: isOpen }),
  setTheme: (theme) => set({ theme }),
  updatePlayerActive: (active) =>
    set((s) => {
      const next = Math.max(0, s.activePlayerCount + (active ? 1 : -1));
      return { activePlayerCount: next, isWatching: next > 0 };
    }),
  updateGiftPlayback: (active, episodeId, position = 0) =>
    set((state) => {
      if (active) {
        return {
          giftEpisodeId: episodeId,
          giftPlaybackPosition: Math.max(0, position),
        };
      }
      if (state.giftEpisodeId !== episodeId) return state;
      return { giftEpisodeId: "", giftPlaybackPosition: 0 };
    }),
}));
