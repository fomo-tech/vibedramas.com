import { useId } from "react";

interface CoinIconProps {
  size?: number;
  className?: string;
}

export default function CoinIcon({ size = 16, className = "" }: CoinIconProps) {
  const uid = useId().replace(/:/g, "");
  const body = `cg-${uid}`;
  const face = `cf-${uid}`;
  const rim = `cr-${uid}`;
  const rimDark = `crd-${uid}`;
  const shine = `cs-${uid}`;
  const glint = `cgl-${uid}`;
  const shadow = `csh-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={body}
          x1="7"
          y1="3"
          x2="25"
          y2="29"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFF6BE" />
          <stop offset="34%" stopColor="#FFD13D" />
          <stop offset="68%" stopColor="#F28A16" />
          <stop offset="100%" stopColor="#9D3F00" />
        </linearGradient>
        <linearGradient
          id={rim}
          x1="6"
          y1="3.5"
          x2="25"
          y2="27"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFF8C8" />
          <stop offset="40%" stopColor="#FFCA2F" />
          <stop offset="100%" stopColor="#A94500" />
        </linearGradient>
        <linearGradient
          id={rimDark}
          x1="8"
          y1="4"
          x2="24"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#D77800" />
          <stop offset="100%" stopColor="#6E2600" />
        </linearGradient>
        <radialGradient
          id={face}
          cx="38%"
          cy="30%"
          r="75%"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0%" stopColor="#FFF7B8" />
          <stop offset="36%" stopColor="#FFD846" />
          <stop offset="78%" stopColor="#E07100" />
          <stop offset="100%" stopColor="#A84900" />
        </radialGradient>
        <radialGradient
          id={shine}
          cx="30%"
          cy="22%"
          r="62%"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.82" />
          <stop offset="48%" stopColor="#FFFFFF" stopOpacity="0.18" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id={glint}
          x1="9"
          y1="8"
          x2="21"
          y2="21"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <filter id={shadow} x="-25%" y="-15%" width="150%" height="150%">
          <feDropShadow
            dx="0"
            dy="1.6"
            stdDeviation="1.4"
            floodColor="#4A1900"
            floodOpacity="0.38"
          />
        </filter>
      </defs>

      <ellipse
        cx="16"
        cy="26.7"
        rx="10.5"
        ry="2.8"
        fill="#3A1600"
        opacity="0.24"
      />

      <g filter={`url(#${shadow})`}>
        <circle cx="16" cy="15.4" r="12.7" fill={`url(#${rimDark})`} />
        <path
          d="M4.8 15.4C4.8 8.9 9.8 3.6 16 3.6s11.2 5.3 11.2 11.8c0 1.9-.4 3.7-1.2 5.2-1.9 3.7-5.7 6.2-10 6.2S7.9 24.3 6 20.6a11.6 11.6 0 0 1-1.2-5.2Z"
          fill={`url(#${body})`}
          stroke={`url(#${rim})`}
          strokeWidth="1.2"
        />

        <circle
          cx="16"
          cy="15.1"
          r="8.8"
          fill={`url(#${face})`}
          stroke="#FFE77A"
          strokeWidth="0.95"
        />

        <path
          d="M7.6 12.5c1.4-4.2 5.1-6.7 9.4-6.3 2.6.2 4.8 1.4 6.3 3.2"
          stroke={`url(#${glint})`}
          strokeWidth="1.35"
          strokeLinecap="round"
          opacity="0.72"
        />

        <path
          d="M11 11.2 15.9 20l5.1-8.8"
          stroke="#763000"
          strokeWidth="3.15"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.9"
        />
        <path
          d="M11 10.5 15.9 19.3 21 10.5"
          stroke="#FFF0A0"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M13.3 10.6h5.4"
          stroke="#FFF4B8"
          strokeWidth="1.15"
          strokeLinecap="round"
          opacity="0.82"
        />

        <circle cx="16" cy="15.4" r="12.2" fill={`url(#${shine})`} />
        <path
          d="M24.5 6.6 25.2 8l1.4.7-1.4.7-.7 1.4-.7-1.4-1.4-.7 1.4-.7.7-1.4Z"
          fill="#FFF7BC"
        />
        <circle cx="7.1" cy="21.7" r="0.8" fill="#FFE37A" opacity="0.85" />
      </g>

      <path
        d="M6.4 20.9c2 3.8 5.7 6 9.6 6s7.6-2.2 9.6-6"
        stroke="#FFB11B"
        strokeWidth="0.75"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}
