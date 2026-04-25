"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen() {
  const [phase, setPhase] = useState<"enter" | "exit" | "hidden">("enter");

  useEffect(() => {
    const dismiss = () => {
      setPhase((p) => {
        if (p === "exit" || p === "hidden") return p;
        return "exit";
      });
      setTimeout(() => setPhase("hidden"), 500);
    };

    // Wait for DOM fully loaded (all images, fonts, scripts, iframes)
    if (document.readyState === "complete") {
      // Already loaded — minimum 800ms so user sees the splash
      const t = setTimeout(dismiss, 800);
      return () => clearTimeout(t);
    } else {
      const minTimer = setTimeout(() => {
        // After minimum display time, check if page loaded
        if (document.readyState === "complete") {
          dismiss();
        }
      }, 800);
      const fallback = setTimeout(dismiss, 5000); // 5s hard cap
      const onLoad = () => {
        // Ensure minimum 800ms display
        const elapsed = performance.now();
        const remaining = Math.max(0, 800 - elapsed);
        setTimeout(dismiss, remaining);
      };
      window.addEventListener("load", onLoad, { once: true });
      return () => {
        clearTimeout(minTimer);
        clearTimeout(fallback);
        window.removeEventListener("load", onLoad);
      };
    }
  }, []);

  return (
    <AnimatePresence>
      {(phase === "enter" || phase === "exit") && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="fixed inset-0 z-99999 flex flex-col items-center justify-center"
          style={{ background: "#000" }}
        >
          {/* Ambient glow — like iOS splash radial */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 55% 40% at 50% 55%, rgba(255,69,0,0.13) 0%, transparent 70%)",
            }}
          />

          {/* App icon — bounces in once */}
          <motion.div
            initial={{ scale: 0.72, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 22,
              delay: 0.05,
            }}
            className="relative flex flex-col items-center gap-5"
          >
            {/* Icon */}
            <div
              className="w-[96px] h-[96px] rounded-[26px] flex items-center justify-center"
              style={{
                background: "linear-gradient(145deg,#1a0a06 0%,#0d0d0d 100%)",
                boxShadow:
                  "0 0 0 1px rgba(255,69,0,0.3), 0 0 48px rgba(255,69,0,0.25), 0 12px 40px rgba(0,0,0,0.7)",
              }}
            >
              <span
                className="font-black italic tracking-tighter leading-none select-none"
                style={{ fontSize: 44, color: "#fff" }}
              >
                V<span style={{ color: "#FF4500" }}>D</span>
              </span>
            </div>

            {/* Wordmark */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.4, ease: "easeOut" }}
              className="flex items-baseline gap-0 select-none"
            >
              <span className="text-white font-black text-2xl tracking-tight">
                Vibe
              </span>
              <span
                className="font-black text-2xl tracking-tight"
                style={{ color: "#FF4500" }}
              >
                Drama
              </span>
            </motion.div>
          </motion.div>

          {/* Bottom tagline — fades in last */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="absolute bottom-16 text-white text-[11px] font-medium tracking-widest uppercase"
          >
            Phim ngắn · Kiếm xu · Nhận thưởng
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
