"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-2147483000 overflow-hidden bg-black flex items-center justify-center">
      <div className="absolute inset-0 vibe-loader-grid opacity-40" />

      <div className="relative flex flex-col items-center gap-5">
        <motion.div
          initial={{ scale: 0.84, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-24 h-24"
        >
          <div className="absolute inset-0 rounded-full vibe-loader-ring" />
          <div className="absolute inset-2 rounded-full vibe-loader-ring-delay" />
          <div className="absolute inset-0 flex items-center justify-center text-orange-300 text-xs font-black tracking-[0.22em]">
            VIBE
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.08, duration: 0.32 }}
          className="text-center"
        >
          <p className="text-white text-sm font-black tracking-[0.24em]">
            VIBE DRAMA
          </p>
          <p className="mt-1 text-orange-200/70 text-[11px] font-semibold tracking-[0.14em] uppercase">
            Dang tai trai nghiem
          </p>
        </motion.div>
      </div>
    </div>
  );
}
