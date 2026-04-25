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
  ArrowLeft,
  VolumeX,
  Volume2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import HlsPlayer from "@/components/home/HlsPlayer";
import FeedScrollViewport from "@/components/home/FeedScrollViewport";
import SoundGateModal from "@/components/home/SoundGateModal";
import EpisodeInteractionRail from "@/components/home/interactions/EpisodeInteractionRail";
import EpisodeRailVisibility from "@/components/home/interactions/EpisodeRailVisibility";
import { useHistory } from "@/hooks/useHistory";
import { useAuthStore } from "@/store/useAuthStore";

export interface EpFeedEpisode {
  _id: string;
  name: string;
  link_m3u8: string;
  link_embed: string;
  filename: string;
}

export interface EpFeedDrama {
  _id: string;
  slug: string;
  name: string;
  origin_name: string;
  thumb_url: string;
  poster_url: string;
  episode_total: string;
  episode_current: string;
  category: { name: string; slug: string }[];
}

interface FloatingHeart {
  id: number;
  rotate: number;
  x: number;
}

export default function EpisodeFeedScroll({
  drama,
  episodes,
}: {
  drama: EpFeedDrama;
  episodes: EpFeedEpisode[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, vipStatus } = useAuthStore();
  const { addToHistory } = useHistory();

  const initialIndex = React.useMemo(() => {
    const ep = searchParams.get("ep");
    if (!ep) return 0;
    const idx = episodes.findIndex((e) => e.name === ep);
    return idx >= 0 ? idx : 0;
  }, [searchParams, episodes]);

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [sceneDirection, setSceneDirection] = useState<1 | -1>(1);
  const activeIndexRef = useRef(initialIndex);
  const episodesLengthRef = useRef(episodes.length);

  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [gateReady, setGateReady] = useState(false);
  const [showSoundPrompt, setShowSoundPrompt] = useState(false);
  const soundPromptShownRef = useRef(false);

  const [isUIVisible, setIsUIVisible] = useState(true);
  const [isEpPanelOpen, setIsEpPanelOpen] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);

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

  const [videoProgress, setVideoProgress] = useState<
    Record<string, { current: number; duration: number }>
  >({});
  const [targetSeek, setTargetSeek] = useState<Record<string, number>>({});
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubPreview, setScrubPreview] = useState<Record<string, number>>({});
  const progressBarRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrubRAFRef = useRef<number | null>(null);

  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);
  const lastSavedEpRef = useRef<string>("");

  useEffect(() => {
    episodesLengthRef.current = episodes.length;
  }, [episodes.length]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const onGateUnlock = useCallback((enableSoundNow: boolean) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(window as any).__vibeAudioContext) {
        const AudioContext =
          window.AudioContext ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).__vibeAudioContext = ctx;
          if (ctx.state === "suspended") ctx.resume().catch(() => {});
        }
      }
    } catch {}

    setGateReady(true);
    if (enableSoundNow) {
      setIsMuted(false);
      localStorage.setItem("vibe-muted", "false");
      soundPromptShownRef.current = true;
    }
  }, []);

  useEffect(() => {
    fetch("/api/ad-banner")
      .then((r) => r.json())
      .then((payload) => {
        const data: AdBannerItem[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

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
      .catch((err) => console.error("[EpisodeAdBanner] fetch error:", err));
  }, [normalizeBannerUrl, vipStatus]);

  const dismissAd = useCallback(
    (openLink?: boolean) => {
      if (openLink && adBanner?.linkUrl) {
        window.open(adBanner.linkUrl, "_blank", "noopener,noreferrer");
      }
      setAdVisible(false);

      if (adWatchTimerRef.current) clearTimeout(adWatchTimerRef.current);
      if (adRehideTimerRef.current) clearTimeout(adRehideTimerRef.current);

      const current = adBanners[adIndex % Math.max(adBanners.length, 1)];
      if (!current) return;

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
  }, [adBanners, adIndex, adVisible, isPaused]);

  useEffect(() => {
    if (!adVisible || adBanners.length === 0) {
      if (adAutoSlideRef.current) {
        clearInterval(adAutoSlideRef.current);
        adAutoSlideRef.current = null;
      }
      return;
    }
    // Auto-rotate: advance to next banner every 5s while keeping it visible.
    // AnimatePresence fires exit/enter animation via key change.
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

  useEffect(() => {
    return () => {
      if (adWatchTimerRef.current) clearTimeout(adWatchTimerRef.current);
      if (adRehideTimerRef.current) clearTimeout(adRehideTimerRef.current);
      if (adAutoSlideRef.current) clearInterval(adAutoSlideRef.current);
    };
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((m) => {
      const next = !m;
      localStorage.setItem("vibe-muted", String(next));
      return next;
    });
    soundPromptShownRef.current = true;
    setShowSoundPrompt(false);
  }, []);

  const enableSound = useCallback(() => {
    setIsMuted(false);
    localStorage.setItem("vibe-muted", "false");
    soundPromptShownRef.current = true;
    setShowSoundPrompt(false);
  }, []);

  const resetUITimer = useCallback(() => {
    setIsUIVisible(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setIsUIVisible(false), 10000);
  }, []);

  useEffect(() => {
    startTransition(resetUITimer);
    if (activeIndex >= 2 && isMuted && !soundPromptShownRef.current) {
      soundPromptShownRef.current = true;
      setShowSoundPrompt(true);
      const timer = setTimeout(() => setShowSoundPrompt(false), 8000);
      return () => {
        clearTimeout(timer);
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      };
    }
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [activeIndex, resetUITimer, isMuted]);

  useEffect(() => {
    return () => {
      if (scrubRAFRef.current) cancelAnimationFrame(scrubRAFRef.current);
    };
  }, []);

  const handleStepNavigate = useCallback(
    (direction: 1 | -1) => {
      const next = Math.max(
        0,
        Math.min(
          episodesLengthRef.current - 1,
          activeIndexRef.current + direction,
        ),
      );
      if (next === activeIndexRef.current) return;
      resetUITimer();
      if (isEpPanelOpen) setIsEpPanelOpen(false);
      setSceneDirection(direction);
      activeIndexRef.current = next;
      setActiveIndex(next);
      setIsPaused(false);
    },
    [isEpPanelOpen, resetUITimer],
  );

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (isEpPanelOpen) return;
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
      setIsPaused((p) => !p);
    }
    lastTapRef.current = now;
  };

  const updateTime = (id: string, current: number, duration: number) => {
    if (isScrubbing) return;
    setVideoProgress((prev) => ({ ...prev, [id]: { current, duration } }));
  };

  const getScrubTime = (
    clientX: number,
    bar: HTMLDivElement,
    duration: number,
  ) => {
    const rect = bar.getBoundingClientRect();
    return (
      Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) * duration
    );
  };

  const onProgressMouseDown = (e: React.MouseEvent, epId: string) => {
    e.stopPropagation();
    const bar = progressBarRefs.current[epId];
    const duration = videoProgress[epId]?.duration || 0;
    if (!bar || !duration) return;
    setIsScrubbing(true);
    const t = getScrubTime(e.clientX, bar, duration);
    setScrubPreview((prev) => ({ ...prev, [epId]: t }));
    setTargetSeek((prev) => ({ ...prev, [epId]: t }));
    const onMove = (mv: MouseEvent) => {
      const time = getScrubTime(mv.clientX, bar, duration);
      if (scrubRAFRef.current) cancelAnimationFrame(scrubRAFRef.current);
      scrubRAFRef.current = requestAnimationFrame(() => {
        setScrubPreview((prev) => ({ ...prev, [epId]: time }));
        setTargetSeek((prev) => ({ ...prev, [epId]: time }));
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

  const onProgressTouchStart = (e: React.TouchEvent, epId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const bar = progressBarRefs.current[epId];
    const duration = videoProgress[epId]?.duration || 0;
    if (!bar || !duration) return;
    setIsScrubbing(true);
    const t = getScrubTime(e.touches[0].clientX, bar, duration);
    setScrubPreview((prev) => ({ ...prev, [epId]: t }));
    setTargetSeek((prev) => ({ ...prev, [epId]: t }));
    const onMove = (mv: TouchEvent) => {
      mv.preventDefault();
      const time = getScrubTime(mv.touches[0].clientX, bar, duration);
      if (scrubRAFRef.current) cancelAnimationFrame(scrubRAFRef.current);
      scrubRAFRef.current = requestAnimationFrame(() => {
        setScrubPreview((prev) => ({ ...prev, [epId]: time }));
        setTargetSeek((prev) => ({ ...prev, [epId]: time }));
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

  const activeEp = episodes[activeIndex];

  useEffect(() => {
    const ep = episodes[activeIndex];
    if (!ep) return;
    const key = `${drama._id}:${ep.name}`;
    if (lastSavedEpRef.current === key) return;
    lastSavedEpRef.current = key;
    addToHistory({
      _id: drama._id,
      slug: drama.slug,
      name: drama.name,
      origin_name: drama.origin_name,
      thumb_url: drama.thumb_url,
      poster_url: drama.poster_url,
      episode: ep.name,
      watchedAt: Date.now(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  if (episodes.length === 0 || !activeEp) {
    return (
      <div className="h-full flex items-center justify-center bg-black text-white/40">
        <p>Chưa có tập nào</p>
      </div>
    );
  }

  const prog = videoProgress[activeEp._id] || { current: 0, duration: 100 };
  const progressPct =
    isScrubbing && scrubPreview[activeEp._id] !== undefined
      ? (scrubPreview[activeEp._id] /
          (videoProgress[activeEp._id]?.duration || 100)) *
        100
      : (prog.current / prog.duration) * 100;

  return (
    <>
      {!gateReady && <SoundGateModal onUnlock={onGateUnlock} forceShow />}

      <AnimatePresence>
        {showSoundPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-200 flex items-center justify-center bg-black/60"
            onClick={enableSound}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="flex flex-col items-center gap-5 px-8 py-7 rounded-3xl bg-linear-to-b from-zinc-900/95 via-[#2b1307]/95 to-black/95 border border-vibe-pink/30 shadow-[0_0_60px_rgba(255,69,0,0.22)] max-w-75 mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "easeInOut",
                }}
                className="w-20 h-20 rounded-full bg-linear-to-br from-vibe-pink to-vibe-orange flex items-center justify-center shadow-[0_0_30px_rgba(255,69,0,0.4)]"
              >
                <VolumeX className="w-9 h-9 text-white" />
              </motion.div>
              <div className="text-center space-y-2">
                <h3 className="text-white font-bold text-lg">Bật âm thanh?</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Nhấn để xem video có tiếng, trải nghiệm tốt hơn!
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={enableSound}
                className="w-full py-3.5 rounded-2xl bg-linear-to-r from-vibe-pink to-vibe-orange text-white font-bold text-base shadow-[0_4px_20px_rgba(255,69,0,0.35)] active:shadow-none transition-shadow"
              >
                <span className="flex items-center justify-center gap-2">
                  <Volume2 className="w-5 h-5" />
                  Bật âm thanh
                </span>
              </motion.button>
              <button
                onClick={() => setShowSoundPrompt(false)}
                className="text-zinc-500 text-xs hover:text-zinc-300 transition-colors"
              >
                Để sau
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <FeedScrollViewport
        onStep={handleStepNavigate}
        swipeEnabled={!isEpPanelOpen && !showSoundPrompt}
        swipeClassName="w-full h-svh lg:h-screen bg-black overflow-hidden"
        scrollClassName="w-full h-svh lg:h-screen bg-black"
      >
        <div className="w-full h-svh lg:h-screen relative flex items-center justify-center bg-black overflow-hidden">
          <div className="w-full h-full flex flex-col lg:flex-row lg:items-center lg:justify-center lg:space-x-8 lg:h-screen">
            <div
              className="relative z-10 w-full h-full lg:h-[90dvh] lg:aspect-9/16 bg-black flex items-center justify-center cursor-pointer group overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
              onClick={handleTap}
            >
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={`scene-shift-${activeEp._id}`}
                  initial={{
                    opacity: 0.32,
                    y: sceneDirection > 0 ? 40 : -40,
                    scale: 0.985,
                    filter: "blur(2px)",
                  }}
                  animate={{ opacity: 0, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{
                    opacity: 0.3,
                    y: sceneDirection > 0 ? -18 : 18,
                    scale: 0.99,
                  }}
                  transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 z-2 bg-black pointer-events-none"
                />
              </AnimatePresence>

              <HlsPlayer
                src={activeEp.link_m3u8}
                playing={!isPaused && gateReady}
                muted={isMuted}
                seekTo={targetSeek[activeEp._id]}
                performanceMode="smooth-mobile"
                episodeId={activeEp._id}
                onTimeUpdate={(current, duration) =>
                  updateTime(activeEp._id, current, duration)
                }
                className="absolute inset-0 w-full h-full"
              />

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
                      className="p-5 rounded-full bg-black/40"
                    >
                      <PlayCircle className="w-16 h-16 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="absolute inset-x-0 bottom-0 h-28 lg:h-36 bg-linear-to-t from-black/72 via-black/12 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-black/40 to-transparent z-10 pointer-events-none" />

              <button
                onClick={() => router.back()}
                className="pointer-events-auto absolute top-[calc(env(safe-area-inset-top,0px)+0.75rem)] left-3 z-30 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center border border-white/10 hover:bg-black/70 transition-all"
                style={{
                  transform:
                    "translate3d(0, calc(var(--swipe-y, 0px) * -0.08), 0)",
                }}
              >
                <ArrowLeft size={18} className="text-white" />
              </button>

              <motion.div
                layout
                className="pointer-events-auto absolute top-[calc(env(safe-area-inset-top,0px)+0.75rem)] right-3 z-30 flex items-center gap-2"
                transition={{ type: "spring", stiffness: 360, damping: 30 }}
                style={{
                  transform:
                    "translate3d(0, calc(var(--swipe-y, 0px) * -0.08), 0)",
                }}
              >
                <motion.button
                  layout
                  data-no-pause="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMute();
                  }}
                  className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center border border-white/10 active:scale-90 transition-transform"
                >
                  {isMuted ? (
                    <VolumeX size={16} className="text-white" />
                  ) : (
                    <Volume2 size={16} className="text-white" />
                  )}
                </motion.button>
                <AnimatePresence initial={false}>
                  {isUIVisible && episodes.length > 1 && (
                    <motion.div
                      key="ep-counter"
                      layout
                      initial={{ opacity: 0, x: 8, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 8, scale: 0.95 }}
                      transition={{ duration: 0.22 }}
                    >
                      <div className="bg-black/50 border border-white/10 rounded-full px-3 py-1 text-xs font-bold text-white">
                        {activeIndex + 1} / {episodes.length}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              <div
                className="absolute bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:bottom-8 left-4 right-16 z-20 pointer-events-none will-change-transform"
                style={{
                  transform:
                    "translate3d(0, calc(var(--swipe-y, 0px) * 0.16), 0)",
                  opacity: "calc(1 - (var(--swipe-abs, 0) * 0.35))",
                }}
              >
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    key={`caption-${activeEp._id}`}
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
                        {drama.episode_total} Tập
                      </div>
                      <div className="bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold text-white/90 border border-white/10 uppercase tracking-tighter">
                        Tập {activeEp.name}
                      </div>
                    </motion.div>

                    <motion.div
                      className="pointer-events-auto"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, delay: 0.05 }}
                    >
                      <h3 className="text-white font-bold text-lg lg:text-xl drop-shadow-lg leading-tight line-clamp-1">
                        {drama.name}
                      </h3>
                      <p className="text-white/90 text-xs lg:text-sm line-clamp-2 mt-1 drop-shadow-md">
                        {drama.origin_name}
                      </p>
                    </motion.div>

                    <motion.div
                      className="flex items-center space-x-2 pointer-events-auto cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEpPanelOpen(true);
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
                            🎵 Âm thanh gốc - Vibe Drama - {drama.name} (Tập{" "}
                            {activeEp.name}) 🎵{" "}
                          </span>
                          <span>
                            🎵 Âm thanh gốc - Vibe Drama - {drama.name} (Tập{" "}
                            {activeEp.name}) 🎵{" "}
                          </span>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div
                className="lg:hidden absolute right-3 bottom-40 z-30 flex flex-col items-center space-y-4"
                // style={{
                //   transform:
                //     "translate3d(calc(var(--swipe-progress, 0) * 40px), calc(var(--swipe-y, 0px) * 0.24), 0)",
                // }}
              >
                <EpisodeRailVisibility
                  motionKey={`rail-mobile-${activeEp._id}`}
                  visible={isUIVisible}
                >
                  <EpisodeInteractionRail
                    dramaId={drama._id}
                    dramaSlug={drama.slug}
                    dramaName={drama.name}
                    episodeId={activeEp._id}
                    episodeName={activeEp.name}
                    refUserId={user?.id}
                    variant="mobile"
                    enabled
                  />
                </EpisodeRailVisibility>
              </div>

              <div
                ref={(el) => {
                  progressBarRefs.current[activeEp._id] = el;
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
                onMouseDown={(e) => onProgressMouseDown(e, activeEp._id)}
                onTouchStart={(e) => onProgressTouchStart(e, activeEp._id)}
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
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div
              className="hidden lg:flex flex-col items-center space-y-7 z-30 shrink-0"
              style={{
                transform:
                  "translate3d(calc(var(--swipe-progress, 0) * 58px), calc(var(--swipe-y, 0px) * 0.24), 0)",
              }}
            >
              <EpisodeRailVisibility
                motionKey={`rail-pc-${activeEp._id}`}
                visible={isUIVisible}
              >
                <EpisodeInteractionRail
                  dramaId={drama._id}
                  dramaSlug={drama.slug}
                  dramaName={drama.name}
                  episodeId={activeEp._id}
                  episodeName={activeEp.name}
                  refUserId={user?.id}
                  variant="pc"
                  enabled
                />
              </EpisodeRailVisibility>
            </div>
          </div>
        </div>
      </FeedScrollViewport>

      <AnimatePresence>
        {isEpPanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 lg:left-72 z-199 bg-black/60"
              onClick={() => {
                setIsEpPanelOpen(false);
              }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 320,
                mass: 0.8,
              }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(_, info) => {
                if (info.velocity.y > 300 || info.offset.y > 150) {
                  setIsEpPanelOpen(false);
                }
              }}
              className="fixed bottom-0 left-0 right-0 z-200 bg-[#111] rounded-t-3xl border-t border-white/10 max-h-[92%] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] lg:left-[calc(9rem+50vw)] lg:right-auto lg:-translate-x-1/2 lg:w-[calc(90dvh*9/16)] lg:max-h-[85%]"
            >
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-9 h-1 rounded-full bg-white/20" />
              </div>
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div>
                  <h4 className="text-white font-black text-lg">
                    {drama.name}
                  </h4>
                  <p className="text-white/40 text-sm mt-0.5">
                    Tập đang xem:{" "}
                    <span className="text-vibe-pink font-bold">
                      {activeEp.name}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsEpPanelOpen(false);
                  }}
                  className="w-10 h-10 rounded-full bg-black/80 flex items-center justify-center hover:bg-black transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 px-6 py-4 pb-8">
                <div className="grid grid-cols-5 lg:grid-cols-8 gap-2">
                  {episodes.map((ep, idx) => {
                    const isCur = idx === activeIndex;
                    return (
                      <button
                        key={ep._id}
                        onClick={() => {
                          setSceneDirection(
                            idx >= activeIndexRef.current ? 1 : -1,
                          );
                          activeIndexRef.current = idx;
                          setActiveIndex(idx);
                          setIsPaused(false);
                          setIsEpPanelOpen(false);
                        }}
                        className={`relative aspect-square rounded-xl flex items-center justify-center text-sm font-black transition-all duration-200 ${
                          isCur
                            ? "bg-vibe-pink text-white shadow-[0_0_12px_rgba(223,36,255,0.5)]"
                            : "bg-black/80 text-white/75 hover:bg-black hover:text-white"
                        }`}
                      >
                        {isCur && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                            <PlayCircle size={10} className="text-vibe-pink" />
                          </div>
                        )}
                        {ep.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Ad Banner overlay — episode scroll */}
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

              {/* Inner swap — AnimatePresence with mode="wait" so exit completes before enter */}
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
