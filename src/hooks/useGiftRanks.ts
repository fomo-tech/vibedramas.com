"use client";

import { useEffect, useState } from "react";
import { apiFetch, API_ROUTES } from "@/lib/api";

export interface GiftRankTier {
  rank: number;
  name: string;
  coinsReward: number;
  shopeeCoinsReward: number;
  expReward: number;
  requiredExp: number;
  watchSeconds: number;
}

export function useGiftRanks() {
  const [ranks, setRanks] = useState<GiftRankTier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<GiftRankTier[]>(API_ROUTES.gift.ranks)
      .then(({ data }) => setRanks(data ?? []))
      .catch(() => setRanks([]))
      .finally(() => setLoading(false));
  }, []);

  return { ranks, loading };
}
