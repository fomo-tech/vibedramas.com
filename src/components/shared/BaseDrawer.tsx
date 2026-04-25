"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BaseDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  loading?: boolean;
}

const drawerVariants = {
  hidden: { y: "100%" },
  visible: { y: 0 },
  exit: { y: "100%" },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export default function BaseDrawer({
  open,
  onClose,
  title,
  children,
  className = "",
  showCloseButton = true,
  loading = false,
}: BaseDrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleDragEnd = useCallback(
    (_: unknown, info: { velocity: { y: number }; offset: { y: number } }) => {
      // Close if swiped down fast or dragged more than 30% of drawer height
      if (info.velocity.y > 300 || info.offset.y > 150) {
        onClose();
      }
    },
    [onClose],
  );

  if (!mounted) return null;

  const drawerContent = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="drawer-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-500 bg-black/70"
            onClick={onClose}
          />

          {/* Drawer Container */}
          <div className="fixed inset-x-0 bottom-0 z-501 pointer-events-none">
            <motion.div
              key="drawer-panel"
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 320,
                mass: 0.8,
              }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={handleDragEnd}
              onClick={(e) => e.stopPropagation()}
              className={`pointer-events-auto w-full bg-linear-to-b from-zinc-900 to-black rounded-t-3xl border border-white/10 border-b-0 shadow-[0_-20px_50px_rgba(0,0,0,0.6)] max-h-[92vh] flex flex-col ${className}`}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-9 h-1 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between px-5 pb-3 border-b border-white/10 shrink-0">
                  {title && (
                    <h3 className="text-base font-black text-white tracking-tight">
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
              <div className="flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)] relative">
                {loading ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
                    <div className="h-10 w-10 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  </div>
                ) : (
                  children
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(drawerContent, document.body);
}
