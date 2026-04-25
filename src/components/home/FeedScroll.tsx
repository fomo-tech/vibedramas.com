"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  startTransition,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Headphones,
  List,
  X,
  PlayCircle,
  VolumeX,
  Volume2,
} from "lucide-react";
import HlsPlayer from "./HlsPlayer";
import FeedScrollViewport from "./FeedScrollViewport";
import SoundGateModal from "./SoundGateModal";
import EpisodeInteractionRail from "./interactions/EpisodeInteractionRail";
import EpisodeRailVisibility from "./interactions/EpisodeRailVisibility";
import { stripHtml } from "@/lib/utils";
import DramaDetailSheet, { DetailDrama } from "./DramaDetailSheet";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";

interface Episode {
  _id: string;
  name: string;
  filename: string;
  link_m3u8: string;
  link_embed: string;
}

interface FeedItem {
  _id: string;
  slug: string;
  name: string;
  origin_name: string;
  thumb_url: string;
  poster_url: string;
  episode_total: string;
  episode_current: string;
  content: string;
  view: number;
  year: number;
  status: string;
  category: { name: string; slug: string }[];
  country: { name: string; slug: string }[];
  actor: string[];
  episode1: {
    _id: string;
    name: string;
    link_m3u8: string;
    link_embed: string;
  };
}

interface FloatingHeart {
  id: number;
  rotate: number;
  x: number;
}

export default function FeedScroll() {
  const router = useRouter();
  const { user, vipStatus } = useAuthStore();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [sceneDirection, setSceneDirection] = useState<1 | -1>(1);
  const [isPaused, setIsPaused] = useState(false);
  // Default muted — browser blocks unmuted autoplay without user gesture.
  // User taps the speaker button to unmute (click event = user gesture = allowed).
  // useLayoutEffect reads localStorage before paint to sync server/client
  const [isMuted, setIsMuted] = useState(true);
  const [gateReady, setGateReady] = useState(false);

  const toggleMute = useCallback(() => {
    setIsMuted((m) => {
      const next = !m;
      localStorage.setItem("vibe-muted", String(next));
      return next;
    });
  }, []);
  const onGateUnlock = useCallback((enableSoundNow: boolean) => {
    setGateReady(true);
    if (enableSoundNow) {
      setIsMuted(false);
      localStorage.setItem("vibe-muted", "false");
    }
  }, []);
  const [loading, setLoading] = useState(true);
  const fetchingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);
  const pageRef = useRef(1);
  const [videoProgress, setVideoProgress] = useState<{
    [key: string]: { current: number; duration: number };
  }>({});
  const [targetSeek, setTargetSeek] = useState<{ [key: string]: number }>({});
  const [isUIVisible, setIsUIVisible] = useState(true);
  const isUIVisibleRef = useRef(true);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);

  // Per-item override: which episode src to play
  const [episodeSrc, setEpisodeSrc] = useState<{ [itemId: string]: string }>(
    {},
  );
  const [episodeName, setEpisodeName] = useState<{ [itemId: string]: string }>(
    {},
  );
  const [episodeMeta, setEpisodeMeta] = useState<
    Record<string, { _id: string; name: string }>
  >({});

  // Episode panel state
  const [episodePanelItemId, setEpisodePanelItemId] = useState<string | null>(
    null,
  );
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  // Detail sheet state
  const [detailDrama, setDetailDrama] = useState<DetailDrama | null>(null);

  // Scrub state
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubPreview, setScrubPreview] = useState<{ [key: string]: number }>(
    {},
  );
  const progressBarRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});
  const scrubRAFRef = useRef<number | null>(null);

  const activeIndexRef = useRef(0);
  const itemsLengthRef = useRef(0);
  // Keep ref in sync via effect (not during render — avoids React warning)
  useEffect(() => {
    itemsLengthRef.current = items.length;
  }, [items.length]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);
  const fetchAbortRef = useRef<AbortController | null>(null);

  // Initial Fetch — page 1, 10 items
  useEffect(() => {
    console.log("[FeedScroll] Initial fetch effect mounting");
    let cancelled = false;

    const fetchFeed = async () => {
      try {
        console.log("[FeedScroll] Fetching initial feed...");
        const res = await fetch("/api/dramas/feed?page=1&limit=10");
        if (!res.ok) throw new Error(`Feed API ${res.status}`);
        const data = await res.json();
        if (cancelled) return;

        const fetched: FeedItem[] = Array.isArray(data)
          ? data
          : Array.isArray(data.items)
            ? data.items
            : [];
        console.log(
          "[FeedScroll] Got",
          fetched.length,
          "items, hasMore:",
          data.hasMore,
        );
        setItems(fetched);
        hasMoreRef.current = data.hasMore === true;
        pageRef.current = 1;
      } catch (e) {
        if (!cancelled) {
          console.error("Failed to fetch initial feed:", e);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    fetchFeed();

    return () => {
      cancelled = true;
      if (scrubRAFRef.current) cancelAnimationFrame(scrubRAFRef.current);
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (fetchingMoreRef.current || !hasMoreRef.current) return;
    fetchingMoreRef.current = true;
    const nextPage = pageRef.current + 1;
    try {
      const res = await fetch(`/api/dramas/feed?page=${nextPage}&limit=10`);
      if (!res.ok) throw new Error(`Feed API ${res.status}`);
      const data = await res.json();
      const newItems: FeedItem[] = Array.isArray(data.items) ? data.items : [];
      if (newItems.length > 0) {
        setItems((prev) => {
          const existingIds = new Set(prev.map((i) => i._id));
          return [
            ...prev,
            ...newItems.filter((item) => !existingIds.has(item._id)),
          ];
        });
        pageRef.current = nextPage;
      }
      hasMoreRef.current = data.hasMore === true;
    } catch (e) {
      console.error("Failed to load more feed:", e);
    } finally {
      fetchingMoreRef.current = false;
    }
  }, []);

  // Infinite Scroll Logic — trigger when 3 items from end
  // Only trigger on activeIndex change, not items.length change (to prevent loop)
  useEffect(() => {
    if (
      itemsLengthRef.current > 0 &&
      activeIndex >= itemsLengthRef.current - 3 &&
      !fetchingMoreRef.current &&
      hasMoreRef.current
    ) {
      startTransition(loadMore);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  const resetUITimer = useCallback(() => {
    if (!isUIVisibleRef.current) {
      isUIVisibleRef.current = true;
      setIsUIVisible(true);
    }
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      isUIVisibleRef.current = false;
      setIsUIVisible(false);
    }, 10000);
  }, []);

  useEffect(() => {
    startTransition(resetUITimer);
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [activeIndex, resetUITimer]);

  const closeEpisodePanel = useCallback(() => {
    if (fetchAbortRef.current) {
      fetchAbortRef.current.abort();
      fetchAbortRef.current = null;
    }
    setEpisodePanelItemId(null);
    setEpisodes([]);
  }, []);

  // Stable: commit the settled index as the active (playing) index
  const commitActiveIndex = useCallback((idx: number) => {
    if (idx >= 0 && idx < itemsLengthRef.current) {
      activeIndexRef.current = idx;
      setActiveIndex(idx);
      setIsPaused(false);
    }
  }, []);

  const changeIndex = useCallback(
    (delta: number) => {
      if (itemsLengthRef.current === 0) return;
      const next = Math.max(
        0,
        Math.min(itemsLengthRef.current - 1, activeIndexRef.current + delta),
      );
      if (next === activeIndexRef.current) return;
      if (episodePanelItemId) closeEpisodePanel();
      setSceneDirection(delta >= 0 ? 1 : -1);
      commitActiveIndex(next);
    },
    [closeEpisodePanel, commitActiveIndex, episodePanelItemId],
  );

  const handleStepNavigate = useCallback(
    (direction: 1 | -1) => {
      resetUITimer();
      changeIndex(direction);
    },
    [changeIndex, resetUITimer],
  );

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (episodePanelItemId || detailDrama) return;

    // Check if the click/touch was on an interactive element
    const target = e.target as HTMLElement;
    if (
      target.closest(
        ".pointer-events-auto,button,a,input,textarea,select,[role='button'],[data-no-pause='true']",
      )
    ) {
      return;
    }

    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      const id = now;
      const rotate = (Math.random() - 0.5) * 40;
      const x = (Math.random() - 0.5) * 100;
      setFloatingHearts((prev) => [...prev, { id, rotate, x }]);
      setTimeout(
        () => setFloatingHearts((prev) => prev.filter((h) => h.id !== id)),
        1000,
      );
    } else {
      resetUITimer();
      // Only toggle pause on manual tap, not on scroll
      setIsPaused((p) => !p);
    }
    lastTapRef.current = now;
  };

  const updateTime = (id: string, current: number, duration: number) => {
    if (isScrubbing) return;
    setVideoProgress((prev) => {
      const ex = prev[id];
      if (
        ex &&
        ex.duration === duration &&
        Math.abs(ex.current - current) < 0.5
      )
        return prev;
      return { ...prev, [id]: { current, duration } };
    });
  };

  // ── Scrub helpers ──────────────────────────────────────────
  const getScrubTime = (
    clientX: number,
    bar: HTMLDivElement,
    duration: number,
  ) => {
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return ratio * duration;
  };

  const onProgressMouseDown = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    const bar = progressBarRefs.current[itemId];
    const duration = videoProgress[itemId]?.duration || 0;
    if (!bar || !duration) return;
    setIsScrubbing(true);
    const newTime = getScrubTime(e.clientX, bar, duration);
    setScrubPreview((prev) => ({ ...prev, [itemId]: newTime }));
    setTargetSeek((prev) => ({ ...prev, [itemId]: newTime }));

    const onMove = (mv: MouseEvent) => {
      const t = getScrubTime(mv.clientX, bar, duration);
      // Use RAF for smooth preview without state thrashing
      if (scrubRAFRef.current) cancelAnimationFrame(scrubRAFRef.current);
      scrubRAFRef.current = requestAnimationFrame(() => {
        setScrubPreview((prev) => ({ ...prev, [itemId]: t }));
        setTargetSeek((prev) => ({ ...prev, [itemId]: t }));
      });
    };
    const onUp = () => {
      if (scrubRAFRef.current) cancelAnimationFrame(scrubRAFRef.current);
      setIsScrubbing(false);
      setScrubPreview({});
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const onProgressTouchStart = (e: React.TouchEvent, itemId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const bar = progressBarRefs.current[itemId];
    const duration = videoProgress[itemId]?.duration || 0;
    if (!bar || !duration) return;
    setIsScrubbing(true);
    const newTime = getScrubTime(e.touches[0].clientX, bar, duration);
    setScrubPreview((prev) => ({ ...prev, [itemId]: newTime }));
    setTargetSeek((prev) => ({ ...prev, [itemId]: newTime }));

    const onMove = (mv: TouchEvent) => {
      const t = getScrubTime(mv.touches[0].clientX, bar, duration);
      if (scrubRAFRef.current) cancelAnimationFrame(scrubRAFRef.current);
      scrubRAFRef.current = requestAnimationFrame(() => {
        setScrubPreview((prev) => ({ ...prev, [itemId]: t }));
        setTargetSeek((prev) => ({ ...prev, [itemId]: t }));
      });
    };
    const onEnd = () => {
      if (scrubRAFRef.current) cancelAnimationFrame(scrubRAFRef.current);
      setIsScrubbing(false);
      setScrubPreview({});
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
  };

  // Fetch episodes when drawer opens
  useEffect(() => {
    if (!episodePanelItemId) return;

    const fetchEpisodes = async () => {
      fetchAbortRef.current = new AbortController();
      setLoadingEpisodes(true);
      try {
        const res = await fetch(`/api/dramas/${episodePanelItemId}/episodes`, {
          signal: fetchAbortRef.current.signal,
        });
        const data = await res.json();
        setEpisodes(Array.isArray(data) ? data : []);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          console.error("Failed to fetch episodes:", e);
        }
      } finally {
        setLoadingEpisodes(false);
      }
    };

    fetchEpisodes();
  }, [episodePanelItemId]);

  const openEpisodePanel = (itemId: string) => {
    setEpisodePanelItemId(itemId);
  };

  const openDetail = (item: FeedItem) => {
    setDetailDrama(item as unknown as DetailDrama);
  };

  const closeDetail = () => {
    setDetailDrama(null);
  };

  const handlePlayFromDetail = (ep: Episode) => {
    if (!detailDrama) return;
    setEpisodeSrc((prev) => ({ ...prev, [detailDrama._id]: ep.link_m3u8 }));
    setEpisodeName((prev) => ({ ...prev, [detailDrama._id]: ep.name }));
    setEpisodeMeta((prev) => ({
      ...prev,
      [detailDrama._id]: { _id: ep._id, name: ep.name },
    }));
    closeDetail();
  };

  const closeEpisodePanel_OLD = null;
  void closeEpisodePanel_OLD; // moved above

  const playEpisode = (itemId: string, ep: Episode) => {
    setEpisodeSrc((prev) => ({ ...prev, [itemId]: ep.link_m3u8 }));
    setEpisodeName((prev) => ({ ...prev, [itemId]: ep.name }));
    setEpisodeMeta((prev) => ({
      ...prev,
      [itemId]: { _id: ep._id, name: ep.name },
    }));

    const item = items.find((i) => i._id === itemId);
    if (item?.slug) {
      router.push(`/short/${item.slug}?ep=${encodeURIComponent(ep.name)}`);
    }

    closeEpisodePanel();
  };

  // ── Ad Banner ─────────────────────────────────────────────
  type AdBannerItem = {
    _id: string;
    imageUrl: string;
    linkUrl: string;
    altText: string;
    showAfterSeconds: number;
    rehideAfterSeconds: number;
    showToVip: boolean;
  };
  const [adBanners, setAdBanners] = useState<AdBannerItem[]>([]);
  const [adIndex, setAdIndex] = useState(0);
  const [adVisible, setAdVisible] = useState(false);
  const adWatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const adRehideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const adAutoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const normalizeBannerUrl = useCallback((value: string) => {
    const raw = String(value || "").trim();
    if (!raw || raw.toLowerCase().startsWith("javascript:")) return "";
    const withProtocol =
      raw.startsWith("http://") || raw.startsWith("https://")
        ? raw
        : raw.startsWith("//")
          ? `https:${raw}`
          : raw.startsWith("/")
            ? raw
            : `https://${raw}`;

    // Ensure safe URL encoding for spaces and special characters.
    try {
      return encodeURI(withProtocol);
    } catch {
      return withProtocol;
    }
  }, []);

  const adBanner = useMemo(
    () => (adBanners.length > 0 ? adBanners[adIndex % adBanners.length] : null),
    [adBanners, adIndex],
  );

  // Fetch all active ad banners
  // VIP users chỉ thấy banner có showToVip = true
  useEffect(() => {
    if (loading) return;
    fetch("/api/ad-banner")
      .then((r) => r.json())
      .then((payload) => {
        const data: AdBannerItem[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];
        console.log("[AdBanner] fetched:", data);
        if (!Array.isArray(data) || data.length === 0) {
          console.warn(
            "[AdBanner] empty or invalid response — check DB has active banners",
          );
          return;
        }

        const normalized = data
          .map((item) => ({
            ...item,
            imageUrl: normalizeBannerUrl(item.imageUrl),
            linkUrl: normalizeBannerUrl(item.linkUrl),
            showAfterSeconds: Number.isFinite(Number(item.showAfterSeconds))
              ? Math.min(12, Math.max(0, Number(item.showAfterSeconds)))
              : 4,
            rehideAfterSeconds: Number.isFinite(Number(item.rehideAfterSeconds))
              ? Math.min(20, Math.max(3, Number(item.rehideAfterSeconds)))
              : 12,
          }))
          .filter((item) => item.imageUrl && item.linkUrl);

        const vipFiltered = vipStatus
          ? normalized.filter((b) => b.showToVip)
          : normalized;
        const finalBanners = vipFiltered.length > 0 ? vipFiltered : normalized;

        if (finalBanners.length > 0) {
          setAdBanners(finalBanners);
          setAdIndex(0);
        }
      })
      .catch((err) => console.error("[AdBanner] fetch error:", err));
  }, [loading, normalizeBannerUrl, vipStatus]);

  // Arm/reset watch timer on video change or pause state
  useEffect(() => {
    if (!adBanner || adVisible) return;

    const clear = () => {
      if (adWatchTimerRef.current) {
        clearTimeout(adWatchTimerRef.current);
        adWatchTimerRef.current = null;
      }
    };

    clear();
    if (!isPaused) {
      adWatchTimerRef.current = setTimeout(
        () => {
          setAdVisible(true);
        },
        Math.max(0, Number(adBanner.showAfterSeconds ?? 5)) * 1000,
      );
    }

    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, isPaused, adBanner]);

  const dismissAd = useCallback(
    (openLink?: boolean) => {
      if (openLink && adBanner?.linkUrl) {
        window.open(adBanner.linkUrl, "_blank", "noopener,noreferrer");
      }
      setAdVisible(false);

      // Clear any existing timers
      if (adWatchTimerRef.current) clearTimeout(adWatchTimerRef.current);
      if (adRehideTimerRef.current) clearTimeout(adRehideTimerRef.current);

      const current = adBanners[adIndex % Math.max(adBanners.length, 1)];
      if (!current) return;

      // After rehide delay → advance to next banner and re-arm watch timer
      adRehideTimerRef.current = setTimeout(
        () => {
          setAdIndex((i) => i + 1);
          adRehideTimerRef.current = null;
        },
        Math.max(1, Number(current.rehideAfterSeconds ?? 10)) * 1000,
      );
    },
    [adBanner, adBanners, adIndex],
  );

  // When adIndex changes (after dismiss), re-arm watch timer for the new banner
  useEffect(() => {
    if (adBanners.length === 0 || adVisible) return;
    const next = adBanners[adIndex % adBanners.length];
    if (!next || isPaused) return;

    if (adWatchTimerRef.current) clearTimeout(adWatchTimerRef.current);
    adWatchTimerRef.current = setTimeout(
      () => {
        setAdVisible(true);
      },
      Math.max(0, Number(next.showAfterSeconds ?? 5)) * 1000,
    );

    return () => {
      if (adWatchTimerRef.current) clearTimeout(adWatchTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adIndex]);

  // Auto-slide: rotate banner every 5s while ad is visible
  useEffect(() => {
    if (!adVisible || adBanners.length === 0) {
      if (adAutoSlideRef.current) {
        clearInterval(adAutoSlideRef.current);
        adAutoSlideRef.current = null;
      }
      return;
    }
    adAutoSlideRef.current = setInterval(() => {
      setAdIndex((i) => i + 1);
    }, 5000);
    return () => {
      if (adAutoSlideRef.current) {
        clearInterval(adAutoSlideRef.current);
        adAutoSlideRef.current = null;
      }
    };
  }, [adVisible, adBanners.length]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      if (adWatchTimerRef.current) clearTimeout(adWatchTimerRef.current);
      if (adRehideTimerRef.current) clearTimeout(adRehideTimerRef.current);
      if (adAutoSlideRef.current) clearInterval(adAutoSlideRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex-1 h-screen bg-black flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-vibe-pink border-t-transparent rounded-full animate-spin" />
          <p className="text-vibe-pink font-bold animate-pulse tracking-widest text-xs uppercase">
            VIBE DRAMA...
          </p>
        </div>
      </div>
    );
  }

  const panelItem = episodePanelItemId
    ? items.find((i) => i._id === episodePanelItemId)
    : null;
  const panelEpName = panelItem
    ? episodeName[panelItem._id] || panelItem.episode1.name || "1"
    : "1";

  // Active video data for single HlsPlayer outside loop
  const activeItem = items[activeIndex];
  const activeSrc = activeItem
    ? episodeSrc[activeItem._id] || activeItem.episode1?.link_m3u8
    : "";
  const activeEpId = activeItem
    ? episodeMeta[activeItem._id]?._id || activeItem.episode1?._id
    : "";
  const activeProgress = activeItem
    ? videoProgress[activeItem._id] || { current: 0, duration: 100 }
    : { current: 0, duration: 100 };
  const activeProgressPct =
    activeItem && isScrubbing && scrubPreview[activeItem._id] !== undefined
      ? (scrubPreview[activeItem._id] /
          (videoProgress[activeItem._id]?.duration || 100)) *
        100
      : (activeProgress.current / activeProgress.duration) * 100;
  const activeEpName = activeItem
    ? episodeName[activeItem._id] || activeItem.episode1.name || "1"
    : "1";

  return (
    <>
      {!gateReady && <SoundGateModal onUnlock={onGateUnlock} forceShow />}

      <FeedScrollViewport
        onStep={handleStepNavigate}
        swipeEnabled={!episodePanelItemId && !detailDrama}
        swipeClassName="fixed inset-0 z-50 bg-black overflow-hidden overscroll-none pb-20 lg:pb-0 lg:left-56 xl:left-72 [--swipe-y:0px]"
        scrollRef={scrollRef}
        scrollClassName="w-full h-full lg:h-screen"
        scrollStyle={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {activeItem && (
          <div className="w-full h-full lg:h-screen relative flex items-center justify-center bg-black overflow-hidden">
            <div className="w-full h-full flex flex-col lg:flex-row lg:items-center lg:justify-center lg:space-x-8 lg:h-screen">
              <div
                className="relative w-full h-full lg:h-[90dvh] lg:aspect-9/16 bg-black flex items-center justify-center cursor-pointer group overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                onClick={handleTap}
              >
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    key={`scene-fade-${activeItem._id}`}
                    initial={{
                      opacity: 0.32,
                      y: sceneDirection > 0 ? 34 : -34,
                      scale: 0.988,
                      filter: "blur(2px)",
                    }}
                    animate={{
                      opacity: 0,
                      y: 0,
                      scale: 1,
                      filter: "blur(0px)",
                    }}
                    exit={{
                      opacity: 0.3,
                      y: sceneDirection > 0 ? -16 : 16,
                      scale: 0.992,
                    }}
                    transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 z-2 bg-black pointer-events-none"
                  />
                </AnimatePresence>

                {activeSrc && (
                  <HlsPlayer
                    src={activeSrc}
                    playing={gateReady && !isPaused}
                    muted={isMuted}
                    seekTo={targetSeek[activeItem._id]}
                    episodeId={activeEpId}
                    onTimeUpdate={(cur, dur) =>
                      updateTime(activeItem._id, cur, dur)
                    }
                    className="absolute inset-0 w-full h-full"
                  />
                )}

                <AnimatePresence>
                  {floatingHearts.map((heart) => (
                    <motion.div
                      key={heart.id}
                      initial={{ opacity: 1, scale: 0, y: 0 }}
                      animate={{
                        opacity: 0,
                        scale: 2.5,
                        y: -300,
                        rotate: heart.rotate,
                        x: heart.x,
                      }}
                      className="absolute z-50 pointer-events-none text-vibe-pink drop-shadow-[0_0_15px_rgba(255,42,109,0.8)]"
                      style={{
                        left: "50%",
                        top: "50%",
                        marginLeft: -25,
                        marginTop: -25,
                      }}
                    >
                      <Heart fill="currentColor" size={60} />
                    </motion.div>
                  ))}
                </AnimatePresence>

                <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                  <AnimatePresence>
                    {isPaused && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 0.8, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.2 }}
                        transition={{
                          type: "spring",
                          damping: 20,
                          stiffness: 300,
                        }}
                        className="p-5 rounded-full bg-black/40 will-change-transform"
                      >
                        <PlayCircle className="w-16 h-16 text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="absolute inset-x-0 bottom-0 h-28 lg:h-36 bg-linear-to-t from-black/72 via-black/12 to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-black/40 to-transparent z-10 pointer-events-none" />

                <button
                  data-no-pause="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMute();
                  }}
                  className="absolute top-[calc(env(safe-area-inset-top,0px)+0.75rem)] right-3 z-30 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center border border-white/10 active:scale-90 transition-transform will-change-transform"
                  style={{
                    transform:
                      "translate3d(0, calc(var(--swipe-y, 0px) * -0.08), 0)",
                  }}
                >
                  {isMuted ? (
                    <VolumeX size={16} className="text-white" />
                  ) : (
                    <Volume2 size={16} className="text-white" />
                  )}
                </button>

                <div
                  className="absolute bottom-[calc(2rem+env(safe-area-inset-bottom,0px))] lg:bottom-8 left-4 right-16 z-20 pointer-events-none will-change-transform"
                  style={{
                    transform:
                      "translate3d(0, calc(var(--swipe-y, 0px) * 0.16), 0)",
                    opacity: "calc(1 - (var(--swipe-abs, 0) * 0.35))",
                  }}
                >
                  <AnimatePresence initial={false} mode="wait">
                    <motion.div
                      key={`caption-${activeItem._id}`}
                      initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
                      animate={{
                        opacity: isUIVisible ? 1 : 0,
                        y: isUIVisible ? 0 : 8,
                        filter: "blur(0px)",
                      }}
                      exit={{ opacity: 0, y: -14, filter: "blur(4px)" }}
                      transition={{
                        duration: 0.28,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="space-y-3"
                    >
                      <motion.div
                        className="flex flex-wrap items-center gap-2 pointer-events-auto"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: 0.02 }}
                      >
                        <div className="bg-vibe-pink/20 px-2 py-0.5 rounded text-[10px] font-bold text-vibe-pink border border-vibe-pink/30 uppercase tracking-tighter">
                          {activeItem.episode_total} Tập
                        </div>
                        <div className="bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold text-white/90 border border-white/10 uppercase tracking-tighter">
                          Tập {activeEpName}
                        </div>
                      </motion.div>

                      <motion.div
                        className="pointer-events-auto"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22, delay: 0.05 }}
                      >
                        <h3
                          className="text-white font-bold text-lg lg:text-xl drop-shadow-lg leading-tight line-clamp-1 cursor-pointer hover:text-vibe-pink transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetail(activeItem);
                          }}
                        >
                          {activeItem.name}
                        </h3>
                        <p className="text-white/90 text-xs lg:text-sm line-clamp-2 mt-1 drop-shadow-md">
                          {stripHtml(activeItem.origin_name || "").substring(
                            0,
                            100,
                          )}
                          ...
                        </p>
                      </motion.div>

                      <motion.div
                        className="flex items-center space-x-2 pointer-events-auto cursor-pointer group/ep"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEpisodePanel(activeItem._id);
                        }}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.24, delay: 0.08 }}
                      >
                        <div className="flex items-center bg-black/80 hover:bg-black border border-white/10 rounded-full px-3 py-1.5 transition-all active:scale-95">
                          <List className="w-3.5 h-3.5 text-white mr-2" />
                          <span className="text-[11px] text-white font-bold uppercase tracking-wider">
                            Chọn tập phim
                          </span>
                        </div>
                      </motion.div>

                      <div className="flex items-center space-x-2 pt-1">
                        <div className="p-1 rounded-full bg-vibe-pink/20 border border-vibe-pink/30 shadow-[0_0_10px_rgba(255,42,109,0.3)]">
                          <Headphones
                            size={10}
                            className="text-white lg:w-4 lg:h-4"
                          />
                        </div>
                        <div className="overflow-hidden w-48 lg:w-64 mask-fade-right">
                          <motion.div
                            animate={{ x: [0, -200] }}
                            transition={{
                              repeat: Infinity,
                              duration: 8,
                              ease: "linear",
                            }}
                            className="text-[10px] lg:text-sm font-bold text-white/80 flex space-x-12 whitespace-nowrap"
                          >
                            <span>
                              🎵 Âm thanh gốc - Vibe Drama - {activeItem.name}{" "}
                              (Tập {activeEpName}) 🎵{" "}
                            </span>
                            <span>
                              🎵 Âm thanh gốc - Vibe Drama - {activeItem.name}{" "}
                              (Tập {activeEpName}) 🎵{" "}
                            </span>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div
                  className="lg:hidden absolute right-3 bottom-24 z-30 flex flex-col items-center space-y-4 will-change-transform"
                  // style={{
                  //   transform:
                  //     "translate3d(calc(var(--swipe-progress, 0) * 26px), calc(var(--swipe-y, 0px) * 0.18), 0)",
                  // }}
                >
                  <EpisodeRailVisibility
                    motionKey={`rail-mobile-${activeItem._id}-${activeEpId}`}
                    visible={isUIVisible}
                  >
                    <EpisodeInteractionRail
                      dramaId={activeItem._id}
                      dramaSlug={activeItem.slug}
                      dramaName={activeItem.name}
                      episodeId={activeEpId}
                      episodeName={activeEpName}
                      refUserId={user?.id}
                      variant="mobile"
                      enabled
                    />
                  </EpisodeRailVisibility>
                </div>

                <div
                  ref={(el) => {
                    progressBarRefs.current[activeItem._id] = el;
                  }}
                  className={`fixed lg:absolute left-0 right-0 z-120 lg:z-40 h-3 flex items-end cursor-pointer group/bar py-1 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:bottom-0 will-change-transform transition-opacity duration-150 ${
                    isUIVisible || isScrubbing
                      ? "pointer-events-auto"
                      : "pointer-events-none"
                  }`}
                  style={{
                    transform:
                      "translate3d(0, calc(var(--swipe-y, 0px) * -0.06), 0)",
                    opacity: isScrubbing
                      ? 1
                      : isUIVisible
                        ? "calc(1 - min(1, var(--swipe-abs, 0) * 2.4))"
                        : 0,
                  }}
                  onMouseDown={(e) => onProgressMouseDown(e, activeItem._id)}
                  onTouchStart={(e) => onProgressTouchStart(e, activeItem._id)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <AnimatePresence initial={false} mode="wait">
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{
                        duration: 0.22,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="w-full"
                    >
                      <div className="relative w-full h-0.5 group-hover/bar:h-1 transition-all duration-100 bg-white/20">
                        <div
                          className="absolute top-0 left-0 h-full bg-vibe-pink shadow-[0_0_15px_rgba(255,42,109,0.9)] transition-none will-change-[width]"
                          style={{ width: `${activeProgressPct}%` }}
                        />
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              <div
                className="hidden lg:flex flex-col items-center space-y-7 z-30 shrink-0 will-change-transform"
                style={{
                  transform:
                    "translate3d(calc(var(--swipe-progress, 0) * 34px), calc(var(--swipe-y, 0px) * 0.14), 0)",
                }}
              >
                <EpisodeRailVisibility
                  motionKey={`rail-pc-${activeItem._id}-${activeEpId}`}
                  visible={isUIVisible}
                >
                  <EpisodeInteractionRail
                    dramaId={activeItem._id}
                    dramaSlug={activeItem.slug}
                    dramaName={activeItem.name}
                    episodeId={activeEpId}
                    episodeName={activeEpName}
                    refUserId={user?.id}
                    variant="pc"
                    enabled
                  />
                </EpisodeRailVisibility>
              </div>
            </div>
          </div>
        )}
      </FeedScrollViewport>

      {/* Episode Drawer — rendered outside scroll so it covers mobile nav */}
      <AnimatePresence>
        {panelItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 lg:left-72 z-199 bg-black/60 backdrop-blur-sm"
              onClick={closeEpisodePanel}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{
                type: "spring",
                damping: 32,
                stiffness: 180,
                mass: 0.8,
              }}
              className="fixed bottom-0 left-0 right-0 z-200 bg-[#111] rounded-t-3xl border-t border-white/10 max-h-[92%] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] lg:left-[calc(9rem+50vw)] lg:right-auto lg:-translate-x-1/2 lg:w-[calc(90dvh*9/16)] lg:max-h-[85%]"
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div>
                  <h4 className="text-white font-black text-lg">
                    {panelItem.name}
                  </h4>
                  <p className="text-white/40 text-sm mt-0.5">
                    Tập đang xem:{" "}
                    <span className="text-vibe-pink font-bold">
                      {panelEpName}
                    </span>
                  </p>
                </div>
                <button
                  onClick={closeEpisodePanel}
                  className="w-10 h-10 rounded-full bg-black/80 flex items-center justify-center hover:bg-black transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>

              {/* Episode Grid */}
              <div className="overflow-y-auto flex-1 px-6 py-4 pb-6">
                {loadingEpisodes ? (
                  <div className="grid grid-cols-5 lg:grid-cols-8 gap-2">
                    {Array.from({ length: 15 }).map((_, i) => (
                      <div
                        key={i}
                        className="aspect-square rounded-xl bg-white/5 animate-pulse"
                      />
                    ))}
                  </div>
                ) : episodes.length === 0 ? (
                  <p className="text-white/40 text-center py-12">
                    Không có tập nào
                  </p>
                ) : (
                  <div className="grid grid-cols-5 lg:grid-cols-8 gap-2">
                    {episodes.map((ep) => {
                      const isCurrentEp =
                        (episodeSrc[panelItem._id] ||
                          panelItem.episode1.link_m3u8) === ep.link_m3u8;
                      return (
                        <button
                          key={ep._id}
                          onClick={() => playEpisode(panelItem._id, ep)}
                          className={`relative aspect-square rounded-xl flex items-center justify-center text-sm font-black transition-all duration-200 ${
                            isCurrentEp
                              ? "bg-vibe-pink text-white"
                              : "bg-black/80 text-white/75 hover:bg-black hover:text-white"
                          }`}
                        >
                          {isCurrentEp && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                              <PlayCircle
                                size={10}
                                className="text-vibe-pink"
                              />
                            </div>
                          )}
                          {ep.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Drama Detail Sheet */}
      <DramaDetailSheet
        drama={detailDrama}
        currentEpLink={
          detailDrama
            ? episodeSrc[detailDrama._id] || detailDrama.episode1?.link_m3u8
            : undefined
        }
        onClose={closeDetail}
        onPlayEpisode={handlePlayFromDetail}
      />

      {/* Ad Banner overlay — bottom-right, appears after watch threshold */}
      <AnimatePresence>
        {adVisible && adBanners.length > 0 && (
          <motion.div
            key="ad-banner-container"
            initial={{ opacity: 0, scale: 0.7, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: -12 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="fixed right-3 z-1150 bottom-[calc(94px+env(safe-area-inset-bottom,0px))] lg:bottom-10 lg:right-6"
            onClick={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            data-no-pause="true"
          >
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismissAd(false);
                }}
                className="absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full bg-black/80 border border-white/20 flex items-center justify-center active:scale-90 transition-transform shadow-md"
              >
                <X size={9} className="text-white/80" />
              </button>

              {/* Inner swap — AnimatePresence with mode="wait" */}
              <AnimatePresence mode="wait">
                {adBanner && (
                  <motion.a
                    key={`ad-img-${adIndex}`}
                    href={adBanner.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissAd(true);
                    }}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="block active:opacity-75"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={adBanner.imageUrl}
                      alt={adBanner.altText}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (
                          !target.dataset.retriedProtocol &&
                          target.src.startsWith("http://")
                        ) {
                          target.dataset.retriedProtocol = "1";
                          target.src = target.src.replace(
                            "http://",
                            "https://",
                          );
                          return;
                        }
                        setAdVisible(false);
                        if (adWatchTimerRef.current) {
                          clearTimeout(adWatchTimerRef.current);
                          adWatchTimerRef.current = null;
                        }
                        if (adRehideTimerRef.current) {
                          clearTimeout(adRehideTimerRef.current);
                          adRehideTimerRef.current = null;
                        }
                        if (adAutoSlideRef.current) {
                          clearInterval(adAutoSlideRef.current);
                          adAutoSlideRef.current = null;
                        }
                        setAdIndex((i) => i + 1);
                      }}
                      className="rounded-2xl object-cover"
                      style={{ width: 72, height: 72 }}
                    />
                  </motion.a>
                )}
              </AnimatePresence>

              {/* Dots indicator — only shown when multiple banners */}
              {adBanners.length > 1 && (
                <div className="flex justify-center gap-1 mt-1.5">
                  {adBanners.map((_, i) => (
                    <div
                      key={i}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: adIndex % adBanners.length === i ? 10 : 4,
                        height: 4,
                        background:
                          adIndex % adBanners.length === i
                            ? "rgba(255,255,255,0.9)"
                            : "rgba(255,255,255,0.3)",
                      }}
                    />
                  ))}
                </div>
              )}

              <div className="flex justify-center mt-1">
                <span className="text-[8px] font-semibold text-white/50 bg-black/50 rounded px-1 py-0.5 leading-none">
                  Tài trợ
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
