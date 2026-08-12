"use client";

import { useEffect, useId, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LockKeyhole } from "lucide-react";
import GiftBoxIcon from "./GiftBoxIcon";
import { RANK_COLORS } from "./giftConstants";
import type { GiftBoxState } from "@/hooks/useGiftBox";
import { useAppStore } from "@/store/useAppStore";

interface GiftBoxButtonProps {
  watchExp?: number;
  watchMax?: number;
  rank?: number;
  state: GiftBoxState;
  locked?: boolean;
  onClick: () => void;
}

const SIZE = 74;
const RING_R = 32;

export default function GiftBoxButton({
  watchExp = 0,
  watchMax = 60,
  rank = 1,
  state,
  locked = false,
  onClick,
}: GiftBoxButtonProps) {
  const id = useId().replace(/:/g, "");
  const isWatching = useAppStore((store) => store.isWatching);
  const [displayWatchExp, setDisplayWatchExp] = useState(() =>
    Math.max(0, Number(watchExp) || 0),
  );
  const [PRIMARY, SECONDARY] = RANK_COLORS[rank] ?? RANK_COLORS[1];
  const isReady = !locked && state === "ready";
  const isOpening = !locked && state === "opening";
  const shouldHighlight = locked || isReady;

  // The server remains authoritative and verifies playback every 5 seconds.
  // Interpolate only the visual counter between heartbeats so the countdown
  // feels continuous without weakening server-side anti-cheat checks.
  useEffect(() => {
    const syncTimer = window.setTimeout(() => {
      setDisplayWatchExp(Math.max(0, Number(watchExp) || 0));
    }, 0);
    return () => window.clearTimeout(syncTimer);
  }, [watchExp]);

  useEffect(() => {
    if (locked || isReady || !isWatching) return;
    const confirmed = Math.max(0, Number(watchExp) || 0);
    const safeMax = Math.max(1, Number(watchMax) || 60);
    const optimisticLimit = Math.min(safeMax, confirmed + 5);
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setDisplayWatchExp((current) => Math.min(optimisticLimit, current + 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isReady, isWatching, locked, watchExp, watchMax]);

  const visualProgress = Math.max(
    0,
    Math.min(1, displayWatchExp / Math.max(1, Number(watchMax) || 60)),
  );
  const remainingSeconds = Math.max(
    0,
    Math.ceil(Number(watchMax) - displayWatchExp),
  );
  const countdown = `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;
  const statusLabel = locked
    ? "Đăng nhập nhận quà"
    : isReady
      ? "MỞ HỘP NGAY"
      : `Đang tích lũy, còn ${countdown}`;
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
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={2}
            strokeDasharray="1 6"
            strokeLinecap="round"
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RING_R - 4}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={4}
          />
          <motion.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RING_R - 4}
            fill="none"
            stroke={`url(#${id}-g)`}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * (RING_R - 4)}
            animate={{
              strokeDashoffset:
                2 * Math.PI * (RING_R - 4) *
                (1 - (isReady ? 1 : visualProgress)),
            }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 4px ${PRIMARY})` }}
          />
        </svg>

        <motion.button
          onClick={onClick}
          disabled={isOpening}
          aria-label={statusLabel}
          className="absolute rounded-full flex items-center justify-center overflow-hidden"
          style={{
            inset: 9,
            background: shouldHighlight
              ? isReady
                ? `radial-gradient(circle at 50% 38%, ${PRIMARY}3D, rgba(8,8,9,0.94) 68%)`
                : `radial-gradient(circle at 50% 38%, ${PRIMARY}30, rgba(8,8,9,0.94) 68%)`
              : `radial-gradient(circle at 50% 34%, ${PRIMARY}18, rgba(7,7,8,0.96) 70%)`,
            border: `1px solid ${shouldHighlight ? `${PRIMARY}70` : "rgba(255,255,255,0.12)"}`,
            backdropFilter: "blur(12px)",
            cursor: isOpening ? "default" : "pointer",
            boxShadow: shouldHighlight
              ? `0 10px 30px -12px ${PRIMARY}88, inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -10px 20px rgba(0,0,0,0.35)`
              : `0 8px 22px -10px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -10px 18px rgba(0,0,0,0.45)`,
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

          <div className="absolute left-1/2 top-0 h-4 w-8 -translate-x-1/2 rounded-b-full bg-white/8 blur-[1px]" />
          <div
            className="absolute bottom-1.5 left-1/2 h-1 w-7 -translate-x-1/2 rounded-full blur-[2px]"
            style={{ background: `${PRIMARY}55` }}
          />

          <GiftBoxIcon
            size={43}
            openProgress={isOpening ? 1 : 0}
            locked={false}
            rank={rank}
          />
        </motion.button>

        {locked && (
          <div className="absolute -right-0.5 -top-0.5 z-20 flex h-5 w-5 items-center justify-center rounded-full border border-white/25 bg-zinc-950 text-white shadow-lg">
            <LockKeyhole size={10} />
          </div>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={locked ? "locked" : isReady ? "ready" : "idle"}
          initial={{ opacity: 0, y: 4, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.96 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="relative min-w-[108px] overflow-hidden whitespace-nowrap rounded-[12px] px-3 py-2 text-center"
          style={{
            background:
              locked || isReady
                ? `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`
                : "linear-gradient(145deg, rgba(34,12,10,0.98), rgba(9,9,10,0.98) 62%, rgba(25,9,7,0.98))",
            border:
              locked || isReady
                ? "1px solid rgba(255,255,255,0.12)"
                : `1px solid ${PRIMARY}66`,
            color: locked || isReady ? "#fff" : "rgba(255,255,255,0.78)",
            boxShadow:
              locked || isReady
                ? `0 0 12px ${PRIMARY}55`
                : `0 10px 28px rgba(0,0,0,0.58), inset 0 1px 0 rgba(255,255,255,0.09), 0 0 18px ${PRIMARY}20`,
          }}
        >
          {!locked && !isReady ? (
            <>
              <span className="absolute -left-[5px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-r border-orange-500/35 bg-black" />
              <span className="absolute -right-[5px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-l border-orange-500/35 bg-black" />
              <motion.div
                className="absolute bottom-0 left-0 h-[2px]"
                style={{
                  width: `${visualProgress * 100}%`,
                  background: `linear-gradient(90deg, ${PRIMARY}, ${SECONDARY})`,
                  boxShadow: `0 0 8px ${PRIMARY}`,
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
              <div className="relative flex items-center justify-between gap-2 border-b border-dashed border-white/10 pb-1">
                <span className="text-[7px] font-black uppercase tracking-[0.18em] text-orange-300/70">
                  Suất quà
                </span>
                <span
                  className="font-mono text-[14px] font-black tabular-nums tracking-tight"
                  style={{ color: SECONDARY }}
                >
                  {countdown}
                </span>
              </div>
              <div className="relative mt-1 flex items-center justify-center gap-1.5 text-[7px] font-bold uppercase tracking-[0.14em] text-white/50">
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-red-500"
                  animate={{ opacity: [0.35, 1, 0.35] }}
                  transition={{ duration: 1.1, repeat: Infinity }}
                />
                Đang chiếu · Tích lũy
              </div>
            </>
          ) : (
            <span className="text-[9px] font-black tracking-wide text-white">
              {statusLabel}
            </span>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
