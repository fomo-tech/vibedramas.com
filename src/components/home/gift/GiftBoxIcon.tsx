"use client";

import { useId } from "react";
import { motion } from "framer-motion";

interface GiftBoxIconProps {
  openProgress?: number;
  size?: number;
  locked?: boolean;
  rank?: number;
}

interface GiftPalette {
  bodyTop: string;
  bodyBottom: string;
  lidTop: string;
  lidBottom: string;
  ribbonTop: string;
  ribbonBottom: string;
  metal: string;
  glow: string;
  jewel: string;
}

const PALETTES: Record<number, GiftPalette> = {
  1: {
    bodyTop: "#FF5A1F",
    bodyBottom: "#8F1900",
    lidTop: "#FF7A38",
    lidBottom: "#C52A00",
    ribbonTop: "#FFD875",
    ribbonBottom: "#E89300",
    metal: "#FFB42B",
    glow: "#FF4500",
    jewel: "#FFEDB2",
  },
  2: {
    bodyTop: "#FF315D",
    bodyBottom: "#9C0B24",
    lidTop: "#FF644F",
    lidBottom: "#D11A36",
    ribbonTop: "#FFD56A",
    ribbonBottom: "#F08A00",
    metal: "#FFC247",
    glow: "#FF2D55",
    jewel: "#FFF1B7",
  },
  3: {
    bodyTop: "#FFB800",
    bodyBottom: "#A83D00",
    lidTop: "#FFD35A",
    lidBottom: "#E85B00",
    ribbonTop: "#FFF2B2",
    ribbonBottom: "#FF9D00",
    metal: "#FFE08A",
    glow: "#FF8A00",
    jewel: "#FFFFFF",
  },
  4: {
    bodyTop: "#FF375F",
    bodyBottom: "#5B0714",
    lidTop: "#FF7440",
    lidBottom: "#A70D2B",
    ribbonTop: "#FFE49A",
    ribbonBottom: "#FF9F0A",
    metal: "#FFD36A",
    glow: "#FF4D21",
    jewel: "#FFF8DD",
  },
  5: {
    bodyTop: "#3A2418",
    bodyBottom: "#090706",
    lidTop: "#6A321D",
    lidBottom: "#1A0B08",
    ribbonTop: "#FFF0B5",
    ribbonBottom: "#E89600",
    metal: "#FFE08A",
    glow: "#FF5A1F",
    jewel: "#FFFFFF",
  },
};

const LOCKED: GiftPalette = {
  bodyTop: "#4B4B4B",
  bodyBottom: "#191919",
  lidTop: "#616161",
  lidBottom: "#292929",
  ribbonTop: "#969696",
  ribbonBottom: "#555555",
  metal: "#8A8A8A",
  glow: "#555555",
  jewel: "#D0D0D0",
};

export default function GiftBoxIcon({
  openProgress = 0,
  size = 40,
  locked = false,
  rank = 1,
}: GiftBoxIconProps) {
  const id = useId().replace(/:/g, "");
  const safeRank = Math.max(1, Math.min(5, Number(rank) || 1));
  const open = Math.max(0, Math.min(1, Number(openProgress) || 0));
  const palette = locked ? LOCKED : (PALETTES[safeRank] ?? PALETTES[1]);
  const bodyGradient = id + "-body";
  const lidGradient = id + "-lid";
  const ribbonGradient = id + "-ribbon";
  const jewelGradient = id + "-jewel";
  const shadowFilter = id + "-shadow";
  const glowFilter = id + "-glow";

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ overflow: "visible" }}
      animate={locked ? undefined : { y: [0, -1.2, 0] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
    >
      <defs>
        <linearGradient id={bodyGradient} x1="12" y1="27" x2="50" y2="59">
          <stop stopColor={palette.bodyTop} />
          <stop offset="0.55" stopColor={palette.bodyBottom} />
          <stop offset="1" stopColor="#080504" />
        </linearGradient>
        <linearGradient id={lidGradient} x1="8" y1="16" x2="54" y2="34">
          <stop stopColor={palette.lidTop} />
          <stop offset="1" stopColor={palette.lidBottom} />
        </linearGradient>
        <linearGradient id={ribbonGradient} x1="24" y1="8" x2="39" y2="59">
          <stop stopColor={palette.ribbonTop} />
          <stop offset="0.5" stopColor={palette.metal} />
          <stop offset="1" stopColor={palette.ribbonBottom} />
        </linearGradient>
        <radialGradient id={jewelGradient} cx="38%" cy="30%" r="70%">
          <stop stopColor="#FFFFFF" />
          <stop offset="0.35" stopColor={palette.jewel} />
          <stop offset="1" stopColor={palette.ribbonBottom} />
        </radialGradient>
        <filter id={shadowFilter} x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#000" floodOpacity="0.7" />
        </filter>
        <filter id={glowFilter} x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="0" stdDeviation={safeRank >= 4 ? "5" : "3"} floodColor={palette.glow} floodOpacity={safeRank >= 4 ? "0.75" : "0.45"} />
        </filter>
      </defs>

      <motion.g opacity={open}>
        {[14, 24, 32, 40, 50].map((x, index) => (
          <motion.path
            key={x}
            d={"M32 27 L" + x + " " + (4 + (index % 2) * 5)}
            stroke={index % 2 ? palette.ribbonTop : palette.glow}
            strokeWidth="1.6"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: open, opacity: open * 0.8 }}
          />
        ))}
      </motion.g>

      <ellipse cx="32" cy="57" rx="23" ry="4.5" fill="#000" opacity="0.42" />

      <g filter={"url(#" + shadowFilter + ")"}>
        <path d="M10 28 L14 25 H50 L54 28 V51 L49 57 H15 L10 51 Z" fill={"url(#" + bodyGradient + ")"} />
        <path d="M10 28 L15 32 H49 L54 28" stroke={palette.metal} strokeWidth="1.1" opacity="0.65" />
        <path d="M14 25 L19 31 V55 L15 57 L10 51 V28 Z" fill="#000" opacity="0.17" />
        <path d="M50 25 L45 31 V55 L49 57 L54 51 V28 Z" fill="#FFF" opacity="0.05" />
        <path d="M28 26 H36 V57 H28 Z" fill={"url(#" + ribbonGradient + ")"} />
        <path d="M29.5 27 H31.5 V55" stroke="#FFF" strokeWidth="1.2" opacity="0.34" />
        <path d="M15 52 H49" stroke={palette.metal} strokeWidth="1" opacity="0.55" />

        {safeRank >= 3 && !locked && (
          <>
            <path d="M13 34 L17 30" stroke={palette.metal} strokeWidth="1.2" />
            <path d="M51 34 L47 30" stroke={palette.metal} strokeWidth="1.2" />
            <path d="M13 48 L17 53" stroke={palette.metal} strokeWidth="1.2" />
            <path d="M51 48 L47 53" stroke={palette.metal} strokeWidth="1.2" />
          </>
        )}

        <g filter={"url(#" + glowFilter + ")"}>
          <circle cx="32" cy="42" r={safeRank >= 4 ? "8" : "7"} fill="#100907" stroke={palette.metal} strokeWidth="1.3" />
          <circle cx="32" cy="42" r="4.5" fill={"url(#" + jewelGradient + ")"} />
          {locked ? (
            <path d="M29.2 42 V39.8 A2.8 2.8 0 0 1 34.8 39.8 V42 M28.2 42 H35.8 V47 H28.2 Z" fill={palette.jewel} />
          ) : (
            <path
              d="M29.5 42 L32 39.5 L34.5 42 L32 44.5 Z"
              fill={palette.jewel}
              opacity="0.92"
            />
          )}
          <circle cx="30.5" cy="40.5" r="1.2" fill="#FFF" opacity="0.8" />
        </g>
      </g>

      <motion.g
        animate={{ y: -open * 22, rotate: -open * 9 }}
        transition={{ type: "spring", stiffness: 280, damping: 21 }}
        style={{ transformOrigin: "32px 28px" }}
        filter={"url(#" + glowFilter + ")"}
      >
        <path d="M7 20 L12 16 H52 L57 20 V29 L52 33 H12 L7 29 Z" fill={"url(#" + lidGradient + ")"} stroke={palette.metal} strokeWidth="1" />
        <path d="M8 21 H56" stroke="#FFF" strokeWidth="1.3" opacity="0.28" />
        <path d="M28 16 H36 V33 H28 Z" fill={"url(#" + ribbonGradient + ")"} />
        <path d="M30 17 H31.5 V31" stroke="#FFF" strokeWidth="1" opacity="0.4" />

        <path d="M32 16 C26 12 20 8 16 12 C13 15 17 19 22 19 C26 19 29 17 32 16 Z" fill={"url(#" + ribbonGradient + ")"} stroke={palette.metal} strokeWidth="0.8" />
        <path d="M32 16 C38 12 44 8 48 12 C51 15 47 19 42 19 C38 19 35 17 32 16 Z" fill={"url(#" + ribbonGradient + ")"} stroke={palette.metal} strokeWidth="0.8" />
        <circle cx="32" cy="16" r="4.6" fill={"url(#" + jewelGradient + ")"} stroke={palette.metal} strokeWidth="1" />
        <circle cx="30.5" cy="14.5" r="1.2" fill="#FFF" opacity="0.85" />

      </motion.g>

      {!locked && (
        <>
          <motion.path
            d="M17 30 L24 28"
            stroke="#FFF"
            strokeWidth="1.4"
            strokeLinecap="round"
            animate={{ opacity: [0.15, 0.9, 0.15], x: [-2, 5, -2] }}
            transition={{ duration: 2.2, repeat: Infinity }}
          />
          {safeRank >= 3 && (
            <g fill={palette.ribbonTop} filter={"url(#" + glowFilter + ")"}>
              <motion.circle cx="8" cy="17" r="1.2" animate={{ opacity: [0.2, 1, 0.2], scale: [0.7, 1.3, 0.7] }} transition={{ duration: 1.8, repeat: Infinity }} />
              <motion.circle cx="56" cy="11" r="1" animate={{ opacity: [1, 0.2, 1], scale: [1.2, 0.7, 1.2] }} transition={{ duration: 2.1, repeat: Infinity }} />
              {safeRank === 5 && (
                <motion.path d="M54 38 H62 M58 34 V42" stroke={palette.jewel} strokeWidth="1.3" animate={{ opacity: [0.2, 1, 0.2], rotate: [0, 45, 0] }} transition={{ duration: 2.4, repeat: Infinity }} />
              )}
            </g>
          )}
        </>
      )}
    </motion.svg>
  );
}
