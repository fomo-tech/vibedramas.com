"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface BaseModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
}

const SIZE_CLASSES = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export default function BaseModal({
  open,
  onClose,
  title,
  children,
  className = "",
  showCloseButton = true,
  size = "md",
  loading = false,
}: BaseModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setShouldRender(true);
      // Trigger animation after render
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      // Wait for exit animation before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
        document.body.style.overflow = "";
      }, 280);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!mounted || !shouldRender) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-500 bg-black/70 backdrop-blur-sm transition-all duration-280 ease-in-out"
        style={{
          opacity: isVisible ? 1 : 0,
        }}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-501 flex items-center justify-center p-4 pointer-events-none">
        <div
          onClick={(e) => e.stopPropagation()}
          className={`pointer-events-auto w-full ${SIZE_CLASSES[size]} bg-linear-to-b from-zinc-900 to-black rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.7)] max-h-[90vh] flex flex-col transition-all duration-280 ease-in-out ${className}`}
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible
              ? "scale(1) translateY(0)"
              : "scale(0.95) translateY(12px)",
          }}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10 shrink-0">
              {title && (
                <h3 className="text-lg font-black text-white tracking-tight">
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="ml-auto h-9 w-9 rounded-full bg-white/8 hover:bg-white/15 text-white/70 hover:text-white transition-all flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain relative">
            {loading ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="h-10 w-10 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              </div>
            ) : (
              children
            )}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
