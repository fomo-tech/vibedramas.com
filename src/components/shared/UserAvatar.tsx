"use client";

import Image from "next/image";

const GRADIENT_PALETTE = [
  "from-pink-500 to-rose-600",
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-red-500 to-rose-500",
  "from-indigo-500 to-blue-600",
  "from-fuchsia-500 to-pink-600",
];

function getGradient(name: string): string {
  if (!name) return GRADIENT_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  return GRADIENT_PALETTE[Math.abs(hash) % GRADIENT_PALETTE.length];
}

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface UserAvatarProps {
  name: string;
  avatar?: string | null;
  size?: number;
  className?: string;
}

export default function UserAvatar({
  name,
  avatar,
  size = 40,
  className = "",
}: UserAvatarProps) {
  const gradient = getGradient(name);
  const initials = getInitials(name);
  const fontSize = size < 32 ? 10 : size < 48 ? 13 : size < 72 ? 18 : 24;

  if (avatar) {
    return (
      <Image
        src={avatar}
        alt={name}
        width={size}
        height={size}
        className={`w-full h-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`w-full h-full bg-linear-to-br ${gradient} flex items-center justify-center ${className}`}
      aria-label={name}
    >
      <span
        className="font-black text-white select-none leading-none"
        style={{ fontSize }}
      >
        {initials}
      </span>
    </div>
  );
}
