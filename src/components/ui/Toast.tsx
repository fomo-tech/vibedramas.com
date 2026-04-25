"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { useEffect } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const COLORS = {
  success: {
    bg: "bg-[#0a1f13]",
    border: "border-green-500/40",
    icon: "text-green-400",
    glow: "shadow-[0_4px_32px_rgba(34,197,94,0.18)]",
    bar: "bg-green-400",
  },
  error: {
    bg: "bg-[#1f0a0a]",
    border: "border-red-500/40",
    icon: "text-red-400",
    glow: "shadow-[0_4px_32px_rgba(239,68,68,0.18)]",
    bar: "bg-red-400",
  },
  info: {
    bg: "bg-[#0a0f1f]",
    border: "border-blue-500/40",
    icon: "text-blue-400",
    glow: "shadow-[0_4px_32px_rgba(59,130,246,0.18)]",
    bar: "bg-blue-400",
  },
  warning: {
    bg: "bg-[#1f1600]",
    border: "border-yellow-500/40",
    icon: "text-yellow-400",
    glow: "shadow-[0_4px_32px_rgba(234,179,8,0.18)]",
    bar: "bg-yellow-400",
  },
};

export default function Toast({
  id,
  type,
  title,
  message,
  duration = 4000,
  onClose,
}: ToastProps) {
  const Icon = ICONS[type];
  const colors = COLORS[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onClose(id), duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.88 }}
      transition={{ type: "spring", damping: 22, stiffness: 280 }}
      className={`${colors.bg} ${colors.border} ${colors.glow} backdrop-blur-2xl border rounded-2xl overflow-hidden min-w-[300px] max-w-sm`}
    >
      {/* Colored top bar */}
      <div className={`h-0.5 w-full ${colors.bar}`} />
      <div className="flex items-start gap-3 p-4">
        <div className={`${colors.icon} shrink-0 mt-0.5`}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-black text-sm leading-tight">
            {title}
          </h4>
          {message && (
            <p className="text-white/50 text-xs mt-0.5 leading-relaxed">
              {message}
            </p>
          )}
        </div>
        <button
          onClick={() => onClose(id)}
          className="text-white/20 hover:text-white/60 transition-colors p-1 -mt-1 -mr-1 shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );
}
