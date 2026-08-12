"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { API_ROUTES } from "@/lib/api";

export type GiftBoxState = "idle" | "ready" | "opening" | "collected";

const DEFAULT_WATCH_MAX = 60;
const GIFT_CLIENT_ID_KEY = "vd_gift_client_id_v1";
const GIFT_PROGRESS_KEY_PREFIX = "vd_gift_progress_v1";

// Do not use crypto.randomUUID here: it is missing in older iOS
// Safari/WebViews. This generator works in every browser we support.
function createGiftClientId() {
  if (typeof window !== "undefined") {
    try {
      const saved = window.localStorage.getItem(GIFT_CLIENT_ID_KEY);
      if (saved?.startsWith("gift-") && saved.length <= 100) return saved;
    } catch {}
  }

  const webCrypto = globalThis.crypto;
  let id: string;
  if (typeof webCrypto?.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    webCrypto.getRandomValues(bytes);
    id = `gift-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  } else {
    id = `gift-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(GIFT_CLIENT_ID_KEY, id);
    } catch {}
  }
  return id;
}

function progressStorageKey(userId: string) {
  return `${GIFT_PROGRESS_KEY_PREFIX}:${userId}`;
}

interface WatchProgressResponse {
  watchExp: number;
  watchMax: number;
  ready: boolean;
  error?: string;
}

export interface GiftConfig {
  rank: number;
  rankName: string;
  nextRankName: string | null;
  watchMax: number;
  coinsReward: number;
  expReward: number;
  giftExp: number;
  currentRankExp: number;
  nextRankExp: number | null;
  coinsToday: number;
  coinsTotal: number;
  watchExp?: number;
  ready?: boolean;
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
  expReward: number;
  giftExp: number;
  currentRankExp: number;
  nextRankExp: number | null;
  coinsToday: number;
  coinsTotal: number;
  state: GiftBoxState;
  reward: number;
  rewardExp: number;
  productUrl: string | null;
  claimId: string | null;
  shopeeCoinsReward: number;
  shopeeOpening: boolean;
  leveledUp: boolean;
  errorMessage: string | null;
  open: () => Promise<void>;
  openShopee: () => Promise<void>;
  dismissReward: () => void;
}

export function useGiftBox(): UseGiftBoxReturn {
  const [clientId] = useState(createGiftClientId);

  const { user, giftLevel, setGiftLevel, setCoins } = useAuthStore();
  const userId = user?.id;

  const isLoggedIn = !!user;

  const [config, setConfig] = useState<GiftConfig | null>(null);
  const watchMax =
    config?.watchMax && !isNaN(config.watchMax) && config.watchMax > 0
      ? config.watchMax
      : DEFAULT_WATCH_MAX;

  const [watchExp, setWatchExp] = useState(0);
  const [state, setState] = useState<GiftBoxState>("idle");

  const [reward, setReward] = useState(0);
  const [rewardExp, setRewardExp] = useState(0);
  const [productUrl, setProductUrl] = useState<string | null>(null);
  const [claimId, setClaimId] = useState<string | null>(null);
  const [shopeeCoinsReward, setShopeeCoinsReward] = useState(0);
  const [shopeeOpening, setShopeeOpening] = useState(false);
  const [leveledUp, setLeveledUp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rankName, setRankName] = useState("");
  const [nextRankName, setNextRankName] = useState<string | null>(null);
  const [coinsToday, setCoinsToday] = useState(0);
  const [coinsTotal, setCoinsTotal] = useState(0);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const claimSeqRef = useRef(0);

  // Fetch config when login state or level changes
  useEffect(() => {
    if (!isLoggedIn) return;

    // Restore the last server-confirmed value immediately for a stable reload
    // UI. The config response below remains authoritative and overwrites it.
    if (userId) {
      try {
        const cached = JSON.parse(
          window.localStorage.getItem(progressStorageKey(userId)) || "null",
        ) as { watchExp?: number; watchMax?: number } | null;
        if (cached) {
          const cachedMax = Math.max(1, Number(cached.watchMax) || DEFAULT_WATCH_MAX);
          const cachedExp = Math.min(
            cachedMax,
            Math.max(0, Number(cached.watchExp) || 0),
          );
          window.requestAnimationFrame(() => {
            setWatchExp(cachedExp);
            setState(cachedExp >= cachedMax ? "ready" : "idle");
          });
        }
      } catch {}
    }

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
        const serverWatchExp = Math.min(
          safeMax,
          Math.max(0, Number(data.watchExp) || 0),
        );
        setWatchExp(serverWatchExp);
        if (userId) {
          try {
            window.localStorage.setItem(
              progressStorageKey(userId),
              JSON.stringify({ watchExp: serverWatchExp, watchMax: safeMax }),
            );
          } catch {}
        }
        setState((current) =>
          current === "opening" || current === "collected"
            ? current
            : data.ready || serverWatchExp >= safeMax
              ? "ready"
              : "idle",
        );
      })
      .catch(() => {});
  }, [isLoggedIn, giftLevel, userId]);

  // Reset all reward state whenever the authenticated user changes.
  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      if (!userId) {
        setWatchExp(0);
        setState("idle");
      }
      setReward(0);
      setRewardExp(0);
      setProductUrl(null);
      setClaimId(null);
      setShopeeCoinsReward(0);
      setLeveledUp(false);
      setErrorMessage(null);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [userId]);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  // HlsPlayer owns the server heartbeat because it has direct access to the
  // real media currentTime. It publishes only server-confirmed progress here.
  useEffect(() => {
    const handleProgress = (event: Event) => {
      const data = (event as CustomEvent<WatchProgressResponse>).detail;
      if (!data) return;
      const safeMax = Math.max(1, Number(data.watchMax) || watchMax);
      const safeExp = Math.min(safeMax, Math.max(0, Number(data.watchExp) || 0));
      setConfig((current) =>
        current ? { ...current, watchMax: safeMax } : current,
      );
      setWatchExp(safeExp);
      if (userId) {
        try {
          window.localStorage.setItem(
            progressStorageKey(userId),
            JSON.stringify({ watchExp: safeExp, watchMax: safeMax }),
          );
        } catch {}
      }
      // A heartbeat from the video can finish after the claim request and
      // report the newly reset watch progress. Never let that late response
      // hide the opening/result modal before the user has seen the reward.
      setState((current) =>
        current === "opening" || current === "collected"
          ? current
          : data.ready || safeExp >= safeMax
            ? "ready"
            : "idle",
      );
      setErrorMessage(null);
    };
    window.addEventListener("vibe:gift-progress", handleProgress);
    return () => window.removeEventListener("vibe:gift-progress", handleProgress);
  }, [userId, watchMax]);

  const open = useCallback(async () => {
    if (state !== "ready" || !clientId) return;
    const claimSeq = ++claimSeqRef.current;
    setState("opening");
    setErrorMessage(null);

    setWatchExp(0);

    try {
      const res = await fetch(API_ROUTES.gift.open, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        coinsEarned: number;
        newLevel: number;
        newCoins: number;
        expEarned: number;
        giftExp: number;
        nextRankExp: number | null;
        leveledUp: boolean;
        rankName?: string;
        rank?: number;
        productUrl?: string | null;
        claimId?: string;
        shopeeCoinsReward?: number;
      };
      if (!res.ok) throw new Error(data.error || "Không thể mở hộp quà lúc này");

      if (claimSeqRef.current !== claimSeq) return;

      setReward(data.coinsEarned);
      setRewardExp(data.expEarned ?? 0);
      setProductUrl(data.productUrl ?? null);
      setClaimId(data.claimId ?? null);
      setShopeeCoinsReward(Math.max(0, Number(data.shopeeCoinsReward) || 0));
      setLeveledUp(Boolean(data.leveledUp));
      setConfig((current) =>
        current
          ? {
              ...current,
              rank: data.newLevel,
              rankName: data.rankName ?? current.rankName,
              giftExp: data.giftExp ?? current.giftExp,
              nextRankExp: data.nextRankExp,
            }
          : current,
      );
      setGiftLevel(data.newLevel);
      setCoins(data.newCoins);
      if (data.rankName) setRankName(data.rankName);
      setState("collected");
      if (userId) {
        try {
          window.localStorage.setItem(
            progressStorageKey(userId),
            JSON.stringify({ watchExp: 0, watchMax }),
          );
        } catch {}
      }

      // Reset visual state after animation (session already cleared above)
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
      if (!data.productUrl) {
        dismissTimerRef.current = setTimeout(() => {
          if (claimSeqRef.current !== claimSeq) return;
          setWatchExp(0);
          setReward(0);
          setRewardExp(0);
          setProductUrl(null);
          setClaimId(null);
          setShopeeCoinsReward(0);
          setLeveledUp(false);
          setState("idle");
          dismissTimerRef.current = null;
        }, 3500);
      }
    } catch (error) {
      if (claimSeqRef.current !== claimSeq) return;
      // Do not pretend a rejected claim succeeded. The server keeps the
      // authoritative progress, and the user can see the real reason.
      const message =
        error instanceof Error ? error.message : "Không thể mở hộp quà lúc này";
      setErrorMessage(message);
      setState("ready");
    }
  }, [clientId, state, setGiftLevel, setCoins, userId, watchMax]);

  const openShopee = useCallback(async () => {
    if (!claimId || !productUrl || shopeeOpening) return;
    setShopeeOpening(true);
    setErrorMessage(null);

    // Open synchronously from the user's click so iOS popup protection does
    // not block the Shopee tab while the reward API is pending.
    const shopeeWindow = window.open("about:blank", "_blank");
    try {
      const response = await fetch(API_ROUTES.gift.shopeeClick, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        newCoins?: number | null;
        productUrl?: string | null;
      };
      if (!response.ok) throw new Error(data.error || "Không thể nhận xu Shopee");
      if (typeof data.newCoins === "number") setCoins(data.newCoins);
      const destination = data.productUrl || productUrl;

      // The Shopee click completes the current reward flow. Close the result
      // modal and explicitly create a fresh watch cycle instead of leaving the
      // old heartbeat sequence alive after the server reset it during claim.
      claimSeqRef.current += 1;
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
      setWatchExp(0);
      setReward(0);
      setRewardExp(0);
      setProductUrl(null);
      setClaimId(null);
      setShopeeCoinsReward(0);
      setLeveledUp(false);
      setState("idle");
      if (userId) {
        try {
          window.localStorage.setItem(
            progressStorageKey(userId),
            JSON.stringify({ watchExp: 0, watchMax }),
          );
        } catch {}
      }
      window.dispatchEvent(new CustomEvent("vibe:gift-cycle-reset"));

      if (shopeeWindow) shopeeWindow.location.href = destination;
      else window.location.href = destination;
    } catch (error) {
      shopeeWindow?.close();
      setErrorMessage(
        error instanceof Error ? error.message : "Không thể nhận xu Shopee",
      );
    } finally {
      setShopeeOpening(false);
    }
  }, [claimId, productUrl, setCoins, shopeeOpening, userId, watchMax]);

  const dismissReward = useCallback(() => {
    claimSeqRef.current += 1;
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    setWatchExp(0);
    setReward(0);
    setRewardExp(0);
    setProductUrl(null);
    setClaimId(null);
    setShopeeCoinsReward(0);
    setLeveledUp(false);
    setErrorMessage(null);
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
    expReward: config?.expReward ?? 0,
    giftExp: config?.giftExp ?? 0,
    currentRankExp: config?.currentRankExp ?? 0,
    nextRankExp: config?.nextRankExp ?? null,
    coinsToday,
    coinsTotal,
    state,
    reward,
    rewardExp,
    productUrl,
    claimId,
    shopeeCoinsReward,
    shopeeOpening,
    leveledUp,
    errorMessage,
    open,
    openShopee,
    dismissReward,
  };
}
