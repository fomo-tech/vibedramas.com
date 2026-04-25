"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";

const GATE_KEY = "vibe-sound-gate-passed";

/**
 * SoundGateModal — shown once per session on MOBILE ONLY before any video plays.
 *
 * The user's tap provides a trusted user gesture that:
 * 1. Unlocks the Web Audio API (AudioContext.resume())
 * 2. Plays+pauses a silent <audio> element (Safari unlock)
 * 3. Sets isMuted=false so all subsequent videos play with sound
 */
export default function SoundGateModal({
  onUnlock,
  forceShow = false,
}: {
  onUnlock: (enableSound: boolean) => void;
  forceShow?: boolean;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // PC → skip gate entirely, auto-unlock
    const isPC = window.matchMedia("(min-width: 1024px)").matches;
    if (isPC) {
      onUnlock(false);
      return;
    }
    // Mobile: force gate on every page entry when requested.
    if (forceShow) {
      setShow(true);
    } else if (!sessionStorage.getItem(GATE_KEY)) {
      setShow(true);
    } else {
      onUnlock(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceShow]);

  const unlockAudio = useCallback(() => {
    try {
      const ctx = new (
        window.AudioContext ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).webkitAudioContext
      )();
      // Store globally so HlsPlayer can resume it later when unmuting
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__vibeAudioContext = ctx;
      ctx.resume().then(() => {
        const buf = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buf;
        source.connect(ctx.destination);
        source.start(0);
      });
    } catch {}

    try {
      const audio = new Audio();
      audio.src =
        "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
      audio.volume = 0.01;
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.remove();
        })
        .catch(() => {});
    } catch {}
  }, []);

  const handleStart = useCallback(
    (withSound: boolean) => {
      unlockAudio();
      sessionStorage.setItem(GATE_KEY, "1");
      setShow(false);
      onUnlock(withSound);
    },
    [unlockAudio, onUnlock],
  );

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-300 flex items-center justify-center bg-black/85"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="flex flex-col items-center gap-5 px-8 py-8 rounded-3xl bg-linear-to-b from-[#1c1208] to-[#0d0a05] border border-[#ff4500]/20 shadow-[0_0_60px_rgba(255,69,0,0.12)] max-w-75 mx-4"
          >
            {/* Animated speaker icon */}
            <motion.div
              animate={{ scale: [1, 1.12, 1] }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut",
              }}
              className="w-20 h-20 rounded-full bg-linear-to-br from-[#ff4500] to-orange-600 flex items-center justify-center shadow-[0_0_30px_rgba(255,69,0,0.4)]"
            >
              <Volume2 className="w-10 h-10 text-white" />
            </motion.div>

            <div className="text-center space-y-2">
              <h3 className="text-white font-black text-lg">Bật âm thanh</h3>
              <p className="text-white/45 text-xs leading-relaxed">
                Xem phim có tiếng để trải nghiệm tốt hơn nhé!
              </p>
            </div>

            {/* Primary: Watch with sound */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleStart(true)}
              className="w-full py-3.5 rounded-2xl bg-linear-to-r from-[#ff4500] to-orange-600 text-white font-bold text-sm shadow-[0_4px_20px_rgba(255,69,0,0.35)] active:shadow-none transition-shadow"
            >
              <span className="flex items-center justify-center gap-2">
                <Volume2 className="w-5 h-5" />
                Xem có tiếng
              </span>
            </motion.button>

            {/* Secondary: Watch muted */}
            <button
              onClick={() => handleStart(false)}
              className="flex items-center justify-center gap-2 text-white/35 text-xs hover:text-white/60 transition-colors py-1"
            >
              <VolumeX className="w-3.5 h-3.5" />
              Xem không tiếng
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
