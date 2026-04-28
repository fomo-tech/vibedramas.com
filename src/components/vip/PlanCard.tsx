"use client";

import { motion } from "framer-motion";
import { Check, Trophy, CheckCircle2 } from "lucide-react";
import { Zap, Star, Sparkles, Crown, Flame } from "lucide-react";
import CoinIcon from "@/components/ui/CoinIcon";
import type { VipPackage } from "@/hooks/useVipPackages";

// Keep Plan as alias of VipPackage for backward compat
export type Plan = VipPackage;

const RANK_TIER_INFO: Record<
  number,
  {
    name: string;
    coins: number;
    secs: number;
    Icon: React.ElementType;
    color: string;
  }
> = {
  1: { name: "Khán Giả", coins: 10, secs: 60, Icon: Flame, color: "#FF4500" },
  2: { name: "Fan Cứng", coins: 20, secs: 55, Icon: Zap, color: "#FF8C00" },
  3: { name: "Sao Nổi", coins: 35, secs: 50, Icon: Star, color: "#FFD700" },
  4: {
    name: "Minh Tinh",
    coins: 55,
    secs: 45,
    Icon: Sparkles,
    color: "#9B59B6",
  },
  5: {
    name: "Huyền Thoại",
    coins: 80,
    secs: 40,
    Icon: Crown,
    color: "#00D4FF",
  },
};

interface PlanCardProps {
  plan: VipPackage;
  isSelected: boolean;
  onSelect: (id: string) => void;
  index: number;
  userCoins?: number;
  isOwned?: boolean;
}

export default function PlanCard({
  plan,
  isSelected,
  onSelect,
  index,
  userCoins,
  isOwned = false,
}: PlanCardProps) {
  const isBest = plan.badgeVariant === "best";
  const canAfford = userCoins == null || userCoins >= plan.price;
  const giftRank = Math.max(1, Math.min(5, plan.giftRank ?? 1));
  const tierInfo = RANK_TIER_INFO[giftRank] ?? RANK_TIER_INFO[1];
  const { Icon: TierIcon, color: tierColor } = tierInfo;

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.07,
        type: "spring",
        damping: 22,
        stiffness: 280,
      }}
      whileTap={{ scale: 0.975 }}
      onClick={() => onSelect(plan._id)}
      className={`relative w-full rounded-2xl p-4 text-left cursor-pointer overflow-hidden transition-all duration-200
        ${
          isSelected
            ? "bg-white/[0.07] shadow-[0_0_0_2px_rgba(255,69,0,1),0_0_30px_rgba(255,69,0,0.18)]"
            : "bg-zinc-900/70 border border-white/[0.07] hover:border-white/15"
        }`}
    >
      {isSelected && (
        <div className="absolute inset-0 bg-linear-to-r from-vibe-pink/10 via-orange-500/5 to-transparent pointer-events-none rounded-2xl" />
      )}

      {isOwned && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-green-500/20 border border-green-500/30 text-green-400">
          <CheckCircle2 size={8} className="shrink-0" />
          Đang dùng
        </div>
      )}
      {!isOwned && plan.badge && (
        <div
          className={`absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest
            ${
              isBest
                ? "bg-vibe-pink text-white shadow-[0_0_12px_rgba(255,69,0,0.5)]"
                : "bg-white/10 text-white/70 border border-white/10"
            }`}
        >
          {isBest ? (
            <Trophy size={8} className="shrink-0" />
          ) : (
            <Zap size={8} className="shrink-0" />
          )}
          {plan.badge}
        </div>
      )}

      <div className="flex items-center gap-3.5">
        <div
          className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200
            ${
              isSelected
                ? "border-vibe-pink bg-vibe-pink shadow-[0_0_8px_rgba(255,69,0,0.6)]"
                : "border-white/20 bg-transparent"
            }`}
        >
          {isSelected && (
            <Check size={11} strokeWidth={3.5} className="text-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className={`font-black text-base leading-tight tracking-tight ${isSelected ? "text-white" : "text-white/65"}`}
          >
            {plan.name}
          </p>
          <p
            className={`mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] ${isSelected ? "text-white/70" : "text-white/25"}`}
          >
            <span className="inline-flex items-center gap-1">
              <TierIcon
                size={10}
                style={{ color: isSelected ? tierColor : undefined }}
              />
              <span
                style={{ color: isSelected ? tierColor : undefined }}
                className="font-bold"
              >
                {tierInfo.name}
              </span>
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-0.5">
              <CoinIcon size={10} />+{tierInfo.coins} xu/hộp
            </span>
            <span>·</span>
            <span>Xem {tierInfo.secs}s</span>
            <span>·</span>
            <span>{plan.days} ngày</span>
          </p>
        </div>

        <div className="shrink-0 flex items-baseline gap-1">
          <CoinIcon size={14} />
          <span
            className={`font-black text-base tabular-nums ${
              isSelected
                ? "text-vibe-pink"
                : canAfford
                  ? "text-white"
                  : "text-red-400/80"
            }`}
          >
            {Number(plan.price ?? 0).toLocaleString("vi-VN")}
          </span>
          <span className="text-white/30 text-[10px] font-bold">xu</span>
        </div>
      </div>
    </motion.button>
  );
}
