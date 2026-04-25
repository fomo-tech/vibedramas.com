"use client";

import { useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Flame } from "lucide-react";
import GiftBoxIcon from "./GiftBoxIcon";
import { RANK_COLORS, RANK_BADGES } from "./giftConstants";
import type { GiftBoxState } from "@/hooks/useGiftBox";

interface GiftBoxButtonProps {
  progress: number;
  rank?: number;
  state: GiftBoxState;
  locked?: boolean;
  onClick: () => void;
}

const SIZE = 68;
const RING_R = 30;
const CIRCUMFERENCE = 2 * Math.PI * RING_R;

export default function GiftBoxButton({
  progress,
  rank = 1,
  state,
  locked = false,
  onClick,
}: GiftBoxButtonProps) {
  const id = useId().replace(/:/g, "");
  const [PRIMARY, SECONDARY] = RANK_COLORS[rank] ?? RANK_COLORS[1];
  const RankBadge = RANK_BADGES[rank] ?? Flame;
  const isReady = !locked && state === "ready";
  const isOpening = !locked && state === "opening";
  const shouldHighlight = locked || isReady;
  const statusLabel = locked
    ? "VIP · Kiếm Xu Mỗi Ngày"
    : isReady
      ? "Nhận Quà"
      : "Đang tích lũy...";

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        className="relative select-none"
        style={{ width: SIZE, height: SIZE }}
        animate={shouldHighlight ? { y: [0, -4, 0] } : { y: [0, -2, 0] }}
        transition={{
          repeat: Infinity,
          duration: shouldHighlight ? 1.05 : 3.6,
          ease: "easeInOut",
        }}
      >
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 55%, ${PRIMARY}28, transparent 66%)`,
          }}
          animate={{
            opacity: shouldHighlight ? [0.45, 0.9, 0.45] : [0.2, 0.4, 0.2],
          }}
          transition={{ repeat: Infinity, duration: 1.6 }}
        />

        <AnimatePresence>
          {shouldHighlight && (
            <motion.div
              key="glow"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ boxShadow: `0 0 30px 10px ${PRIMARY}45` }}
            />
          )}
        </AnimatePresence>

        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="absolute inset-0"
          style={{ transform: "rotate(-90deg)" }}
        >
          <defs>
            <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={PRIMARY} />
              <stop offset="100%" stopColor={SECONDARY} />
            </linearGradient>
          </defs>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RING_R}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={3}
          />
          <motion.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RING_R}
            fill="none"
            stroke={`url(#${id}-g)`}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            animate={{
              strokeDashoffset: CIRCUMFERENCE * (1 - (isReady ? 1 : progress)),
            }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          />
        </svg>

        <motion.button
          onClick={onClick}
          disabled={isOpening}
          className="absolute rounded-full flex items-center justify-center overflow-hidden"
          style={{
            inset: 5,
            background: shouldHighlight
              ? isReady
                ? `radial-gradient(circle at 38% 30%, ${PRIMARY}35, rgba(8,8,8,0.9))`
                : `radial-gradient(circle at 38% 30%, ${PRIMARY}30, rgba(8,8,8,0.9))`
              : "rgba(10,10,10,0.82)",
            border: `1.5px solid ${shouldHighlight ? `${PRIMARY}66` : "rgba(255,255,255,0.1)"}`,
            backdropFilter: "blur(12px)",
            cursor: isOpening ? "default" : "pointer",
            boxShadow: shouldHighlight
              ? `0 10px 30px -12px ${PRIMARY}88, inset 0 1px 0 rgba(255,255,255,0.22)`
              : "0 8px 20px -12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
          whileTap={{ scale: 0.88 }}
        >
          {shouldHighlight && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(135deg, transparent 30%, ${PRIMARY}18 50%, transparent 70%)`,
              }}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            />
          )}

          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-9 rounded-b-full bg-white/10 blur-[1px]" />

          <GiftBoxIcon
            size={38}
            openProgress={isOpening ? 1 : 0}
            locked={false}
            rank={rank}
          />
        </motion.button>

        <motion.div
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center z-20 border border-white/30"
          style={{
            background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`,
            color: "#fff",
            boxShadow: `0 0 10px ${PRIMARY}80`,
          }}
          animate={{ scale: shouldHighlight ? [1, 1.12, 1] : 1 }}
          transition={{ repeat: Infinity, duration: 1.8 }}
        >
          {locked ? (
            <Crown size={10} className="text-white" />
          ) : (
            <RankBadge size={10} className="text-white" />
          )}
        </motion.div>
      </motion.div>

      {/* <AnimatePresence mode="wait">
        <motion.span
          key={locked ? "locked" : isReady ? "ready" : "idle"}
          initial={{ opacity: 0, y: 4, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.96 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="text-[9px] font-semibold whitespace-nowrap px-2.5 py-1 rounded-full"
          style={{
            background:
              locked || isReady
                ? `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`
                : "rgba(255,255,255,0.08)",
            border:
              locked || isReady
                ? "1px solid rgba(255,255,255,0.12)"
                : "1px solid rgba(255,255,255,0.16)",
            color: locked || isReady ? "#fff" : "rgba(255,255,255,0.78)",
            boxShadow:
              locked || isReady
                ? `0 0 12px ${PRIMARY}55`
                : "0 4px 12px rgba(0,0,0,0.35)",
          }}
        >
          {statusLabel}
        </motion.span>
      </AnimatePresence> */}
    </div>
  );
}
