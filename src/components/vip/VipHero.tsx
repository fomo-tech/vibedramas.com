"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Crown,
  Gift,
  Timer,
  WalletCards,
  Zap,
} from "lucide-react";
import type { VipPackage } from "@/hooks/useVipPackages";

const STATS = [
  { icon: WalletCards, label: "Kiếm tiền" },
  { icon: Gift, label: "Hộp quà" },
  { icon: Zap, label: "Thời hạn" },
] as const;

function formatExpiry(iso: string | null) {
  if (!iso) return null;
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (diff <= 0) return "Đã hết hạn";
  if (diff === 1) return "Còn 1 ngày";
  if (diff < 30) return `Còn ${diff} ngày`;
  return `Còn ${Math.floor(diff / 30)} tháng`;
}

interface VipHeroProps {
  isActiveVip?: boolean;
  vipExpiry?: string | null;
  selectedPlan?: VipPackage | null;
}

export default function VipHero({
  isActiveVip,
  vipExpiry,
  selectedPlan,
}: VipHeroProps) {
  const [now, setNow] = useState(() => Date.now());
  const expiryLabel = formatExpiry(vipExpiry ?? null);

  useEffect(() => {
    if (!isActiveVip || !vipExpiry) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [isActiveVip, vipExpiry]);

  const countdownLabel = (() => {
    if (!vipExpiry) return null;
    const remainingMs = new Date(vipExpiry).getTime() - now;
    if (remainingMs <= 0) return "Đã hết hạn";

    const totalSeconds = Math.floor(remainingMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600)
      .toString()
      .padStart(2, "0");
    const minutes = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");

    return days > 0
      ? `${days} ngày ${hours}:${minutes}:${seconds}`
      : `${hours}:${minutes}:${seconds}`;
  })();

  return (
    <div className="relative flex flex-col items-center pt-12 pb-8 px-6 text-center overflow-hidden">
      {/* Layered cinematic glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-vibe-pink/20 rounded-full blur-[90px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-orange-400/15 rounded-full blur-[50px]" />
      </div>

      {/* Crown badge */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 12, stiffness: 200 }}
        className="relative mb-6"
      >
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
          className="absolute inset-0 rounded-full bg-vibe-pink/40"
        />
        <motion.div
          animate={{ scale: [1, 1.28, 1], opacity: [0.2, 0, 0.2] }}
          transition={{
            repeat: Infinity,
            duration: 2,
            delay: 0.4,
            ease: "easeOut",
          }}
          className="absolute inset-0 rounded-full bg-vibe-pink/20"
        />
        <div className="relative z-10 w-20 h-20 rounded-full bg-linear-to-br from-vibe-pink via-orange-500 to-rose-600 flex items-center justify-center shadow-[0_0_50px_rgba(255,69,0,0.6),0_0_100px_rgba(255,69,0,0.2)] border border-white/20">
          <Crown
            size={34}
            className="text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
          />
        </div>
      </motion.div>

      {/* Brand title */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-3"
      >
        <h1 className="text-5xl font-black italic tracking-tighter leading-none text-white drop-shadow-[0_2px_20px_rgba(255,69,0,0.4)]">
          BẬC <span className="text-vibe-pink">HỘP QUÀ</span>
        </h1>
        {isActiveVip ? (
          <div className="flex flex-col items-center gap-1.5 mt-2">
            <div className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/25 text-green-400 text-[11px] font-black px-3 py-1 rounded-full">
              <CheckCircle2 size={11} />
              Gói bậc · Đang hoạt động
            </div>
            {countdownLabel && (
              <p className="text-white/35 text-[10px] flex items-center gap-1">
                <Timer size={9} className="text-vibe-pink/60" />
                Hết hạn sau {countdownLabel}
              </p>
            )}
            {expiryLabel && (
              <p className="text-white/25 text-[10px] flex items-center gap-1">
                <Timer size={9} className="text-vibe-pink/50" />
                {expiryLabel}
              </p>
            )}
          </div>
        ) : (
          <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em] mt-2">
            Ai cũng kiếm xu khi xem phim — không cần mua gói. Gói bậc giúp bạn
            kiếm nhiều hơn và mở thưởng hộp quà lớn hơn.
          </p>
        )}
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center gap-1 mt-3"
      >
        {STATS.map((s, i) => (
          <div key={s.label} className="flex items-center">
            <div className="flex flex-col items-center px-4 py-2">
              <span className="text-white font-black text-lg leading-none">
                {s.label === "Kiếm tiền"
                  ? (selectedPlan?.coinsPerMinute ?? 1) > 1
                    ? `+${selectedPlan?.coinsPerMinute ?? 1} xu/phút`
                    : "Đã bật"
                  : s.label === "Hộp quà"
                    ? `Bậc ${selectedPlan?.giftRank ?? 1}`
                    : `${selectedPlan?.days ?? 0} ngày`}
              </span>
              <span className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mt-0.5">
                {s.label}
              </span>
            </div>
            {i < STATS.length - 1 && <div className="w-px h-6 bg-white/10" />}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
