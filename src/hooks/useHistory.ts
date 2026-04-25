"use client";

import { useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";

const STORAGE_KEY = "vibe_watch_history";
const MAX_ITEMS = 100;

export interface HistoryItem {
  _id: string; // drama._id (one entry per drama, updated on new episode)
  slug: string;
  name: string;
  origin_name: string;
  thumb_url: string;
  poster_url: string;
  episode: string;
  watchedAt: number;
  progress?: number;
}

export function useHistory() {
  const { user } = useAuthStore();

  const addToHistory = useCallback(
    (item: HistoryItem) => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const history: HistoryItem[] = raw ? JSON.parse(raw) : [];

        // One entry per drama (_id = drama._id): remove old entry if exists
        const filtered = history.filter((h) => h._id !== item._id);
        const updated = [item, ...filtered].slice(0, MAX_ITEMS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}

      // Sync to API for logged-in users
      if (user) {
        fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: item.slug,
            dramaId: item._id,
            name: item.name,
            origin_name: item.origin_name,
            thumb_url: item.thumb_url,
            poster_url: item.poster_url,
            episode: item.episode,
          }),
        }).catch(() => {});
      }
    },
    [user]
  );

  const removeFromHistory = useCallback(
    (dramaId: string, slug: string) => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const history: HistoryItem[] = raw ? JSON.parse(raw) : [];
        const updated = history.filter((h) => h._id !== dramaId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}

      if (user) {
        fetch(`/api/history?slug=${encodeURIComponent(slug)}`, {
          method: "DELETE",
        }).catch(() => {});
      }
    },
    [user]
  );

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    // No bulk-delete API for now; would need a separate endpoint
  }, []);

  return { addToHistory, removeFromHistory, clearHistory };
}
