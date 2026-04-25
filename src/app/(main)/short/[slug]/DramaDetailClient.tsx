"use client";

import { useEffect, useState } from "react";
import EpisodeFeedScroll, {
  EpFeedDrama,
  EpFeedEpisode,
} from "@/components/home/EpisodeFeedScroll";

export default function DramaDetailClient({
  slug,
  initialDrama,
}: {
  slug: string;
  initialDrama: EpFeedDrama;
}) {
  void slug;
  const [episodes, setEpisodes] = useState<EpFeedEpisode[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadEpisodes = async () => {
      try {
        const epRes = await fetch(`/api/dramas/${initialDrama._id}/episodes`);
        if (!epRes.ok) {
          if (!cancelled) setError(true);
          return;
        }
        const epData = await epRes.json();
        if (cancelled) return;
        setEpisodes(Array.isArray(epData) ? epData : []);
      } catch {
        if (!cancelled) setError(true);
      }
    };

    loadEpisodes();
    return () => {
      cancelled = true;
    };
  }, [initialDrama._id]);

  if (error) {
    return (
      <div className="h-full w-full bg-black flex items-center justify-center">
        <p className="text-white/40 text-sm">Không tìm thấy nội dung</p>
      </div>
    );
  }

  if (episodes.length === 0) {
    return (
      <div className="h-full w-full bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-vibe-pink/30 border-t-vibe-pink rounded-full animate-spin" />
          <p className="text-white/30 text-xs font-medium tracking-widest uppercase">
            Đang tải tập phim
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <EpisodeFeedScroll drama={initialDrama} episodes={episodes} />
    </div>
  );
}
