"use client";

import { Search, LogOut, User, ChevronDown, Download } from "lucide-react";
import CoinIcon from "@/components/ui/CoinIcon";
import UserAvatar from "@/components/shared/UserAvatar";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { usePWA } from "@/components/PWAInstallPrompt";

interface HeaderProps {
  activeTab?: "home" | "foryou";
  onTabChange?: (tab: "home" | "foryou") => void;
}

export default function Header({
  activeTab = "home",
  onTabChange,
}: HeaderProps) {
  const isFeed = activeTab === "foryou";
  const { user, coins, logout, openLoginModal } = useAuthStore();
  const { showInstallModal, canInstall } = usePWA();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Keep server markup and first client render identical before persisted state hydrates.
  useEffect(() => {
    setMounted(true);
  }, []);

  const resolvedUser = mounted ? user : null;
  const resolvedCoins = mounted ? coins : 0;
  const canShowInstall = mounted && canInstall;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <motion.header
      initial={false}
      animate={{
        backgroundColor: isFeed ? "rgba(0,0,0,0)" : "rgba(0,0,0,0.5)",
        backdropFilter: isFeed ? "blur(0px)" : "blur(24px)",
        borderBottom: isFeed
          ? "1px solid rgba(255,255,255,0)"
          : "1px solid rgba(255,255,255,0.05)",
      }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className={`fixed top-0 left-0 right-0 z-50 flex items-center pt-[env(safe-area-inset-top)] ${
        isFeed
          ? "h-[calc(3.5rem+env(safe-area-inset-top))] lg:hidden px-4"
          : "h-[calc(3.5rem+env(safe-area-inset-top))] lg:h-16 px-4 lg:px-8"
      }`}
    >
      <div className="w-full flex items-center justify-between max-w-480 mx-auto">
        {/* ── Left: Logo ─────────────────────────────────────────── */}
        <div className="flex-1 flex items-center">
          <Link href="/" className="flex items-center group">
            <div className="flex items-center gap-2.5 transition-transform duration-300 group-hover:scale-105">
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-2xl bg-zinc-950 border border-vibe-pink/30 shadow-[0_0_18px_rgba(255,69,0,0.25)] flex items-center justify-center">
                <span className="text-base lg:text-lg font-black italic tracking-tighter text-white leading-none">
                  V<span className="text-vibe-pink">D</span>
                </span>
              </div>
              <span className="hidden lg:block text-xl font-black tracking-tighter text-white">
                Vibe<span className="text-vibe-pink">Drama</span>
              </span>
            </div>
          </Link>
        </div>

        {/* ── Right: Actions ──────────────────────────────────────── */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Download button - Mobile only, when installable */}
          {canShowInstall && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={showInstallModal}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-linear-to-r from-vibe-pink/20 to-orange-500/20 border border-vibe-pink/40 hover:border-vibe-pink/60 transition-all group"
            >
              <Download
                className="w-3.5 h-3.5 text-vibe-pink"
                strokeWidth={2.5}
              />
              <span className="text-[10px] font-black text-white/90 tracking-wide">
                Tải
              </span>
            </motion.button>
          )}

          {/* Search - Show on all screen sizes */}
          <Link href="/search">
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.93 }}
              className="flex p-2 rounded-xl bg-white/5 border border-white/6 hover:border-vibe-pink/40 hover:bg-white/8 transition-all cursor-pointer group"
            >
              <Search className="w-4.5 h-4.5 text-white/45 group-hover:text-vibe-pink transition-colors duration-200" />
            </motion.div>
          </Link>

          {resolvedUser ? (
            <>
              {/* Coins pill */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 hover:border-amber-500/45 transition-all"
              >
                <CoinIcon size={15} />
                <span className="text-[11px] font-black text-amber-300 tabular-nums">
                  {resolvedCoins.toLocaleString("vi-VN")}
                </span>
              </motion.div>

              {/* User menu */}
              <div ref={menuRef} className="relative">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 pl-0.5 pr-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 hover:border-vibe-pink/35 hover:bg-white/8 transition-all group"
                >
                  {/* Avatar */}
                  <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full overflow-hidden border border-white/15 shrink-0">
                    <UserAvatar
                      name={resolvedUser.name}
                      avatar={resolvedUser.avatar}
                      size={32}
                    />
                  </div>

                  {/* Name — desktop only */}
                  <div className="hidden lg:flex flex-col items-start min-w-0">
                    <span className="text-[11px] font-black text-white leading-none truncate max-w-20">
                      {resolvedUser.name.split(" ").slice(-1)[0]}
                    </span>
                    <span className="text-[9px] font-bold text-vibe-pink/70 uppercase tracking-widest leading-none mt-0.5">
                      Thành viên
                    </span>
                  </div>

                  <ChevronDown
                    className={`hidden lg:block w-3 h-3 text-white/30 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
                  />
                </motion.button>

                {/* Dropdown */}
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.96 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="absolute right-0 top-[calc(100%+8px)] w-56 rounded-2xl bg-zinc-950/95 border border-white/8 shadow-[0_16px_48px_rgba(0,0,0,0.7)] backdrop-blur-xl overflow-hidden z-50"
                    >
                      {/* User info header */}
                      <div className="px-4 py-3.5 border-b border-white/6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden border border-white/15 shrink-0">
                            <UserAvatar
                              name={resolvedUser.name}
                              avatar={resolvedUser.avatar}
                              size={36}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-white truncate leading-tight">
                              {resolvedUser.name}
                            </p>
                            <p className="text-[10px] text-white/35 truncate mt-0.5">
                              {resolvedUser.email}
                            </p>
                          </div>
                        </div>

                        {/* Coins in dropdown */}
                        <div className="mt-3 flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500/8 border border-amber-500/15">
                          <div className="flex items-center gap-1.5">
                            <CoinIcon size={14} />
                            <span className="text-[11px] font-black text-amber-300">
                              {resolvedCoins.toLocaleString("vi-VN")} xu
                            </span>
                          </div>
                          <span className="text-[9px] font-bold text-amber-500/60 uppercase tracking-wider">
                            Số dư
                          </span>
                        </div>
                      </div>

                      {/* Menu items */}
                      <div className="p-2">
                        <Link
                          href="/profile"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                        >
                          <User className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                          <span className="text-sm font-bold text-white/60 group-hover:text-white transition-colors">
                            Trang cá nhân
                          </span>
                        </Link>

                        <div className="my-1.5 h-px bg-white/5" />

                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 transition-colors group"
                        >
                          <LogOut className="w-4 h-4 text-white/35 group-hover:text-red-400 transition-colors" />
                          <span className="text-sm font-bold text-white/50 group-hover:text-red-400 transition-colors">
                            Đăng xuất
                          </span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            /* Login button */
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={openLoginModal}
              className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-vibe-pink text-white text-[13px] font-black tracking-wide shadow-[0_0_18px_rgba(255,69,0,0.35)] hover:shadow-[0_0_26px_rgba(255,69,0,0.55)] transition-all overflow-hidden group"
            >
              {/* shine sweep */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-600 bg-linear-to-r from-transparent via-white/20 to-transparent" />
              <User className="w-3.5 h-3.5" />
              <span>Đăng nhập</span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
