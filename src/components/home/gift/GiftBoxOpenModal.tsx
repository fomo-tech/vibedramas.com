"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import GiftBoxIcon from "./GiftBoxIcon";
import CoinIcon from "@/components/ui/CoinIcon";
import { RANK_COLORS } from "./giftConstants";

interface GiftBoxOpenModalProps {
  visible: boolean;
  reward: number;
  rank?: number;
  canDismiss?: boolean;
  onDismiss: () => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;

function CoinParticle({
  angle,
  distance,
  delay,
  size = 20,
}: {
  angle: number;
  distance: number;
  delay: number;
  size?: number;
}) {
  const rad = (angle * Math.PI) / 180;
  const tx = Math.cos(rad) * distance;
  const ty = Math.sin(rad) * distance;
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: "50%",
        top: "50%",
        marginLeft: -size / 2,
        marginTop: -size / 2,
      }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 0.2 }}
      animate={{
        x: [0, tx * 0.6, tx],
        y: [0, ty * 0.4 - 24, ty + 16],
        opacity: [1, 1, 0],
        scale: [0.2, 1.1, 0.7],
      }}
      transition={{ delay, duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
    >
      <CoinIcon size={size} />
    </motion.div>
  );
}

const PARTICLES = [
  { angle: -82, distance: 98, delay: 0.12, size: 15 },
  { angle: -56, distance: 102, delay: 0.1, size: 17 },
  { angle: -30, distance: 108, delay: 0.14, size: 18 },
  { angle: -4, distance: 104, delay: 0.18, size: 16 },
  { angle: 22, distance: 102, delay: 0.11, size: 17 },
  { angle: 48, distance: 106, delay: 0.15, size: 16 },
  { angle: 72, distance: 98, delay: 0.13, size: 15 },
  { angle: 96, distance: 92, delay: 0.16, size: 16 },
];

export default function GiftBoxOpenModal({
  visible,
  reward,
  rank = 1,
  canDismiss = true,
  onDismiss,
}: GiftBoxOpenModalProps) {
  // Lazy initializer: false on SSR, true on client — safe with createPortal
  const [mounted] = useState<boolean>(() => typeof document !== "undefined");
  const safeRank = Number(rank ?? 1);
  const safeReward = Number(reward ?? 0);
  const [PRIMARY, SECONDARY] = RANK_COLORS[safeRank] ?? RANK_COLORS[1];

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          key="gift-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: EASE }}
          className="fixed inset-0 z-10000 flex flex-col items-center justify-center"
          style={{
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
            zIndex: 10000,
          }}
          onClick={() => {
            if (canDismiss) onDismiss();
          }}
        >
          <motion.div
            className="absolute pointer-events-none rounded-full"
            style={{
              width: 320,
              height: 320,
              background: `conic-gradient(from 0deg, ${PRIMARY}28, rgba(255,255,255,0.02), ${SECONDARY}28, ${PRIMARY}28)`,
              filter: "blur(28px)",
            }}
            initial={{ opacity: 0, scale: 0.7, rotate: 0 }}
            animate={{
              opacity: [0.18, 0.58, 0.4],
              scale: [0.84, 1, 1.06],
              rotate: 360,
            }}
            transition={{
              opacity: { duration: 0.5, ease: EASE },
              scale: { duration: 0.55, ease: EASE },
              rotate: { duration: 14, repeat: Infinity, ease: "linear" },
            }}
          />

          {/* Radial glow */}
          <motion.div
            className="absolute pointer-events-none rounded-full"
            style={{
              width: 250,
              height: 250,
              background: `radial-gradient(circle, ${PRIMARY}1A 0%, transparent 70%)`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 1.18], opacity: [0, 0.6, 0.22] }}
            transition={{ duration: 0.72, ease: EASE }}
          />

          {/* Ring burst */}
          <motion.div
            className="absolute pointer-events-none rounded-full border"
            style={{ width: 140, height: 140, borderColor: `${PRIMARY}35` }}
            initial={{ scale: 0.1, opacity: 0 }}
            animate={{ scale: [0.15, 1.82], opacity: [0.62, 0] }}
            transition={{ duration: 0.62, delay: 0.08, ease: EASE }}
          />

          {/* Second wave burst */}
          <motion.div
            className="absolute pointer-events-none rounded-full border"
            style={{ width: 160, height: 160, borderColor: `${SECONDARY}28` }}
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: [0.2, 2.1], opacity: [0.45, 0] }}
            transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
          />

          {/* Box + particles */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.42, ease: EASE }}
            className="relative flex flex-col items-center justify-center rounded-3xl border border-white/12 bg-linear-to-b from-white/10 to-white/4 px-7 py-6 shadow-[0_14px_64px_rgba(0,0,0,0.6)]"
          >
            {PARTICLES.map((p, i) => (
              <CoinParticle key={i} {...p} />
            ))}

            <motion.div
              initial={{ scale: 0, opacity: 0, y: 18, rotate: -10 }}
              animate={{
                scale: [0, 1.18, 0.98, 1],
                opacity: 1,
                y: [18, -4, 1, 0],
                rotate: [-9, 3, -1, 0],
              }}
              transition={{ duration: 0.62, delay: 0.06, ease: EASE }}
            >
              <motion.div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ boxShadow: `0 0 24px 8px ${PRIMARY}33` }}
                animate={{ opacity: [0.35, 0.75, 0.35] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
              <GiftBoxIcon size={100} openProgress={1} rank={rank} />
            </motion.div>

            {/* Reward */}
            <motion.div
              initial={{ scale: 0.4, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{
                delay: 0.26,
                duration: 0.4,
                ease: EASE,
              }}
              className="mt-5 flex items-center gap-2"
            >
              <motion.div
                animate={{ scale: [1, 1.18, 0.98, 1] }}
                transition={{ delay: 0.3, duration: 0.62, ease: EASE }}
              >
                <CoinIcon size={34} />
              </motion.div>
              <motion.span
                className="font-black tracking-tighter leading-none"
                initial={{ opacity: 0, y: 6, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: [0.9, 1.08, 1] }}
                transition={{ delay: 0.3, duration: 0.5, ease: EASE }}
                style={{
                  fontSize: 50,
                  background: `linear-gradient(135deg, #FFE566 0%, ${SECONDARY} 55%, ${PRIMARY} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: `drop-shadow(0 0 8px ${PRIMARY}55)`,
                }}
              >
                +{safeReward}
              </motion.span>
            </motion.div>

            {/* Caption */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42, duration: 0.28, ease: EASE }}
              className="mt-2"
            >
              <span className="text-white/45 text-[11px] font-medium tracking-[0.12em]">
                MỞ HỘP NHẬN THƯỞNG
              </span>
            </motion.div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.62, duration: 0.22, ease: EASE }}
            disabled={!canDismiss}
            onClick={(event) => {
              event.stopPropagation();
              if (canDismiss) onDismiss();
            }}
            className="mt-6 rounded-full border border-white/18 bg-white/6 px-4 py-2 text-[11px] tracking-widest uppercase transition-all"
            style={{
              opacity: canDismiss ? 1 : 0.45,
              cursor: canDismiss ? "pointer" : "default",
              color: canDismiss
                ? "rgba(255,255,255,0.75)"
                : "rgba(255,255,255,0.4)",
            }}
          >
            {canDismiss ? "Chạm để tiếp tục" : "Đang mở hộp..."}
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
