"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import PlanCard from "@/components/vip/PlanCard";
import {
  useVipPackages,
  type VipPackage,
  getVisibleVipPackages,
} from "@/hooks/useVipPackages";

interface PlanSelectorProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  userCoins?: number;
  ownedPlanName?: string;
}

export default function PlanSelector({
  selectedId,
  onSelect,
  userCoins,
  ownedPlanName,
}: PlanSelectorProps) {
  const { packages, loading } = useVipPackages();

  if (loading) {
    return (
      <div className="px-4 flex items-center justify-center py-8">
        <Loader2 size={20} className="text-vibe-pink animate-spin" />
      </div>
    );
  }

  const visiblePackages = getVisibleVipPackages(packages);

  return (
    <div className="px-4 space-y-3">
      {visiblePackages.map((plan, i) => (
        <PlanCard
          key={plan._id}
          plan={plan}
          isSelected={selectedId === plan._id}
          onSelect={onSelect}
          index={i}
          userCoins={userCoins}
          isOwned={!!ownedPlanName && plan.name === ownedPlanName}
        />
      ))}
    </div>
  );
}

export function usePlanSelection(packages: VipPackage[]) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedPlan = packages.find((p) => p._id === selectedId) ?? null;
  return { selectedId, setSelectedId, selectedPlan };
}
