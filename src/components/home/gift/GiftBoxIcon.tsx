"use client";

import { useId } from "react";
import { motion } from "framer-motion";

interface GiftBoxIconProps {
  openProgress?: number;
  size?: number;
  locked?: boolean;
  rank?: number;
}

type P = { box1: string; box2: string; lid1: string; lid2: string; rib1: string; rib2: string; bow1: string; bow2: string };

const PALETTES: Record<number, P> = {
  1: { box1:"#FF6B2B",box2:"#CC3300",lid1:"#FF8C4A",lid2:"#E04500",rib1:"#FFD166",rib2:"#FFAD00",bow1:"#FFE566",bow2:"#FFB300" },
  2: { box1:"#FF9500",box2:"#E05A00",lid1:"#FFAA22",lid2:"#E06800",rib1:"#FFE566",rib2:"#FFB300",bow1:"#FFF0A0",bow2:"#FFCC00" },
  3: { box1:"#FFD700",box2:"#B8860B",lid1:"#FFE44D",lid2:"#CCA800",rib1:"#FFF5CC",rib2:"#FFDD00",bow1:"#FFFACD",bow2:"#FFD700" },
  4: { box1:"#9B59B6",box2:"#6C3483",lid1:"#B17ACC",lid2:"#8E44AD",rib1:"#DDA0DD",rib2:"#9932CC",bow1:"#E8BBFF",bow2:"#C04080" },
  5: { box1:"#00D4FF",box2:"#0077AA",lid1:"#66E5FF",lid2:"#00AADD",rib1:"#E0F8FF",rib2:"#00CCFF",bow1:"#FFFFFF",bow2:"#88EEFF" },
};
const LOCKED: P = { box1:"#444",box2:"#222",lid1:"#555",lid2:"#333",rib1:"#888",rib2:"#555",bow1:"#999",bow2:"#666" };

function Rank1({ id, p, lidY, lidRotate }: { id: string; p: P; lidY: number; lidRotate: number }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-b`} x1="6" y1="26" x2="42" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={p.box1}/><stop offset="100%" stopColor={p.box2}/>
        </linearGradient>
        <linearGradient id={`${id}-l`} x1="2" y1="14" x2="46" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={p.lid1}/><stop offset="100%" stopColor={p.lid2}/>
        </linearGradient>
        <linearGradient id={`${id}-r`} x1="22" y1="0" x2="26" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={p.rib1}/><stop offset="100%" stopColor={p.rib2}/>
        </linearGradient>
        <filter id={`${id}-sh`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="rgba(0,0,0,0.5)"/>
        </filter>
      </defs>
      <g filter={`url(#${id}-sh)`}>
        <path d="M6 27 Q6 25 9 25 H39 Q42 25 42 27 V47 Q42 50 39 50 H9 Q6 50 6 47 Z" fill={`url(#${id}-b)`}/>
        <path d="M6 27 Q6 25 9 25 H24 V50 H9 Q6 50 6 47 Z" fill="rgba(0,0,0,0.1)"/>
        <rect x="21" y="25" width="6" height="25" fill={`url(#${id}-r)`} rx="1"/>
        <ellipse cx="13" cy="33" rx="5" ry="3" fill="rgba(255,255,255,0.1)" transform="rotate(-15 13 33)"/>
      </g>
      <motion.g
        animate={{ y: lidY, rotate: lidRotate }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        style={{ transformOrigin: "24px 26px" }}
      >
        <g filter={`url(#${id}-sh)`}>
          <path d="M2 16 Q2 14 5 14 H43 Q46 14 46 16 V26 Q46 28 43 28 H5 Q2 28 2 26 Z" fill={`url(#${id}-l)`}/>
          <rect x="2" y="19" width="44" height="6" fill={`url(#${id}-r)`} rx="1"/>
          <ellipse cx="11" cy="17" rx="6" ry="2.2" fill="rgba(255,255,255,0.2)" transform="rotate(-8 11 17)"/>
        </g>
        <path d="M24 13 Q18 4 9 7 Q5 11 10 14 Q17 15 24 13 Z" fill={p.bow1}/>
        <path d="M24 13 Q30 4 39 7 Q43 11 38 14 Q31 15 24 13 Z" fill={p.bow1}/>
        <circle cx="24" cy="13" r="5" fill={p.bow1} stroke={p.bow2} strokeWidth="1.5"/>
        <circle cx="24" cy="13" r="2.5" fill={p.bow2}/>
        <circle cx="22.5" cy="11.5" r="1.2" fill="rgba(255,255,255,0.5)"/>
      </motion.g>
    </>
  );
}

function Rank2({ id, p, lidY, lidRotate }: { id: string; p: P; lidY: number; lidRotate: number }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-b`} x1="4" y1="25" x2="44" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={p.box1}/><stop offset="100%" stopColor={p.box2}/>
        </linearGradient>
        <linearGradient id={`${id}-l`} x1="0" y1="12" x2="48" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={p.lid1}/><stop offset="100%" stopColor={p.lid2}/>
        </linearGradient>
        <filter id={`${id}-sh`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="rgba(0,0,0,0.5)"/>
        </filter>
      </defs>
      <g filter={`url(#${id}-sh)`}>
        <rect x="5" y="25" width="38" height="25" rx="5" fill={`url(#${id}-b)`}/>
        <rect x="5" y="25" width="19" height="25" rx="5" fill="rgba(0,0,0,0.1)"/>
        <rect x="20" y="25" width="8" height="25" fill={p.rib1} opacity="0.9"/>
      </g>
      <motion.g
        animate={{ y: lidY, rotate: lidRotate }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        style={{ transformOrigin: "24px 26px" }}
      >
        <g filter={`url(#${id}-sh)`}>
          <rect x="1" y="14" width="46" height="13" rx="4" fill={`url(#${id}-l)`}/>
          <rect x="20" y="14" width="8" height="13" fill={p.rib1} opacity="0.9"/>
        </g>
        <g transform="translate(24,12)">
          {[0,60,120,180,240,300].map((a,i) => {
            const r=(a*Math.PI)/180;
            return <circle key={i} cx={Math.cos(r)*6} cy={Math.sin(r)*6} r="2" fill={p.bow1}/>;
          })}
          <line x1="-7" y1="0" x2="7" y2="0" stroke={p.bow1} strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="-3.5" y1="-6" x2="3.5" y2="6" stroke={p.bow1} strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="3.5" y1="-6" x2="-3.5" y2="6" stroke={p.bow1} strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="0" cy="0" r="4" fill={p.bow1} stroke={p.bow2} strokeWidth="1.5"/>
          <circle cx="0" cy="0" r="2" fill={p.bow2}/>
        </g>
      </motion.g>
    </>
  );
}

function Rank3({ id, p, lidY, lidRotate }: { id: string; p: P; lidY: number; lidRotate: number }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-b`} x1="4" y1="28" x2="44" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={p.box1}/><stop offset="100%" stopColor={p.box2}/>
        </linearGradient>
        <linearGradient id={`${id}-l`} x1="2" y1="14" x2="46" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={p.lid1}/><stop offset="100%" stopColor={p.lid2}/>
        </linearGradient>
        <filter id={`${id}-glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={p.box1} floodOpacity="0.6"/>
        </filter>
      </defs>
      <g filter={`url(#${id}-glow)`}>
        <path d="M4 30 Q4 28 7 28 H41 Q44 28 44 30 V48 Q44 51 41 51 H7 Q4 51 4 48 Z" fill={`url(#${id}-b)`}/>
        <rect x="4" y="28" width="6" height="6" rx="1" fill={p.rib2} opacity="0.8"/>
        <rect x="38" y="28" width="6" height="6" rx="1" fill={p.rib2} opacity="0.8"/>
        <rect x="4" y="45" width="6" height="6" rx="1" fill={p.rib2} opacity="0.8"/>
        <rect x="38" y="45" width="6" height="6" rx="1" fill={p.rib2} opacity="0.8"/>
        <rect x="20" y="36" width="8" height="7" rx="2" fill={p.rib1} stroke={p.rib2} strokeWidth="1"/>
        <path d="M22 36 Q22 32 24 32 Q26 32 26 36" fill="none" stroke={p.rib2} strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="24" cy="39.5" r="1.2" fill={p.rib2}/>
      </g>
      <motion.g
        animate={{ y: lidY, rotate: lidRotate }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        style={{ transformOrigin: "24px 29px" }}
      >
        <g filter={`url(#${id}-glow)`}>
          <path d="M4 28 Q4 14 24 12 Q44 14 44 28 Z" fill={`url(#${id}-l)`}/>
          <rect x="4" y="23" width="5" height="5" rx="1" fill={p.rib2} opacity="0.8"/>
          <rect x="39" y="23" width="5" height="5" rx="1" fill={p.rib2} opacity="0.8"/>
          <polygon points="16,18 18,12 20,18" fill={p.bow1} stroke={p.bow2} strokeWidth="0.5"/>
          <polygon points="22,18 24,10 26,18" fill={p.bow1} stroke={p.bow2} strokeWidth="0.5"/>
          <polygon points="28,18 30,12 32,18" fill={p.bow1} stroke={p.bow2} strokeWidth="0.5"/>
          <line x1="14" y1="18" x2="34" y2="18" stroke={p.bow2} strokeWidth="1"/>
        </g>
      </motion.g>
    </>
  );
}

function Rank4({ id, p, lidY, lidRotate }: { id: string; p: P; lidY: number; lidRotate: number }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-b`} x1="4" y1="26" x2="44" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={p.box1}/><stop offset="100%" stopColor={p.box2}/>
        </linearGradient>
        <linearGradient id={`${id}-l`} x1="2" y1="12" x2="46" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={p.lid1}/><stop offset="100%" stopColor={p.lid2}/>
        </linearGradient>
        <radialGradient id={`${id}-gem`} cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor={p.bow1}/><stop offset="100%" stopColor={p.bow2}/>
        </radialGradient>
        <filter id={`${id}-glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={p.box1} floodOpacity="0.7"/>
        </filter>
      </defs>
      <g filter={`url(#${id}-glow)`}>
        <path d="M10 27 L6 32 L6 44 L10 49 L38 49 L42 44 L42 32 L38 27 Z" fill={`url(#${id}-b)`}/>
        <path d="M10 27 L6 32 L6 44 L10 49 L24 49 L24 27 Z" fill="rgba(0,0,0,0.12)"/>
        <circle cx="24" cy="38" r="9" fill="none" stroke={p.bow1} strokeWidth="0.8" strokeDasharray="2 3" opacity="0.5"/>
        <polygon points="24,31 30,38 24,45 18,38" fill={`url(#${id}-gem)`}/>
        <polygon points="24,31 30,38 24,37" fill="rgba(255,255,255,0.35)"/>
      </g>
      <motion.g
        animate={{ y: lidY, rotate: lidRotate }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        style={{ transformOrigin: "24px 27px" }}
      >
        <g filter={`url(#${id}-glow)`}>
          <path d="M10 27 L6 22 H42 L38 27 Z" fill={`url(#${id}-l)`}/>
          <path d="M6 22 H42 L42 17 H6 Z" fill={p.lid1}/>
          <polygon points="24,10 28,15 24,14 20,15" fill={p.bow1} stroke={p.bow2} strokeWidth="0.5"/>
          <circle cx="24" cy="8" r="3" fill={p.bow1} stroke={p.bow2} strokeWidth="1"/>
          <circle cx="23" cy="7" r="1.2" fill="rgba(255,255,255,0.6)"/>
        </g>
      </motion.g>
    </>
  );
}

function Rank5({ id, p, lidY, lidRotate }: { id: string; p: P; lidY: number; lidRotate: number }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-b`} x1="4" y1="24" x2="44" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={p.box1} stopOpacity="0.9"/><stop offset="100%" stopColor={p.box2}/>
        </linearGradient>
        <linearGradient id={`${id}-l`} x1="2" y1="10" x2="46" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={p.lid1}/><stop offset="100%" stopColor={p.lid2}/>
        </linearGradient>
        <radialGradient id={`${id}-crystal`} cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.8)"/><stop offset="100%" stopColor={p.box1} stopOpacity="0.3"/>
        </radialGradient>
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={p.box1} floodOpacity="0.8"/>
        </filter>
        <filter id={`${id}-bright`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="white" floodOpacity="0.5"/>
        </filter>
      </defs>
      <g stroke={p.bow2} strokeLinecap="round" opacity="0.6">
        <line x1="24" y1="-2" x2="24" y2="-8" strokeWidth="2"/>
        <line x1="35" y1="1" x2="39" y2="-3" strokeWidth="1.5"/>
        <line x1="13" y1="1" x2="9" y2="-3" strokeWidth="1.5"/>
        <line x1="43" y1="13" x2="48" y2="10" strokeWidth="1.5"/>
        <line x1="5" y1="13" x2="0" y2="10" strokeWidth="1.5"/>
        <line x1="44" y1="38" x2="49" y2="38" strokeWidth="1.5"/>
        <line x1="4" y1="38" x2="-1" y2="38" strokeWidth="1.5"/>
      </g>
      <g filter={`url(#${id}-glow)`}>
        <path d="M12 26 L5 30 L5 44 L12 50 L36 50 L43 44 L43 30 L36 26 Z" fill={`url(#${id}-b)`}/>
        <path d="M12 26 L5 30 L5 37 L24 32 Z" fill="rgba(255,255,255,0.15)"/>
        <path d="M36 26 L43 30 L43 37 L24 32 Z" fill="rgba(255,255,255,0.08)"/>
        <path d="M12 26 L5 30 L5 44 L12 50" stroke={p.bow2} strokeWidth="1.2" fill="none" opacity="0.6"/>
        <path d="M36 26 L43 30 L43 44 L36 50" stroke={p.bow1} strokeWidth="1.2" fill="none" opacity="0.6"/>
        <g filter={`url(#${id}-bright)`}>
          <polygon points="24,30 27,37 24,44 21,37" fill={p.bow2} opacity="0.8"/>
          <polygon points="24,30 31,33 24,36 17,33" fill={p.bow1} opacity="0.8"/>
          <circle cx="24" cy="37" r="3.5" fill={`url(#${id}-crystal)`}/>
          <circle cx="23" cy="36" r="1.5" fill="rgba(255,255,255,0.9)"/>
        </g>
      </g>
      <motion.g
        animate={{ y: lidY, rotate: lidRotate }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        style={{ transformOrigin: "24px 26px" }}
      >
        <g filter={`url(#${id}-glow)`}>
          <path d="M12 26 L4 18 L44 18 L36 26 Z" fill={`url(#${id}-l)`}/>
          <path d="M12 26 L4 18 L24 22 Z" fill="rgba(255,255,255,0.2)"/>
          <path d="M36 26 L44 18 L24 22 Z" fill="rgba(255,255,255,0.1)"/>
          <path d="M18 18 L24 6 L30 18 Z" fill={p.lid1} stroke={p.bow1} strokeWidth="0.8"/>
          <path d="M18 18 L24 6 L24 18 Z" fill="rgba(255,255,255,0.3)"/>
          <circle cx="24" cy="6" r="2.5" fill={p.bow1} filter={`url(#${id}-bright)`}/>
          <circle cx="23.2" cy="5.2" r="1" fill="white"/>
        </g>
        <circle cx="4" cy="18" r="2" fill={p.bow2} opacity="0.8"/>
        <circle cx="44" cy="18" r="2" fill={p.bow1} opacity="0.8"/>
      </motion.g>
      <g fill={p.bow2} opacity="0.8">
        <circle cx="4" cy="26" r="1.5"/>
        <circle cx="44" cy="26" r="1.5"/>
        <circle cx="24" cy="-2" r="1.5"/>
      </g>
    </>
  );
}

function LockedIcon({ id, p, lidY, lidRotate }: { id: string; p: P; lidY: number; lidRotate: number }) {
  return (
    <>
      <defs>
        <filter id={`${id}-sh`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.5)"/>
        </filter>
      </defs>
      <g filter={`url(#${id}-sh)`} opacity="0.7">
        <path d="M6 27 Q6 25 9 25 H39 Q42 25 42 27 V47 Q42 50 39 50 H9 Q6 50 6 47 Z" fill={p.box1}/>
        <rect x="21" y="25" width="6" height="25" fill={p.rib1} rx="1"/>
      </g>
      <motion.g
        animate={{ y: lidY, rotate: lidRotate }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        style={{ transformOrigin: "24px 26px" }}
      >
        <g filter={`url(#${id}-sh)`} opacity="0.7">
          <path d="M2 16 Q2 14 5 14 H43 Q46 14 46 16 V26 Q46 28 43 28 H5 Q2 28 2 26 Z" fill={p.lid1}/>
          <rect x="2" y="19" width="44" height="6" fill={p.rib1} rx="1"/>
        </g>
        <circle cx="24" cy="13" r="5" fill={p.bow1} stroke={p.bow2} strokeWidth="1.5" opacity="0.7"/>
        <circle cx="24" cy="13" r="2.5" fill={p.bow2} opacity="0.7"/>
      </motion.g>
    </>
  );
}

export default function GiftBoxIcon({ openProgress = 0, size = 40, locked = false, rank = 1 }: GiftBoxIconProps) {
  const id = useId().replace(/:/g, "");
  const lidY = -openProgress * 26;
  const lidRotate = openProgress * 20;
  const p = locked ? LOCKED : (PALETTES[rank] ?? PALETTES[1]);
  return (
    <svg width={size} height={size} viewBox="0 0 48 52" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ overflow: "visible" }}>
      {locked ? (
        <LockedIcon id={id} p={p} lidY={lidY} lidRotate={lidRotate} />
      ) : rank === 1 ? (
        <Rank1 id={id} p={p} lidY={lidY} lidRotate={lidRotate} />
      ) : rank === 2 ? (
        <Rank2 id={id} p={p} lidY={lidY} lidRotate={lidRotate} />
      ) : rank === 3 ? (
        <Rank3 id={id} p={p} lidY={lidY} lidRotate={lidRotate} />
      ) : rank === 4 ? (
        <Rank4 id={id} p={p} lidY={lidY} lidRotate={lidRotate} />
      ) : (
        <Rank5 id={id} p={p} lidY={lidY} lidRotate={lidRotate} />
      )}
    </svg>
  );
}
