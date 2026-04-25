"use client";

import { useState, useEffect } from "react";
import { apiFetch, API_ROUTES } from "@/lib/api";

export interface VipPackage {
  _id: string;
  name: string;
  days: number;
  price: number;
  coinsPerMinute: number;
  giftRank: number;
  badge?: string;
  badgeVariant?: "popular" | "best";
  isActive: boolean;
  order: number;
  updatedAt?: string;
}

// User-facing screens should not show the first onboarding free package.
export function getVisibleVipPackages(packages: VipPackage[]): VipPackage[] {
  return packages.filter(
    (pkg, i) => !(i === 0 && Number(pkg.price ?? 0) === 0),
  );
}

export function useVipPackages() {
  const [packages, setPackages] = useState<VipPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<VipPackage[]>(API_ROUTES.vip.packages)
      .then(({ data, error }) => {
        if (error) setError("Không thể tải danh sách gói");
        else setPackages(data ?? []);
      })
      .catch(() => setError("Không thể tải danh sách gói"))
      .finally(() => setLoading(false));
  }, []);

  return { packages, loading, error };
}
