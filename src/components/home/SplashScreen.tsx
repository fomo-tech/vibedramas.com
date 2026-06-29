"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

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

          {/* Brand — bounces in once */}
          <motion.div
            initial={{ scale: 0.72, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 22,
              delay: 0.05,
            }}
            className="relative flex flex-col items-center"
          >
            <Image
              src="/icons/phim-ngan-hay-logo-alpha.png"
              alt="Phim Ngắn Hay"
              width={908}
              height={299}
              priority
              className="h-auto w-72 max-w-[82vw] select-none drop-shadow-[0_0_28px_rgba(255,69,0,0.25)]"
            />
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
