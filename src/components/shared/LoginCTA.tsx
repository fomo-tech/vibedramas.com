"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Crown,
  Sparkles,
  ShieldCheck,
  Play,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoginCTAProps {
  /** Icon shown in the hero circle. Defaults to Crown. */
  icon?: LucideIcon;
  /** Bold headline text */
  title?: string;
  /** Sub-line beneath the headline */
  description?: string;
  /** Text on the CTA button */
  buttonLabel?: string;
}

// ─── Perk chip ────────────────────────────────────────────────────────────────

const PERKS: { icon: LucideIcon; label: string }[] = [
  { icon: Play, label: "8.000+ phim" },
  { icon: Crown, label: "Ưu đãi VIP" },
  { icon: ShieldCheck, label: "Lưu tiến trình" },
  { icon: Sparkles, label: "Đề xuất riêng" },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LoginCTA({
  icon: Icon = Crown,
  title = "Đăng nhập để tiếp tục",
  description = "Tận hưởng trải nghiệm xem phim cá nhân hoá của riêng bạn.",
  buttonLabel = "Đăng nhập ngay",
}: LoginCTAProps) {
  const { openLoginModal } = useAuthStore();

  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {/* ── Glow blob ── */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-vibe-pink/8 blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col items-center gap-6 max-w-xs"
      >
        {/* ── Hero icon ── */}
        <div className="relative">
          {/* Outer pulse ring */}
          <motion.div
            animate={{ scale: [1, 1.18, 1], opacity: [0.25, 0, 0.25] }}
            transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-vibe-pink/30"
          />
          {/* Inner circle */}
          <div className="relative w-20 h-20 rounded-full bg-linear-to-br from-vibe-pink/20 to-orange-500/10 border border-vibe-pink/30 flex items-center justify-center shadow-[0_0_40px_rgba(255,69,0,0.2)]">
            <Icon size={32} className="text-vibe-pink" strokeWidth={1.8} />
          </div>
        </div>

        {/* ── Text ── */}
        <div className="space-y-2">
          <h2 className="text-white font-black text-2xl tracking-tight leading-tight">
            {title}
          </h2>
          <p className="text-white/35 text-sm leading-relaxed">{description}</p>
        </div>

        {/* ── Perk chips ── */}
        <div className="grid grid-cols-2 gap-2 w-full">
          {PERKS.map(({ icon: PerkIcon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 bg-white/4 border border-white/6 rounded-xl px-3 py-2"
            >
              <div className="w-6 h-6 rounded-lg bg-vibe-pink/15 border border-vibe-pink/20 flex items-center justify-center shrink-0">
                <PerkIcon size={11} className="text-vibe-pink/80" />
              </div>
              <span className="text-white/50 text-[11px] font-semibold leading-tight">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* ── CTA button ── */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          onClick={openLoginModal}
          className="relative w-full overflow-hidden flex items-center justify-center gap-2 bg-vibe-pink text-white font-black text-sm px-6 py-3.5 rounded-2xl transition-colors hover:bg-orange-500 shadow-[0_4px_32px_rgba(255,69,0,0.4)] group"
        >
          {/* Shine sweep */}
          <motion.div
            className="absolute inset-0 bg-linear-to-r from-transparent via-white/15 to-transparent -translate-x-full"
            animate={{ translateX: ["-100%", "200%"] }}
            transition={{
              repeat: Infinity,
              duration: 2.2,
              ease: "linear",
              repeatDelay: 1,
            }}
          />
          <span className="relative">{buttonLabel}</span>
          <ChevronRight
            size={15}
            className="relative group-hover:translate-x-0.5 transition-transform"
          />
        </motion.button>

        {/* ── Fine print ── */}
        <p className="text-white/15 text-[10px]">
          Miễn phí · Không cần thẻ tín dụng
        </p>
      </motion.div>
    </div>
  );
}
