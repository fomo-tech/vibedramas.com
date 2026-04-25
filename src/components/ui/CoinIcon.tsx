import { useId } from "react";

interface CoinIconProps {
  size?: number;
  className?: string;
}

export default function CoinIcon({ size = 16, className = "" }: CoinIconProps) {
  const uid = useId().replace(/:/g, "");
  const body = `cg-${uid}`;
  const rim = `cr-${uid}`;
  const shine = `cs-${uid}`;
  const inner = `ci-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Main body gradient — light gold → deep amber */}
        <linearGradient
          id={body}
          x1="5"
          y1="2"
          x2="19"
          y2="22"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFF1A8" />
          <stop offset="30%" stopColor="#FFD000" />
          <stop offset="65%" stopColor="#E07800" />
          <stop offset="100%" stopColor="#A84E00" />
        </linearGradient>
        {/* Rim stroke gradient */}
        <linearGradient
          id={rim}
          x1="3"
          y1="3"
          x2="21"
          y2="21"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFE899" />
          <stop offset="100%" stopColor="#B86000" />
        </linearGradient>
        {/* Top-left radial shine */}
        <radialGradient
          id={shine}
          cx="35%"
          cy="25%"
          r="55%"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0%" stopColor="white" stopOpacity="0.72" />
          <stop offset="60%" stopColor="white" stopOpacity="0.08" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        {/* Inner face gradient — slightly lighter center */}
        <radialGradient
          id={inner}
          cx="45%"
          cy="38%"
          r="65%"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0%" stopColor="#FFDF50" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#C06000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Drop shadow */}
      <ellipse cx="12" cy="13.2" rx="9.8" ry="2.5" fill="rgba(80,30,0,0.30)" />

      {/* Main coin body */}
      <circle
        cx="12"
        cy="11.8"
        r="10.5"
        fill={`url(#${body})`}
        stroke={`url(#${rim})`}
        strokeWidth="0.55"
      />

      {/* Inner bevel ring */}
      <circle
        cx="12"
        cy="11.8"
        r="8.1"
        fill="none"
        stroke="rgba(255,200,60,0.28)"
        strokeWidth="0.65"
      />

      {/* Inner face tint */}
      <circle cx="12" cy="11.8" r="8.1" fill={`url(#${inner})`} />

      {/* Stylized "V" — dark embossed stroke */}
      <path
        d="M8.6 8.4 L12 14.8 L15.4 8.4"
        stroke="rgba(90,35,0,0.90)"
        strokeWidth="2.1"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* "V" — golden highlight stroke */}
      <path
        d="M8.6 8.4 L12 14.8 L15.4 8.4"
        stroke="rgba(255,225,100,0.50)"
        strokeWidth="0.7"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Top-left specular shine */}
      <circle cx="12" cy="11.8" r="10.5" fill={`url(#${shine})`} />

      {/* Sparkle — top right */}
      <circle cx="18.2" cy="6.5" r="0.9" fill="rgba(255,245,160,0.95)" />
      <circle cx="17.5" cy="6.5" r="0.3" fill="rgba(255,255,255,0.6)" />
      {/* Sparkle — bottom left */}
      <circle cx="5.8" cy="16.8" r="0.55" fill="rgba(255,235,130,0.65)" />
    </svg>
  );
}
