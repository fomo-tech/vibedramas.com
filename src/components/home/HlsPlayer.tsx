"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWatchEarn } from "@/hooks/useWatchEarn";
import CoinIcon from "@/components/ui/CoinIcon";
import { useAppStore } from "@/store/useAppStore";

interface HlsPlayerProps {
  src: string;
  playing?: boolean;
  muted?: boolean;
  performanceMode?: "auto" | "smooth-mobile";
  seekTo?: number;
  className?: string;
  episodeId?: string;
  poster?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onVideoElement?: (el: HTMLVideoElement | null) => void;
}

type HlsLevelController = {
  levels?: Array<{
    bitrate?: number;
    height?: number;
    width?: number;
  }>;
  autoLevelCapping: number;
  nextLevel: number;
  loadLevel: number;
};

// HLS config tuned to reduce stutter when audio is enabled
const HLS_CONFIG = {
  // Keep transmuxing in worker to reduce main-thread blocking.
  enableWorker: true,
  lowLatencyMode: false,
  // Allow deeper buffer so playback can continue if audio sync jitters briefly.
  maxBufferLength: 30,
  maxMaxBufferLength: 60,
  backBufferLength: 2,
  // Retry strategy
  manifestLoadingMaxRetry: 3,
  levelLoadingMaxRetry: 3,
  fragLoadingMaxRetry: 3,
  // Start at auto quality, use conservative bandwidth estimate
  startLevel: -1,
  abrEwmaDefaultEstimate: 800_000,
  testBandwidth: false,
  progressive: true,
  // Sync / stall recovery tuning for audio-induced hitching
  nudgeMaxRetries: 10,
  nudgeOffset: 0.1,
  highBufferWatchdogPeriod: 2,
  maxSeekHole: 0.5,
  // Keep existing stall preferences
  maxStarvationDelay: 2,
  maxLoadingDelay: 2,
  maxBufferSize: 15 * 1000 * 1000,
  maxBufferHole: 0.5,
};

export default function HlsPlayer({
  src,
  playing = false,
  muted = true,
  performanceMode = "auto",
  seekTo,
  className = "",
  episodeId = "",
  poster,
  onTimeUpdate,
  onPlay,
  onPause,
  onVideoElement,
}: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hlsRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  // Throttle onTimeUpdate to reduce re-renders (fires ~4x/sec natively)
  const lastTimeUpdateRef = useRef(0);
  // Track whether hls.startLoad() was ever called — prevents stopLoad()
  // on an IDLE (never-started) instance which can corrupt HLS.js state machine
  const hlsEverStartedRef = useRef(false);
  // Stable refs to latest props — used in async callbacks/timeouts to avoid stale closures
  const playingRef = useRef(playing);
  const mutedRef = useRef(muted);
  // Track if we had to force-mute for autoplay — will try to unmute after user gesture
  const forceMutedRef = useRef(false);
  const unmuteQualityTimerRef = useRef<number | null>(null);
  const unmuteStabilityTimerRef = useRef<number | null>(null);
  const smoothCapLevelRef = useRef<number>(-1);
  const smoothDeviceRef = useRef(false);
  // Track if we should force unmute on next play (set by external user gesture)
  const forceUnmuteOnNextPlayRef = useRef(false);
  // Web Audio API routing: video stays muted, audio goes through gain node
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioConnectedRef = useRef(false);
  const audioVideoElementRef = useRef<HTMLVideoElement | null>(null); // Track which video element has audio connected

  const pickSmoothLevel = useCallback(
    (levels?: HlsLevelController["levels"]) => {
      if (!Array.isArray(levels) || levels.length === 0) return -1;

      // Prefer <=720p and <=1.8Mbps to keep mobile decode/audio pipeline stable.
      for (let i = 0; i < levels.length; i += 1) {
        const level = levels[i];
        if (!level) continue;
        const height = level.height ?? Number.MAX_SAFE_INTEGER;
        const bitrate = level.bitrate ?? Number.MAX_SAFE_INTEGER;
        if (height <= 720 && bitrate <= 1_800_000) return i;
      }

      // Fallback: pick the lowest bitrate level.
      let bestIdx = 0;
      let bestBitrate = Number.MAX_SAFE_INTEGER;
      for (let i = 0; i < levels.length; i += 1) {
        const bitrate = levels[i]?.bitrate ?? Number.MAX_SAFE_INTEGER;
        if (bitrate < bestBitrate) {
          bestBitrate = bitrate;
          bestIdx = i;
        }
      }
      return bestIdx;
    },
    [],
  );

  const applySmoothCap = useCallback(
    (keep = false) => {
      if (!hlsRef.current) return;

      const hls = hlsRef.current as HlsLevelController;
      const levels = hls.levels;
      if (!Array.isArray(levels) || levels.length === 0) return;

      const selected =
        smoothCapLevelRef.current >= 0
          ? smoothCapLevelRef.current
          : pickSmoothLevel(levels);
      if (selected < 0) return;

      smoothCapLevelRef.current = selected;
      hls.autoLevelCapping = selected;
      try {
        hls.nextLevel = selected;
        hls.loadLevel = selected;
      } catch {
        // Ignore level-switch errors during stream transitions
      }

      if (!keep) {
        if (unmuteQualityTimerRef.current) {
          window.clearTimeout(unmuteQualityTimerRef.current);
        }
        unmuteQualityTimerRef.current = window.setTimeout(() => {
          try {
            if (hlsRef.current) hlsRef.current.autoLevelCapping = -1;
          } catch {
            // Ignore capping-release errors
          }
          unmuteQualityTimerRef.current = null;
        }, 2500);
      }
    },
    [pickSmoothLevel],
  );
  // Sync refs inside effects (not during render — avoids lint error)
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    mutedRef.current = muted;
    // Control volume via Web Audio API gain node (bypasses autoplay restrictions)
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = muted ? 0 : 1;
    }
  }, [muted]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const cores = navigator.hardwareConcurrency ?? 8;
    const memory =
      (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    smoothDeviceRef.current = coarse && (cores <= 6 || memory <= 4);
  }, []);

  // Sync mute state - simplified approach with aggressive AudioContext resume
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !isLoaded) return;

    // Clear any pending timers
    if (unmuteStabilityTimerRef.current) {
      window.clearTimeout(unmuteStabilityTimerRef.current);
      unmuteStabilityTimerRef.current = null;
    }

    // Aggressive AudioContext resume on every mute state change
    if (!muted && audioContextRef.current) {
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current
          .resume()
          .then(() => {
            console.log(
              "[HlsPlayer] AudioContext resumed in mute effect:",
              audioContextRef.current?.state,
            );
          })
          .catch((err) => {
            console.warn(
              "[HlsPlayer] AudioContext resume failed in mute effect:",
              err,
            );
          });
      }
    }

    // Direct video.muted control (no Web Audio routing)
    v.muted = muted;
    console.log(
      "[HlsPlayer] Muted state changed to:",
      muted,
      "video.muted:",
      v.muted,
    );

    const keepSmoothCap =
      performanceMode === "smooth-mobile" || smoothDeviceRef.current;
    if (hlsRef.current && !keepSmoothCap && !muted) {
      try {
        hlsRef.current.autoLevelCapping = -1;
      } catch {}
    }
  }, [muted, isLoaded, playing, performanceMode, applySmoothCap]);

  // HACK: Aggressive unmute enforcement via interval polling
  // This overrides ANY browser attempt to mute the video when user wants sound
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !playing || muted) return;

    let checkCount = 0;
    const interval = setInterval(() => {
      if (v.muted && !mutedRef.current) {
        // Video is muted but user wants sound → force unmute
        v.muted = false;
        checkCount++;
        console.log(`[HACK] Force unmuted (attempt ${checkCount})`);

        // Also try to resume AudioContext
        if (audioContextRef.current?.state === "suspended") {
          audioContextRef.current.resume().catch(() => {});
        }
      }
    }, 100); // Check every 100ms

    return () => clearInterval(interval);
  }, [playing, muted]);

  // Removed safety enforcer - it was blocking legitimate video.muted changes

  const { coinToast } = useWatchEarn(videoRef, episodeId);
  const updatePlayerActive = useAppStore((s) => s.updatePlayerActive);

  // Tell global GiftBox whether this player is active
  const isActive = playing && isLoaded;
  const prevActiveRef = React.useRef(false);
  useEffect(() => {
    const prev = prevActiveRef.current;
    prevActiveRef.current = isActive;
    if (isActive && !prev) updatePlayerActive(true);
    if (!isActive && prev) updatePlayerActive(false);
    return () => {
      if (prevActiveRef.current) updatePlayerActive(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const destroyHls = useCallback(() => {
    if (unmuteStabilityTimerRef.current) {
      window.clearTimeout(unmuteStabilityTimerRef.current);
      unmuteStabilityTimerRef.current = null;
    }

    if (unmuteQualityTimerRef.current) {
      window.clearTimeout(unmuteQualityTimerRef.current);
      unmuteQualityTimerRef.current = null;
    }

    // CRITICAL: Disconnect Web Audio nodes before switching video
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.disconnect();
      } catch {}
      audioSourceRef.current = null;
    }
    if (gainNodeRef.current) {
      try {
        gainNodeRef.current.disconnect();
      } catch {}
      gainNodeRef.current = null;
    }
    audioConnectedRef.current = false;
    audioVideoElementRef.current = null;

    if (hlsRef.current) {
      try {
        hlsRef.current.stopLoad();
        hlsRef.current.detachMedia();
        hlsRef.current.destroy();
      } catch {
        // Ignore errors during destroy
      }
      hlsRef.current = null;
    }
    hlsEverStartedRef.current = false;
    smoothCapLevelRef.current = -1;
  }, []);

  // Initialize HLS when src changes (on mount / src swap)
  // Uses autoStartLoad:false — only the manifest (~2 KB) is fetched here.
  // Video segments are NOT loaded until playing=true (play effect below).
  // Adjacent videos (isNear=true) pre-load their manifests so playback starts
  // immediately when scrolled to, without competing for bandwidth.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let cancelled = false;

    const init = async () => {
      video.pause();
      video.currentTime = 0;
      destroyHls();
      setIsLoaded(false);

      // iOS / Safari: native HLS, no hls.js needed.
      // preload="none" + video.load() registers the source without fetching data.
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        video.load();
        if (!cancelled) setIsLoaded(true);
        return;
      }

      const { default: Hls } = await import("hls.js");
      if (cancelled) return;

      if (!Hls.isSupported()) {
        video.src = src;
        if (!cancelled) setIsLoaded(true);
        return;
      }

      // autoStartLoad: false → fetch manifest only.
      // Segments start when hls.startLoad() is called in the play effect.
      const hls = new Hls({ ...HLS_CONFIG, autoStartLoad: false });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (cancelled || hlsRef.current !== hls) return;
        smoothCapLevelRef.current = pickSmoothLevel(
          (hlsRef.current as HlsLevelController).levels,
        );
        if (performanceMode === "smooth-mobile" || smoothDeviceRef.current) {
          applySmoothCap(true);
        }
        // If already supposed to be playing, start segments immediately
        // (avoids 1-render-cycle delay between setIsLoaded and play effect)
        if (playingRef.current) {
          hls.startLoad(0);
          hlsEverStartedRef.current = true;
        }
        setIsLoaded(true);
      });

      hls.on(
        Hls.Events.ERROR,
        (_: unknown, data: { fatal: boolean; type: string }) => {
          if (data.fatal) {
            if (data.type === "networkError") {
              // Restart loading from current video position on network recovery
              const currentTime = videoRef.current?.currentTime ?? 0;
              hls.startLoad(currentTime);
              hlsEverStartedRef.current = true;
            } else {
              destroyHls();
            }
          }
        },
      );
    };

    init();

    return () => {
      cancelled = true;
      destroyHls();
      setIsLoaded(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, performanceMode, pickSmoothLevel, applySmoothCap]);

  // Helper: play muted as fallback.
  // Unmuting is handled by the muted effect via tryStableUnmute — no separate timer needed.
  const playMutedThenUnmute = useCallback((v: HTMLVideoElement) => {
    v.muted = true;
    forceMutedRef.current = true;
    v.play().catch(() => {});
  }, []);

  // Handle Play/Pause + segment loading control
  // Uses a micro-delay to debounce rapid playing toggles during fast scroll
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isLoaded) return;

    if (playing) {
      // Small delay to avoid rapid stop→start during fast scroll
      const playTimer = setTimeout(() => {
        if (!playingRef.current || !videoRef.current) return;
        const v = videoRef.current;

        // Start segment download
        if (hlsRef.current && !hlsEverStartedRef.current) {
          hlsRef.current.startLoad(0);
          hlsEverStartedRef.current = true;
        } else if (hlsRef.current && hlsEverStartedRef.current) {
          hlsRef.current.startLoad(v.currentTime);
        }

        if (performanceMode === "smooth-mobile" || smoothDeviceRef.current) {
          applySmoothCap(true);
        }

        // SIMPLIFIED: Direct video.muted control with aggressive AudioContext resume
        // Web Audio routing had too many quirks across platforms.
        // This approach: init AudioContext early, resume aggressively, use plain video.muted

        // Ensure AudioContext exists and is running
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let ctx = (window as any).__vibeAudioContext as
            | AudioContext
            | undefined;
          if (!ctx) {
            const AudioContext =
              window.AudioContext ||
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (window as any).webkitAudioContext;
            if (AudioContext) {
              ctx = new AudioContext();
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (window as any).__vibeAudioContext = ctx;
              console.log("[HlsPlayer] AudioContext created:", ctx.state);
            }
          }

          if (ctx) {
            audioContextRef.current = ctx;
            if (ctx.state === "suspended") {
              ctx
                .resume()
                .then(() => {
                  console.log("[HlsPlayer] AudioContext resumed:", ctx?.state);
                })
                .catch((err) => {
                  console.warn("[HlsPlayer] AudioContext resume failed:", err);
                });
            } else {
              console.log(
                "[HlsPlayer] AudioContext already running:",
                ctx.state,
              );
            }
          }
        } catch (err) {
          console.error("[HlsPlayer] AudioContext init failed:", err);
        }

        // Set video muted state directly (no Web Audio routing)
        v.muted = mutedRef.current;
        console.log(
          "[HlsPlayer] Video muted set to:",
          mutedRef.current,
          "playing:",
          playingRef.current,
        );

        // Reset audio connection flags (not used anymore)
        audioConnectedRef.current = false;
        audioVideoElementRef.current = v;
        // forceMutedRef=true only when user actually wants audio (so the watchdog
        // won't fight us while tryStableUnmute is pending).
        forceMutedRef.current = !mutedRef.current;

        // If forceUnmuteOnNextPlayRef is set (from user tap), unmute appropriately
        if (forceUnmuteOnNextPlayRef.current && !mutedRef.current) {
          forceUnmuteOnNextPlayRef.current = false;
          setTimeout(() => {
            if (playingRef.current && !mutedRef.current && videoRef.current) {
              try {
                const isIOSSafari = /iPhone|iPad|iPod/.test(
                  navigator.userAgent,
                );
                const useNativeAudio =
                  isIOSSafari &&
                  videoRef.current.canPlayType("application/vnd.apple.mpegurl");

                if (useNativeAudio) {
                  // iOS: direct unmute
                  videoRef.current.muted = false;
                } else if (gainNodeRef.current) {
                  // Android/Desktop: unmute via gain node
                  gainNodeRef.current.gain.value = 1;
                  if (audioContextRef.current?.state === "suspended") {
                    audioContextRef.current.resume().catch(() => {});
                  }
                }
              } catch {}
            }
          }, 50);
        }

        // Force play — handles all edge cases
        const forcePlay = () => {
          if (!playingRef.current || !videoRef.current) return;
          const vid = videoRef.current;
          vid.muted = true; // always start muted — unmuted later by tryStableUnmute
          const p = vid.play();
          if (p !== undefined) {
            p.catch((err) => {
              if (err.name === "NotAllowedError") {
                playMutedThenUnmute(vid);
              } else if (err.name === "AbortError") {
                // AbortError = previous pause hasn't settled. Retry after a beat.
                setTimeout(() => {
                  if (playingRef.current && videoRef.current?.paused) {
                    videoRef.current.muted = true;
                    videoRef.current.play().catch(() => {});
                  }
                }, 150);
              }
            });
          }
        };

        if (v.paused) {
          forcePlay();
        }
        // If already playing (e.g. resumed after pause): muted=true already set above.
      }, 50); // 50ms debounce — absorbs rapid scroll toggles

      return () => clearTimeout(playTimer);
    } else {
      // ✅ Immediately mute + pause to stop audio bleed on fast scroll
      video.muted = true;
      video.pause();
      // Always stop HLS segment loading when paused — fully releases the
      // audio/network/demux pipeline. startLoad(currentTime) resumes cleanly
      // on next play; hlsEverStartedRef stays true so state machine is intact.
      if (hlsRef.current && hlsEverStartedRef.current) {
        try {
          hlsRef.current.stopLoad();
        } catch {
          // ignore — HLS might already be in error state
        }
      }
    }
  }, [playing, isLoaded, playMutedThenUnmute, performanceMode, applySmoothCap]);

  // ─── Aggressive stall/freeze recovery (TikTok-style) ───────────────
  // Mobile browsers silently kill video decoders when too many are active.
  // This creates a watchdog that continuously monitors and recovers.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playing || !isLoaded) return;

    let lastTime = video.currentTime;
    let lastCheckTime = Date.now();
    let consecutiveStalls = 0;

    const recover = () => {
      if (!playingRef.current || !videoRef.current) return;
      const v = videoRef.current;

      // Layer 1: Restart HLS loading pipeline
      if (hlsRef.current) {
        try {
          hlsRef.current.startLoad(v.currentTime);
          hlsEverStartedRef.current = true;
        } catch {}
      }

      // Layer 2: If paused, force play with aggressive AudioContext resume
      if (v.paused) {
        // Resume AudioContext if exists
        if (audioContextRef.current?.state === "suspended") {
          audioContextRef.current.resume().catch(() => {});
        }

        v.muted = mutedRef.current;
        v.play().catch(() => {
          playMutedThenUnmute(v);
        });
      }

      // Layer 3: Sync audio state
      if (!v.paused) {
        v.muted = mutedRef.current;
      }
    };

    // Full nuclear recovery: destroy HLS and reinitialize
    const nuclearRecover = async () => {
      if (!playingRef.current || !videoRef.current) return;
      const v = videoRef.current;
      const currentTime = v.currentTime;

      // Native HLS — just force play with aggressive AudioContext resume
      if (v.canPlayType("application/vnd.apple.mpegurl")) {
        v.currentTime = currentTime;

        // Resume AudioContext if exists
        if (audioContextRef.current?.state === "suspended") {
          audioContextRef.current.resume().catch(() => {});
        }

        v.muted = mutedRef.current;
        v.play().catch(() => {
          playMutedThenUnmute(v);
        });
        return;
      }

      // Destroy and recreate HLS instance
      if (hlsRef.current) {
        try {
          hlsRef.current.stopLoad();
          hlsRef.current.detachMedia();
          hlsRef.current.destroy();
        } catch {}
        hlsRef.current = null;
      }

      try {
        const { default: Hls } = await import("hls.js");
        if (!playingRef.current || !Hls.isSupported()) return;

        const hls = new Hls({ ...HLS_CONFIG, autoStartLoad: true });
        hlsRef.current = hls;
        hlsEverStartedRef.current = true;
        hls.loadSource(v.src || src);
        hls.attachMedia(v);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!playingRef.current || hlsRef.current !== hls) return;
          v.currentTime = currentTime;
          v.muted = true; // Always keep video muted
          if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = mutedRef.current ? 0 : 1;
          }
          v.play().catch(() => {
            playMutedThenUnmute(v);
          });
        });

        hls.on(
          Hls.Events.ERROR,
          (_: unknown, data: { fatal: boolean; type: string }) => {
            if (data.fatal && hlsRef.current === hls) {
              try {
                hls.destroy();
              } catch {}
              if (hlsRef.current === hls) hlsRef.current = null;
            }
          },
        );
      } catch {}
    };

    const onStalled = () => {
      if (!playingRef.current) return;
      recover();
    };

    // Watchdog: check every 1s — faster AudioContext recovery detection
    const watchdog = setInterval(() => {
      if (!playingRef.current) {
        consecutiveStalls = 0;
        return;
      }

      const now = Date.now();
      const elapsed = now - lastCheckTime;
      lastCheckTime = now;

      // If paused but should be playing → immediate recovery
      if (video.paused) {
        recover();
        return;
      }

      // Check AudioContext state — resume if suspended while we want audio
      if (!mutedRef.current && audioContextRef.current?.state === "suspended") {
        try {
          audioContextRef.current.resume().catch(() => {});
        } catch {}
      }
      // If currentTime hasn't advanced
      if (elapsed > 1000 && Math.abs(video.currentTime - lastTime) < 0.1) {
        consecutiveStalls++;

        if (consecutiveStalls <= 3) {
          // Soft recovery: restart HLS loading
          recover();
        } else if (consecutiveStalls <= 6) {
          // Medium: try seeking slightly to kick decoder
          try {
            video.currentTime = video.currentTime + 0.1;
          } catch {}
          recover();
        } else {
          // Nuclear: full HLS reinit (resets counter)
          consecutiveStalls = 0;
          nuclearRecover();
        }
      } else {
        // Video is progressing — reset counter
        consecutiveStalls = 0;
      }

      lastTime = video.currentTime;
    }, 1000); // 1s interval for faster AudioContext recovery detection

    // Catch browser silently pausing the video (e.g. resource limit hit)
    const onPauseEvent = () => {
      if (playingRef.current && videoRef.current?.paused) {
        // Browser paused it — recover after brief delay to avoid fight with user tap
        setTimeout(() => {
          if (playingRef.current && videoRef.current?.paused) {
            recover();
          }
        }, 200);
      }
    };

    // Catch browser silently muting the video
    const onVolumeChange = () => {
      if (!playingRef.current || !videoRef.current) return;
      const v = videoRef.current;
      // Browser muted but user wants unmuted → try to restore
      if (v.muted && !mutedRef.current && !forceMutedRef.current) {
        // CRITICAL: Resume AudioContext FIRST before unmuting video element
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ctx = (window as any).__vibeAudioContext;
          if (ctx && ctx.state === "suspended") {
            ctx.resume().catch(() => {});
          }
        } catch {}

        // Detect iOS Safari (use direct video.muted, not Web Audio)
        const isIOSSafari = /iPhone|iPad|iPod/.test(navigator.userAgent);
        const useNativeAudio =
          isIOSSafari && v.canPlayType("application/vnd.apple.mpegurl");

        if (useNativeAudio) {
          // iOS: direct unmute
          v.muted = false;
        } else if (gainNodeRef.current) {
          // Android/Desktop: unmute via gain node
          gainNodeRef.current.gain.value = 1;
        }
      }
    };

    video.addEventListener("stalled", onStalled);
    video.addEventListener("waiting", onStalled);
    video.addEventListener("pause", onPauseEvent);
    video.addEventListener("volumechange", onVolumeChange);
    return () => {
      video.removeEventListener("stalled", onStalled);
      video.removeEventListener("waiting", onStalled);
      video.removeEventListener("pause", onPauseEvent);
      video.removeEventListener("volumechange", onVolumeChange);
      clearInterval(watchdog);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, isLoaded, src]);

  // Visibility recovery: resume video when user comes back to the tab/app.
  // iOS Safari and Android Chrome may pause video when app is backgrounded.
  useEffect(() => {
    if (!playing || !isLoaded) return;

    const onVisible = () => {
      const video = videoRef.current;
      if (!document.hidden && playingRef.current && video && video.paused) {
        if (hlsRef.current) hlsRef.current.startLoad(video.currentTime);

        // Detect iOS Safari (use direct video.muted, not Web Audio)
        const isIOSSafari = /iPhone|iPad|iPod/.test(navigator.userAgent);
        const useNativeAudio =
          isIOSSafari && video.canPlayType("application/vnd.apple.mpegurl");

        if (useNativeAudio) {
          // iOS: direct video.muted control
          video.muted = mutedRef.current;
        } else {
          // Android/Desktop: Web Audio routing
          video.muted = true;
          if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = mutedRef.current ? 0 : 1;
          }
        }

        video.play().catch(() => {
          playMutedThenUnmute(video);
        });
      }
      // Also fix audio state after returning to tab
      if (!document.hidden && playingRef.current && video && !video.paused) {
        const isIOSSafari = /iPhone|iPad|iPod/.test(navigator.userAgent);
        const useNativeAudio =
          isIOSSafari && video.canPlayType("application/vnd.apple.mpegurl");

        if (useNativeAudio) {
          // iOS: sync video.muted
          video.muted = mutedRef.current;
        } else if (gainNodeRef.current) {
          // Android/Desktop: sync gain node
          gainNodeRef.current.gain.value = mutedRef.current ? 0 : 1;
        }
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [playing, isLoaded, playMutedThenUnmute]);

  // Handle Seeking
  useEffect(() => {
    const video = videoRef.current;
    if (
      !video ||
      !isLoaded ||
      seekTo === undefined ||
      Math.abs(video.currentTime - seekTo) <= 0.5
    ) {
      return;
    }
    // Seeking can cause stall, ensure video stays muted (audio via Web Audio)
    video.muted = true;
    try {
      video.currentTime = seekTo;
    } catch {
      // Ignore seek errors on unready video
    }
  }, [seekTo, isLoaded, muted]);

  return (
    <div className={`relative w-full h-full bg-black ${className}`}>
      {/* Coin toast */}
      <AnimatePresence>
        {coinToast && (
          <motion.div
            key={coinToast.id}
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-black/80 border border-yellow-500/30 rounded-xl px-3 py-1.5 shadow-[0_0_16px_rgba(234,179,8,0.2)]"
          >
            <CoinIcon size={18} />
            <span className="text-yellow-400 font-black text-sm">
              +{coinToast.amount} xu
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pre-loader - hidden when loaded */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/40">
          <div className="w-8 h-8 border-[3px] border-vibe-pink border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <video
        ref={(el) => {
          (
            videoRef as React.MutableRefObject<HTMLVideoElement | null>
          ).current = el;
          onVideoElement?.(el);
        }}
        className="absolute inset-0 w-full h-full object-cover lg:object-contain"
        playsInline
        muted={muted}
        loop
        preload="metadata"
        poster={poster}
        style={{ willChange: "transform", transform: "translateZ(0)" }}
        onTimeUpdate={() => {
          // Throttle: max 2 updates/sec instead of ~4 → fewer re-renders
          const now = Date.now();
          if (now - lastTimeUpdateRef.current < 500) return;
          lastTimeUpdateRef.current = now;
          if (videoRef.current && onTimeUpdate) {
            onTimeUpdate(
              videoRef.current.currentTime,
              videoRef.current.duration,
            );
          }
        }}
        onPlay={onPlay}
        onPause={onPause}
      />
    </div>
  );
}
