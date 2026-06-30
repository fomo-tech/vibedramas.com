"use client";

import Image from "next/image";

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
  // If avatar is empty or contains dicebear, we use our premium default avatar
  const isDefaultOrDicebear = !avatar || avatar.includes("dicebear.com");

  if (!isDefaultOrDicebear && avatar) {
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

  // Professional gradient generator based on name
  const getGradient = (str: string) => {
    if (!str || str === "?") return "from-slate-700 to-slate-900";
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const gradients = [
      "from-indigo-600 to-violet-800",
      "from-rose-600 to-pink-800",
      "from-cyan-600 to-blue-800",
      "from-emerald-600 to-teal-800",
      "from-amber-600 to-orange-800",
      "from-fuchsia-600 to-purple-800",
    ];
    return gradients[Math.abs(hash) % gradients.length];
  };

  const gradient = getGradient(name);

  // We can render a clean, premium silhouette avatar inside a gradient background
  return (
    <div
      className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden select-none ${className}`}
      aria-label={name}
    >
      {/* Visual highlights for depth */}
      <div className="absolute inset-0 bg-white/5 mix-blend-overlay" />
      <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/10 rounded-full blur-lg pointer-events-none" />
      
      {/* Premium user silhouette icon */}
      <svg
        className="w-[48%] h-[48%] text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );
}
