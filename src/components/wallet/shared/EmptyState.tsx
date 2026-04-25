"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  subtitle,
  ctaLabel,
  ctaHref,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center px-8"
    >
      <div className="w-16 h-16 rounded-full bg-white/4 flex items-center justify-center mb-4">
        <Icon size={26} className="text-white/20" />
      </div>
      <p className="text-white/40 font-bold">{title}</p>
      {subtitle && <p className="text-white/20 text-sm mt-1">{subtitle}</p>}
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="mt-4 text-sm font-black px-4 py-2 rounded-xl"
          style={{ color: "#FF4500" }}
        >
          {ctaLabel} →
        </Link>
      )}
    </motion.div>
  );
}
