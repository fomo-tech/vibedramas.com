"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export function useEpisodeLike(episodeId: string) {
  const { user } = useAuthStore();
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch episode like info
  useEffect(() => {
    if (!episodeId) {
      setLoading(false);
      return;
    }

    const fetchLikes = async () => {
      try {
        const res = await fetch(
          `/api/dramas/episodes/${episodeId}/likes?episodeId=${episodeId}`,
        );
        if (!res.ok) return;
        const data = await res.json();
        setLikeCount(data.likeCount || 0);

        // Check if current user liked this episode
        if (user) {
          const userRes = await fetch("/api/auth/me");
          if (userRes.ok) {
            const userData = await userRes.json();
            setIsLiked(
              (userData.likedEpisodes ?? []).includes(episodeId) ||
                (userData.likedEpisodes ?? []).some(
                  (id: string) => id === episodeId,
                ),
            );
          }
        }
      } catch (e) {
        console.error("Failed to fetch episode likes:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchLikes();
  }, [episodeId, user]);

  const toggleLike = useCallback(async () => {
    if (!episodeId || !user) return;

    setIsLiked((prev) => !prev);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));

    try {
      const res = await fetch(
        `/api/dramas/episodes/${episodeId}/likes?episodeId=${episodeId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ episodeId, userId: user.id, liked: !isLiked }),
        },
      );

      if (!res.ok) {
        // Revert on error
        setIsLiked((prev) => !prev);
        setLikeCount((prev) => (isLiked ? prev + 1 : prev - 1));
        return;
      }

      const data = await res.json();
      setLikeCount(data.likeCount);
      setIsLiked(data.liked);
    } catch (e) {
      // Revert on error
      setIsLiked((prev) => !prev);
      setLikeCount((prev) => (isLiked ? prev + 1 : prev - 1));
      console.error("Failed to toggle like:", e);
    }
  }, [episodeId, user, isLiked]);

  return { likeCount, isLiked, loading, toggleLike };
}
