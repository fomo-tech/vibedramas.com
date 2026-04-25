"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, type LucideIcon } from "lucide-react";
import { useWindowSize } from "@/hooks/useWindowSize";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConfirmSheetProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "default" = orange gradient | "danger" = red */
  variant?: "default" | "danger";
  loading?: boolean;
  /** Optional icon override */
  icon?: LucideIcon;
  /** Extra content rendered below description, above buttons */
  children?: React.ReactNode;
}

// ─── Colours ──────────────────────────────────────────────────────────────────

const VARIANT = {
  default: {
    btnBg: "linear-gradient(135deg, #FF4500 0%, #FF6B2B 100%)",
    btnShadow: "0 8px 24px rgba(255,69,0,0.35)",
    iconBg: "rgba(255,69,0,0.12)",
    iconColor: "#FF4500",
  },
  danger: {
    btnBg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    btnShadow: "0 8px 24px rgba(239,68,68,0.35)",
    iconBg: "rgba(239,68,68,0.12)",
    iconColor: "#ef4444",
  },
};

// ─── Inner content (shared between modal + drawer) ────────────────────────────

function Inner({
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  variant = "default",
  loading = false,
  icon: IconProp,
  children,
  onClose,
  onConfirm,
}: Omit<ConfirmSheetProps, "open">) {
  const v = VARIANT[variant];
  const Icon: LucideIcon =
    IconProp ?? (variant === "danger" ? AlertTriangle : AlertTriangle);
  const showIcon = Boolean(IconProp) || variant === "danger";

  return (
    <div className="bg-[#111] border border-white/8 rounded-t-3xl lg:rounded-3xl overflow-hidden">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

      {/* Drag handle (mobile only) */}
      <div className="lg:hidden flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-white/15" />
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/8 hover:bg-white/14 flex items-center justify-center text-white/40 hover:text-white transition-all"
      >
        <X size={15} />
      </button>

      <div className="px-6 pt-5 pb-7 lg:pt-6">
        {/* Icon + texts */}
        <div className="flex flex-col items-center text-center mb-6">
          {showIcon && (
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: v.iconBg }}
            >
              <Icon size={26} style={{ color: v.iconColor }} />
            </div>
          )}
          <h2 className="text-white font-black text-xl tracking-tight leading-snug">
            {title}
          </h2>
          {description && (
            <p className="text-white/40 text-sm mt-2 leading-relaxed max-w-xs">
              {description}
            </p>
          )}
        </div>

        {/* Custom content slot */}
        {children && <div className="mb-6">{children}</div>}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3.5 rounded-2xl font-black text-sm text-white/60 border border-white/10 hover:bg-white/6 hover:text-white/80 transition-all disabled:opacity-40"
          >
            {cancelLabel}
          </button>
          <motion.button
            onClick={onConfirm}
            disabled={loading}
            whileTap={loading ? {} : { scale: 0.97 }}
            className="flex-1 py-3.5 rounded-2xl font-black text-sm text-white transition-all disabled:opacity-50 relative overflow-hidden"
            style={{
              background: v.btnBg,
              boxShadow: v.btnShadow,
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Đang xử lý...
              </span>
            ) : (
              confirmLabel
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ConfirmSheet(props: ConfirmSheetProps) {
  const { open, onClose } = props;
  const { width } = useWindowSize();
  const isDesktop = (width ?? 0) >= 1024;

  if (isDesktop) {
    return (
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-400 bg-black/70 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 z-401 flex items-center justify-center pointer-events-none px-4"
            >
              <div className="pointer-events-auto w-full max-w-sm relative">
                <Inner {...props} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-400 bg-black/60"
            onClick={onClose}
          />
          <motion.div
            key="drawer"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-0 left-0 right-0 z-401 relative"
          >
            <Inner {...props} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
