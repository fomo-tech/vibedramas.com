"use client";

import { motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

export interface ConfirmProps {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
  onClose: () => void;
}

const VARIANTS = {
  danger: {
    iconBg: "bg-red-500/15 ring-1 ring-red-500/30",
    icon: "text-red-400",
    topBar: "bg-gradient-to-r from-red-500 to-rose-500",
    confirmButton:
      "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-[0_4px_20px_rgba(239,68,68,0.3)]",
  },
  warning: {
    iconBg: "bg-yellow-500/15 ring-1 ring-yellow-500/30",
    icon: "text-yellow-400",
    topBar: "bg-gradient-to-r from-yellow-500 to-orange-500",
    confirmButton:
      "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-[0_4px_20px_rgba(234,179,8,0.3)]",
  },
  primary: {
    iconBg: "bg-vibe-pink/15 ring-1 ring-vibe-pink/30",
    icon: "text-vibe-pink",
    topBar: "bg-gradient-to-r from-vibe-pink via-orange-500 to-rose-500",
    confirmButton:
      "bg-gradient-to-r from-vibe-pink via-orange-500 to-rose-500 hover:opacity-90 shadow-[0_4px_20px_rgba(255,40,120,0.3)]",
  },
};

export default function Confirm({
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  variant = "danger",
  onConfirm,
  onCancel,
  onClose,
}: ConfirmProps) {
  const colors = VARIANTS[variant];

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onCancel();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleCancel}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9998]"
      />

      {/* Confirm Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 24 }}
        transition={{ type: "spring", damping: 22, stiffness: 280 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-sm px-4"
      >
        <div className="bg-gray-950/98 backdrop-blur-3xl border border-white/8 rounded-3xl shadow-2xl overflow-hidden">
          {/* Top accent */}
          <div className={`h-0.5 w-full ${colors.topBar}`} />

          {/* Header */}
          <div className="relative p-6 pb-0">
            <button
              onClick={handleCancel}
              className="absolute top-4 right-4 text-white/20 hover:text-white/50 transition-colors w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div
                className={`${colors.iconBg} w-14 h-14 rounded-2xl flex items-center justify-center mb-4`}
              >
                <AlertTriangle size={26} className={colors.icon} />
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
          <div className="p-6 pt-5 flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 bg-white/5 hover:bg-white/8 border border-white/8 text-white/70 hover:text-white font-bold py-3.5 rounded-2xl transition-all active:scale-95 text-sm"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`${colors.confirmButton} flex-1 text-white font-black py-3.5 rounded-2xl transition-all active:scale-95 text-sm`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
