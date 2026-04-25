"use client";

import { AnimatePresence, motion } from "framer-motion";

interface EpisodeRailVisibilityProps {
  motionKey: string;
  visible: boolean;
  children: React.ReactNode;
}

export default function EpisodeRailVisibility({
  motionKey,
  visible,
  children,
}: EpisodeRailVisibilityProps) {
  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        key={motionKey}
        initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
        animate={{
          opacity: visible ? 1 : 0,
          y: visible ? 0 : 8,
          filter: "blur(0px)",
        }}
        exit={{ opacity: 0, y: -14, filter: "blur(4px)" }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
