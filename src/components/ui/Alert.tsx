"use client";

import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react";

export type AlertType = "success" | "error" | "info" | "warning";

export interface AlertProps {
  type: AlertType;
  title: string;
  message?: string;
  confirmText?: string;
  onConfirm: () => void;
  onClose: () => void;
}

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const COLORS = {
  success: {
    iconBg: "bg-green-500/15 ring-1 ring-green-500/30",
    icon: "text-green-400",
    button:
      "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-[0_4px_20px_rgba(34,197,94,0.3)]",
  },
  error: {
    iconBg: "bg-red-500/15 ring-1 ring-red-500/30",
    icon: "text-red-400",
    button:
      "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-[0_4px_20px_rgba(239,68,68,0.3)]",
  },
  info: {
    iconBg: "bg-blue-500/15 ring-1 ring-blue-500/30",
    icon: "text-blue-400",
    button:
      "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-[0_4px_20px_rgba(59,130,246,0.3)]",
  },
  warning: {
    iconBg: "bg-yellow-500/15 ring-1 ring-yellow-500/30",
    icon: "text-yellow-400",
    button:
      "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-[0_4px_20px_rgba(234,179,8,0.3)]",
  },
};

export default function Alert({
  type,
  title,
  message,
  confirmText = "OK",
  onConfirm,
  onClose,
}: AlertProps) {
  const Icon = ICONS[type];
  const colors = COLORS[type];

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9998]"
      />

      {/* Alert */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 24 }}
        transition={{ type: "spring", damping: 22, stiffness: 280 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-sm px-4"
      >
        <div className="bg-gray-950/98 backdrop-blur-3xl border border-white/8 rounded-3xl shadow-2xl overflow-hidden">
          {/* Top accent line */}
          <div
            className={`h-0.5 w-full ${colors.button.includes("green") ? "bg-gradient-to-r from-green-500 to-emerald-400" : colors.button.includes("red") ? "bg-gradient-to-r from-red-500 to-rose-400" : colors.button.includes("blue") ? "bg-gradient-to-r from-blue-500 to-indigo-400" : "bg-gradient-to-r from-yellow-500 to-orange-400"}`}
          />
          {/* Header */}
          <div className="relative p-6 pb-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/20 hover:text-white/50 transition-colors w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div
                className={`${colors.iconBg} w-14 h-14 rounded-2xl flex items-center justify-center mb-4`}
              >
                <Icon size={28} className={colors.icon} />
              </div>
              <h3 className="text-white font-black text-xl mb-2 leading-tight">
                {title}
              </h3>
              {message && (
                <p className="text-white/50 text-sm leading-relaxed">
                  {message}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 pt-5">
            <button
              onClick={handleConfirm}
              className={`${colors.button} w-full text-white font-black py-3.5 rounded-2xl transition-all active:scale-95 text-sm`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
