"use client";

import { useState, useEffect, useCallback, useRef, useId } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { API_ROUTES } from "@/lib/api";

export type GiftBoxState = "idle" | "ready" | "opening" | "collected";

const SESSION_EXP_KEY = "vd_gift_watch"; // seconds accumulated
const SESSION_MAX_KEY = "vd_gift_max"; // watchMax at time of save
const DEFAULT_WATCH_MAX = 60;
const LEADER_KEY = "vd_timer_leader"; // tab leader lock
const LEADER_TTL = 2500; // ms — if no renewal in 2.5s, lock is stale

function getSessionKeys(userId?: string | null) {
  const scope = userId?.trim() ? `u_${userId}` : "guest";
  return {
    exp: `${SESSION_EXP_KEY}_${scope}`,
    max: `${SESSION_MAX_KEY}_${scope}`,
  };
}

function getLeaderKey(userId?: string | null) {
  const scope = userId?.trim() ? `u_${userId}` : "guest";
  return `${LEADER_KEY}_${scope}`;
}

function tryClaimLeader(tabId: string, userId?: string | null): boolean {
  if (typeof window === "undefined") return false;
  try {
    const leaderKey = getLeaderKey(userId);
    const raw = localStorage.getItem(leaderKey);
    if (raw) {
      const { id, ts } = JSON.parse(raw) as { id: string; ts: number };
      if (id !== tabId && Date.now() - ts < LEADER_TTL) return false;
    }
    localStorage.setItem(
      leaderKey,
      JSON.stringify({ id: tabId, ts: Date.now() }),
    );
    return true;
  } catch {
    return true;
  }
}

function releaseLeader(tabId: string, userId?: string | null) {
  try {
    const leaderKey = getLeaderKey(userId);
    const raw = localStorage.getItem(leaderKey);
    if (raw) {
      const { id } = JSON.parse(raw) as { id: string };
      if (id === tabId) localStorage.removeItem(leaderKey);
    }
  } catch {}
}

function readSession(userId?: string | null) {
  if (typeof window === "undefined") return { exp: 0, max: DEFAULT_WATCH_MAX };

  const keys = getSessionKeys(userId);
  const expRaw =
    sessionStorage.getItem(keys.exp) ?? localStorage.getItem(keys.exp) ?? "0";
  const maxRaw =
    sessionStorage.getItem(keys.max) ??
    localStorage.getItem(keys.max) ??
    String(DEFAULT_WATCH_MAX);

  const exp = parseInt(expRaw, 10) || 0;
  const max = parseInt(maxRaw, 10) || DEFAULT_WATCH_MAX;
  return { exp, max };
}

function clearSession(userId?: string | null) {
  if (typeof window === "undefined") return;
  const keys = getSessionKeys(userId);
  sessionStorage.removeItem(keys.exp);
  sessionStorage.removeItem(keys.max);
  localStorage.removeItem(keys.exp);
  localStorage.removeItem(keys.max);
}

function saveSession(exp: number, max: number, userId?: string | null) {
  if (typeof window === "undefined") return;
  const keys = getSessionKeys(userId);
  const expValue = String(exp);
  const maxValue = String(max);
  sessionStorage.setItem(keys.exp, expValue);
  sessionStorage.setItem(keys.max, maxValue);
  localStorage.setItem(keys.exp, expValue);
  localStorage.setItem(keys.max, maxValue);
}

export interface GiftConfig {
  rank: number;
  rankName: string;
  nextRankName: string | null;
  watchMax: number;
  coinsReward: number;
  coinsToday: number;
  coinsTotal: number;
  isFirstClaim?: boolean;
}

export interface UseGiftBoxReturn {
  watchExp: number;
  watchMax: number;
  progress: number;
  rank: number;
  rankName: string;
  nextRankName: string | null;
  coinsReward: number;
  coinsToday: number;
  coinsTotal: number;
  state: GiftBoxState;
  reward: number;
  open: () => Promise<void>;
  dismissReward: () => void;
}

export function useGiftBox({ active }: { active: boolean }): UseGiftBoxReturn {
  const tabId = useRef<string>(useId());

  const { user, giftLevel, setGiftLevel, setCoins } = useAuthStore();

  const isLoggedIn = !!user;

  const [config, setConfig] = useState<GiftConfig | null>(null);
  const watchMax =
    config?.watchMax && !isNaN(config.watchMax) && config.watchMax > 0
      ? config.watchMax
      : DEFAULT_WATCH_MAX;

  // Restore from sessionStorage using the SAVED max (not hardcoded)
  const [watchExp, setWatchExp] = useState<number>(() => {
    const { exp, max } = readSession();
    return Math.min(exp, max);
  });

  const [state, setState] = useState<GiftBoxState>(() => {
    const { exp, max } = readSession();
    // Only restore as "ready" if exp actually equals the saved max
    return exp >= max && exp > 0 ? "ready" : "idle";
  });

  const [reward, setReward] = useState(0);
  const [rankName, setRankName] = useState("");
  const [nextRankName, setNextRankName] = useState<string | null>(null);
  const [coinsToday, setCoinsToday] = useState(0);
  const [coinsTotal, setCoinsTotal] = useState(0);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const claimSeqRef = useRef(0);

  // Fetch config when login state or level changes
  useEffect(() => {
    if (!isLoggedIn) return;
    fetch(API_ROUTES.gift.config)
      .then((r) => {
        if (!r.ok) throw new Error("config failed");
        return r.json();
      })
      .then((data: GiftConfig) => {
        // Guard watchMax against undefined/NaN from API
        const safeMax =
          data.watchMax && !isNaN(data.watchMax) && data.watchMax > 0
            ? data.watchMax
            : DEFAULT_WATCH_MAX;
        setConfig({ ...data, watchMax: safeMax });
        setRankName(data.rankName ?? "");
        setNextRankName(data.nextRankName ?? null);
        setCoinsToday(data.coinsToday ?? 0);
        setCoinsTotal(data.coinsTotal ?? 0);
        // First-time users get the box immediately ready — no watching required
        if (data.isFirstClaim) {
          setState("ready");
          setWatchExp(safeMax);
          saveSession(safeMax, safeMax, user?.id);
        } else {
          setWatchExp((prev) => {
            const safePrev = isNaN(prev) ? 0 : prev;
            const clamped = Math.min(safePrev, safeMax);
            if (clamped >= safeMax) setState("ready");
            saveSession(clamped, safeMax, user?.id);
            return clamped;
          });
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, giftLevel, user?.id]);

  // Restore user-scoped session whenever current user changes
  useEffect(() => {
    if (!user?.id) {
      // User logged out — reset to zero, do NOT read guest session
      // (saveSession effect may have written stale data to guest key)
      const raf = window.requestAnimationFrame(() => {
        setWatchExp(0);
        setState("idle");
        setReward(0);
      });
      return () => window.cancelAnimationFrame(raf);
    }

    const { exp, max } = readSession(user.id);
    const restored = Math.min(exp, max);

    const raf = window.requestAnimationFrame(() => {
      setWatchExp(restored);
      setState(restored >= max && restored > 0 ? "ready" : "idle");
    });

    return () => window.cancelAnimationFrame(raf);
  }, [user?.id]);

  // Persist exp + current max whenever watchExp changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      saveSession(watchExp, watchMax, user?.id);
    }
  }, [watchExp, watchMax, user?.id]);

  // Release leader lock on unmount or tab hide/close
  useEffect(() => {
    const id = tabId.current;
    const onHide = () => {
      if (document.visibilityState === "hidden") releaseLeader(id, user?.id);
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      releaseLeader(id, user?.id);
    };
  }, [user?.id]);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  // Tick +1 per second while watching, logged in, and bar not full.
  useEffect(() => {
    if (!isLoggedIn || !active || state !== "idle") return;

    const timer = setInterval(() => {
      // Tab phải visible mới được tích — chặn multi-tab exploit
      if (document.hidden) return;
      if (!tryClaimLeader(tabId.current, user?.id)) return; // double-check: another tab is ticking
      setWatchExp((prev) => {
        const next = prev + 1;
        if (next >= watchMax) {
          setState("ready");
          return watchMax;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoggedIn, active, state, watchMax, user?.id]);

  const open = useCallback(async () => {
    if (state !== "ready") return;
    const claimSeq = ++claimSeqRef.current;
    setState("opening");

    // Clear session IMMEDIATELY — prevents double-claim on refresh/tab switch
    clearSession(user?.id);
    // Reset watchExp to 0 immediately so the config re-fetch triggered by
    // setGiftLevel below sees prev=0 and does NOT call setState("ready"),
    // which would collapse the open-animation modal before it finishes.
    setWatchExp(0);

    try {
      const res = await fetch(API_ROUTES.gift.open, { method: "POST" });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as {
        coinsEarned: number;
        newLevel: number;
        newCoins: number;
        rankName?: string;
        rank?: number;
      };

      if (claimSeqRef.current !== claimSeq) return;

      setReward(data.coinsEarned);
      setGiftLevel(data.newLevel);
      setCoins(data.newCoins);
      if (data.rankName) setRankName(data.rankName);
      setState("collected");

      // Reset visual state after animation (session already cleared above)
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
      dismissTimerRef.current = setTimeout(() => {
        if (claimSeqRef.current !== claimSeq) return;
        setWatchExp(0);
        setReward(0);
        setState("idle");
        dismissTimerRef.current = null;
      }, 3500);
    } catch {
      if (claimSeqRef.current !== claimSeq) return;
      // Restore session on API failure so user can retry
      saveSession(watchMax, watchMax, user?.id);
      setState("ready");
    }
  }, [state, watchMax, setGiftLevel, setCoins, user?.id]);

  const dismissReward = useCallback(() => {
    claimSeqRef.current += 1;
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    setWatchExp(0);
    setReward(0);
    setState("idle");
  }, []);

  return {
    watchExp: isNaN(watchExp) ? 0 : watchExp,
    watchMax,
    progress: watchMax > 0 && !isNaN(watchExp) ? watchExp / watchMax : 0,
    rank: config?.rank ?? 1,
    rankName,
    nextRankName,
    coinsReward: config?.coinsReward ?? 0,
    coinsToday,
    coinsTotal,
    state,
    reward,
    open,
    dismissReward,
  };
}
