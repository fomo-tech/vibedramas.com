"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";

const STORAGE_KEY = "vibe_liked_dramas";

export interface LikedDramaItem {
  _id: string;
  slug: string;
  name: string;
  origin_name: string;
  thumb_url: string;
  poster_url: string;
  episode_total: string;
  episode_current: string;
  category: { name: string; slug: string }[];
  likedAt: number;
}

export function useLiked() {
  const { user } = useAuthStore();
  const [likedSlugs, setLikedSlugs] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const dramas: LikedDramaItem[] = JSON.parse(raw);
        setLikedSlugs(dramas.map((d) => d.slug));
      }
    } catch {}
  }, []);

  const isLiked = useCallback(
    (slug: string) => likedSlugs.includes(slug),
    [likedSlugs],
  );

  const toggleLike = useCallback(
    (drama: Omit<LikedDramaItem, "likedAt">) => {
      const alreadyLiked = likedSlugs.includes(drama.slug);

      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const current: LikedDramaItem[] = raw ? JSON.parse(raw) : [];

        if (alreadyLiked) {
          const updated = current.filter((d) => d.slug !== drama.slug);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          setLikedSlugs((prev) => prev.filter((s) => s !== drama.slug));
        } else {
          const newItem: LikedDramaItem = { ...drama, likedAt: Date.now() };
          const updated = [newItem, ...current];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          setLikedSlugs((prev) => [drama.slug, ...prev]);
        }
      } catch {}

      // Sync to API for logged-in users
      if (user) {
        fetch("/api/liked", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: drama.slug,
            action: alreadyLiked ? "unlike" : "like",
          }),
        }).catch(() => {});
      }
    },
    [likedSlugs, user],
  );

  return { isLiked, toggleLike };
}
