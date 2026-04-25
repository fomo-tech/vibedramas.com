"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, Sparkles, Play, Crown } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

const PERKS = [
  { icon: Play, text: "Xem phim không giới hạn" },
  { icon: Crown, text: "Ưu đãi hội viên VIP" },
  { icon: ShieldCheck, text: "Lưu lịch sử & yêu thích" },
  { icon: Sparkles, text: "Đề xuất cá nhân hoá" },
];

export default function LoginModal() {
  const { isLoginModalOpen, closeLoginModal } = useAuthStore();

  const handleGoogleLogin = () => {
    const callbackPath = `${window.location.pathname}${window.location.search}`;
    const params = new URLSearchParams({ callback: callbackPath });
    window.location.href = `/api/auth/google?${params.toString()}`;
  };

  return (
    <AnimatePresence>
      {isLoginModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-300 bg-black/70 backdrop-blur-md"
            onClick={closeLoginModal}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{
              type: "spring",
              damping: 26,
              stiffness: 220,
              mass: 0.8,
            }}
            className="fixed bottom-0 left-0 right-0 z-301 lg:inset-0 lg:flex lg:items-center lg:justify-center pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full lg:w-105 rounded-t-3xl lg:rounded-3xl bg-[#0e0e0e] border border-white/8 overflow-hidden shadow-[0_-20px_80px_rgba(0,0,0,0.8)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top accent */}
              <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-vibe-pink/60 to-transparent" />

              {/* Drag handle */}
              <div className="lg:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/15" />
              </div>

              {/* Close button */}
              <button
                onClick={closeLoginModal}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/8 hover:bg-white/12 flex items-center justify-center text-white/40 hover:text-white transition-all"
              >
                <X size={16} />
              </button>

              <div className="px-6 pt-4 pb-8 lg:pt-6">
                {/* Header */}
                <div className="text-center mb-6">
                  {/* Logo mark */}
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-950 border border-vibe-pink/30 mb-4 shadow-[0_0_30px_rgba(255,69,0,0.3)]">
                    <span className="text-2xl font-black italic text-white tracking-tighter leading-none">
                      V<span className="text-vibe-pink">D</span>
                    </span>
                  </div>
                  <h2 className="text-white font-black text-2xl tracking-tighter leading-none">
                    Đăng nhập
                  </h2>
                  <p className="text-white/35 text-sm mt-1.5">
                    Tận hưởng trải nghiệm cá nhân hoá
                  </p>
                </div>

                {/* Perks */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {PERKS.map(({ icon: Icon, text }) => (
                    <div
                      key={text}
                      className="flex items-center gap-2 bg-white/4 border border-white/6 rounded-xl px-3 py-2.5"
                    >
                      <div className="w-6 h-6 rounded-lg bg-vibe-pink/15 flex items-center justify-center shrink-0">
                        <Icon size={12} className="text-vibe-pink/80" />
                      </div>
                      <span className="text-white/55 text-[11px] font-semibold leading-tight">
                        {text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Google button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-white/90 active:bg-white/80 text-[#1a1a1a] font-bold text-base rounded-2xl py-3.5 transition-all shadow-[0_4px_24px_rgba(255,255,255,0.12)] relative overflow-hidden group"
                >
                  {/* Shine sweep */}
                  <motion.div
                    className="absolute inset-0 bg-linear-to-r from-transparent via-black/5 to-transparent -translate-x-full"
                    animate={{ translateX: ["−100%", "200%"] }}
                    transition={{
                      repeat: Infinity,
                      duration: 2.5,
                      ease: "linear",
                    }}
                  />
                  {/* Google icon */}
                  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Tiếp tục với Google
                </motion.button>

                {/* Terms */}
                <p className="text-center text-white/18 text-[10px] mt-4 leading-relaxed">
                  Bằng cách đăng nhập, bạn đồng ý với{" "}
                  <span className="text-white/35 underline cursor-pointer">
                    Điều khoản dịch vụ
                  </span>{" "}
                  và{" "}
                  <span className="text-white/35 underline cursor-pointer">
                    Chính sách bảo mật
                  </span>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
