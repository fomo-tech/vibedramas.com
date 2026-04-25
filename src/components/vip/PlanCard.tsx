"use client";

import { motion } from "framer-motion";
import { Check, Zap, Trophy, CheckCircle2 } from "lucide-react";
import CoinIcon from "@/components/ui/CoinIcon";
import type { VipPackage } from "@/hooks/useVipPackages";

// Keep Plan as alias of VipPackage for backward compat
export type Plan = VipPackage;

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
            className={`mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] ${isSelected ? "text-yellow-400/80" : "text-white/25"}`}
          >
            {plan.coinsPerMinute > 1 ? (
              <span className="inline-flex items-center gap-1">
                <CoinIcon size={10} />+{plan.coinsPerMinute} xu/phút
              </span>
            ) : (
              <span>Bật kiếm tiền khi xem</span>
            )}
            <span>•</span>
            <span>Bậc hộp quà {plan.giftRank ?? 1}</span>
            <span>•</span>
            <span>{plan.days} ngày</span>
          </p>
        </div>

        <div className="text-right shrink-0">
          <div className="flex items-center gap-1 justify-end">
            <CoinIcon size={13} />
            <p
              className={`font-black text-xl leading-none tracking-tight ${isSelected ? "text-vibe-pink" : "text-white/55"}`}
            >
              {Number(plan.price ?? 0).toLocaleString("vi-VN")}
            </p>
          </div>
          <p
            className={`text-[10px] mt-0.5 ${canAfford ? "text-white/30" : "text-red-400/70"}`}
          >
            {canAfford ? "xu" : "Không đủ xu"}
          </p>
        </div>
      </div>
    </motion.button>
  );
}
