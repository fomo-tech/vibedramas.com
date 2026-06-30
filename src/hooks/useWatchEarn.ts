"use client";

import type { RefObject } from "react";

/**
 * Coin-per-minute VIP earning was retired. Rewards now come exclusively from
 * the watch-to-fill gift box flow, so the player keeps a stable API while the
 * old earning side effect stays disabled.
 */
export function useWatchEarn(
  _videoRef: RefObject<HTMLVideoElement | null>,
  _episodeId: string,
): { coinToast: { amount: number; id: number } | null } {
  void _videoRef;
  void _episodeId;
  return { coinToast: null };
}
