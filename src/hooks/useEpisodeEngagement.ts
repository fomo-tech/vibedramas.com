"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export interface EpisodeCommentItem {
  _id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

interface EpisodeEngagementSnapshot {
  likeCount: number;
  commentCount: number;
  liked: boolean;
}

const engagementCache = new Map<string, EpisodeEngagementSnapshot>();
const engagementInflight = new Map<
  string,
  Promise<EpisodeEngagementSnapshot | null>
>();

async function fetchEpisodeEngagement(
  apiBase: string,
  episodeId: string,
): Promise<EpisodeEngagementSnapshot | null> {
  if (!episodeId) return null;

  const cached = engagementCache.get(episodeId);
  if (cached) return cached;

  const pending = engagementInflight.get(episodeId);
  if (pending) return pending;

  const req = fetch(`${apiBase}/likes`, { cache: "no-store" })
    .then(async (res) => {
      if (!res.ok) return null;
      const data = await res.json();
      const next: EpisodeEngagementSnapshot = {
        likeCount: Number(data.likeCount ?? 0),
        commentCount: Number(data.commentCount ?? 0),
        liked: Boolean(data.liked),
      };
      engagementCache.set(episodeId, next);
      return next;
    })
    .finally(() => {
      engagementInflight.delete(episodeId);
    });

  engagementInflight.set(episodeId, req);
  return req;
}

export function useEpisodeEngagement(
  episodeId: string,
  enabled = true,
  dramaSlug?: string,
) {
  const { user, openLoginModal } = useAuthStore();
  const [likeCount, setLikeCount] = useState(
    engagementCache.get(episodeId)?.likeCount ?? 0,
  );
  const [commentCount, setCommentCount] = useState(
    engagementCache.get(episodeId)?.commentCount ?? 0,
  );
  const [liked, setLiked] = useState(
    engagementCache.get(episodeId)?.liked ?? false,
  );
  const [loading, setLoading] = useState(true);

  const apiBase = useMemo(
    () => `/api/dramas/episodes/${episodeId}`,
    [episodeId],
  );

  const loadSummary = useCallback(async () => {
    if (!episodeId || !enabled) {
      setLoading(false);
      return;
    }

    const cached = engagementCache.get(episodeId);
    if (cached) {
      setLikeCount(cached.likeCount);
      setCommentCount(cached.commentCount);
      setLiked(cached.liked);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const snapshot = await fetchEpisodeEngagement(apiBase, episodeId);
      if (!snapshot) return;
      setLikeCount(snapshot.likeCount);
      setCommentCount(snapshot.commentCount);
      setLiked(snapshot.liked);
    } finally {
      setLoading(false);
    }
  }, [apiBase, episodeId, enabled]);

  useEffect(() => {
    if (!enabled) return;
    loadSummary();
  }, [loadSummary, enabled]);

  const toggleLike = useCallback(async () => {
    if (!episodeId) return;
    if (!user) {
      openLoginModal();
      return;
    }

    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)));

    try {
      const res = await fetch(`${apiBase}/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liked: nextLiked, dramaSlug }),
      });

      if (!res.ok) {
        setLiked(!nextLiked);
        setLikeCount((prev) => Math.max(0, prev + (nextLiked ? -1 : 1)));
        return;
      }

      const data = await res.json();
      const next = {
        liked: Boolean(data.liked),
        likeCount: Number(data.likeCount ?? 0),
        commentCount: Number(data.commentCount ?? commentCount),
      };
      engagementCache.set(episodeId, next);
      setLiked(next.liked);
      setLikeCount(next.likeCount);
      setCommentCount(next.commentCount);
    } catch {
      setLiked(!nextLiked);
      setLikeCount((prev) => Math.max(0, prev + (nextLiked ? -1 : 1)));
    }
  }, [
    apiBase,
    commentCount,
    dramaSlug,
    episodeId,
    liked,
    openLoginModal,
    user,
  ]);

  const loadComments = useCallback(
    async (limit = 20, skip = 0) => {
      if (!enabled) return { comments: [] as EpisodeCommentItem[], total: 0 };
      const res = await fetch(
        `${apiBase}/comments?limit=${limit}&skip=${skip}`,
      );
      if (!res.ok) return { comments: [] as EpisodeCommentItem[], total: 0 };
      const data = await res.json();
      return {
        comments: (data.comments ?? []) as EpisodeCommentItem[],
        total: Number(data.total ?? 0),
      };
    },
    [apiBase, enabled],
  );

  const addComment = useCallback(
    async (dramaId: string, content: string) => {
      if (!user) {
        openLoginModal();
        return { ok: false, error: "AUTH" } as const;
      }

      const res = await fetch(`${apiBase}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dramaId, content }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          ok: false,
          error: String(data.error ?? "Không thể gửi bình luận"),
        } as const;
      }

      const nextTotal = Number(data.total ?? commentCount + 1);
      setCommentCount(nextTotal);
      engagementCache.set(episodeId, {
        likeCount,
        commentCount: nextTotal,
        liked,
      });
      return { ok: true, comment: data.comment as EpisodeCommentItem } as const;
    },
    [apiBase, commentCount, episodeId, likeCount, liked, openLoginModal, user],
  );

  return {
    likeCount,
    commentCount,
    liked,
    loading,
    toggleLike,
    loadComments,
    addComment,
    refresh: loadSummary,
  };
}
