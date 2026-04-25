"use client";

import React from "react";
import {
  Home,
  PlaySquare,
  LayoutGrid,
  Clock,
  Heart,
  User,
  Crown,
  Search,
  CheckCircle2,
  Timer,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

interface SidebarProps {
  activeTab?: "home" | "foryou";
  onTabChange?: (tab: "home" | "foryou") => void;
}

export default function Sidebar({
  activeTab = "home",
  onTabChange,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, vipStatus, vipExpiry, openLoginModal } = useAuthStore();

  // ✅ mounted guard: tránh Zustand persist (localStorage) gây mismatch server/client
  const [mounted, setMounted] = React.useState(false);
  const [now, setNow] = React.useState(0);

  React.useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setMounted(true);
      setNow(Date.now());
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const isActiveVip =
    mounted &&
    !!vipStatus &&
    !!vipExpiry &&
    new Date(vipExpiry).getTime() > now;

  React.useEffect(() => {
    if (!mounted || !isActiveVip) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [mounted, isActiveVip]);

  const formatCountdown = (target: string | null | undefined) => {
    if (!target) return null;
    const remainingMs = new Date(target).getTime() - now;
    if (remainingMs <= 0) return "Đã hết hạn";

    const totalSeconds = Math.floor(remainingMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600)
      .toString()
      .padStart(2, "0");
    const minutes = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");

    return days > 0
      ? `${days} ngày ${hours}:${minutes}:${seconds}`
      : `${hours}:${minutes}:${seconds}`;
  };

  const countdownLabel = formatCountdown(vipExpiry);

  const navGroups = [
    {
      label: "Điều hướng",
      items: [
        {
          id: "home",
          label: "Trang chủ",
          icon: Home,
          href: "/",
          tab: "home" as const,
        },
        {
          id: "foryou",
          label: "Đề xuất",
          icon: PlaySquare,
          href: "/foryou",
          tab: "foryou" as const,
        },
      ],
    },
    {
      label: "Khám phá",
      items: [
        { id: "search", label: "Tìm kiếm", icon: Search, href: "/search" },
        { id: "all", label: "Tất cả phim", icon: LayoutGrid, href: "/all" },
      ],
    },
    {
      label: "Thư viện",
      items: [
        { id: "history", label: "Lịch sử", icon: Clock, href: "/history" },
        { id: "liked", label: "Yêu thích", icon: Heart, href: "/liked" },
      ],
    },
  ];

  const renderItem = (item: {
    id: string;
    label: string;
    icon: React.ElementType;
    tab?: "home" | "foryou";
    href?: string;
  }) => {
    // Ưu tiên check pathname trước, sau đó mới check tab
    const isActive = item.href
      ? pathname === item.href || pathname.startsWith(item.href + "/")
      : item.tab
        ? activeTab === item.id
        : false;

    const cls = `w-full group flex items-center space-x-2.5 xl:space-x-4 px-3 xl:px-5 py-2.5 xl:py-3.5 rounded-2xl transition-all duration-300 relative ${
      isActive
        ? "bg-vibe-pink/15 text-white"
        : "text-white/40 hover:bg-white/5 hover:text-white"
    }`;

    const inner = (
      <>
        <div className="relative shrink-0">
          <item.icon
            size={17}
            className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-vibe-pink" : ""}`}
          />
        </div>
        <span className="font-bold text-[13px] xl:text-sm tracking-wide truncate">
          {item.label}
        </span>
        {isActive && (
          <motion.div
            layoutId="sidebarActiveIndicator"
            className="absolute right-0 w-1 h-6 bg-vibe-pink rounded-full shadow-[0_0_20px_rgba(223,36,255,1)]"
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
          />
        )}
      </>
    );

    if (item.href)
      return (
        <Link key={item.id} href={item.href} className={cls}>
          {inner}
        </Link>
      );
    if (item.tab)
      return (
        <button
          key={item.id}
          onClick={() => onTabChange?.(item.tab!)}
          className={cls}
        >
          {inner}
        </button>
      );
    return (
      <button key={item.id} className={cls}>
        {inner}
      </button>
    );
  };

  return (
    <aside className="hidden lg:flex flex-col w-56 xl:w-72 h-screen fixed top-0 left-0 bg-black/60 backdrop-blur-2xl border-r border-white/5 px-3 xl:px-6 py-5 xl:py-8 z-60">
      {/* Brand */}
      <div className="px-1.5 xl:px-3 mb-5 xl:mb-8 flex items-center gap-2 xl:gap-3">
        <div className="w-10 h-10 xl:w-11 xl:h-11 rounded-2xl bg-zinc-950 border border-vibe-pink/30 shadow-[0_0_20px_rgba(255,69,0,0.25)] flex items-center justify-center shrink-0">
          <span className="text-lg xl:text-xl font-black italic tracking-tighter text-white leading-none">
            V<span className="text-vibe-pink">D</span>
          </span>
        </div>
        <span className="hidden xl:inline text-xl xl:text-2xl font-black tracking-tighter text-white">
          Vibe<span className="text-vibe-pink">Drama</span>
        </span>
        <span className="xl:hidden text-base font-black tracking-tight text-white/90">
          Vibe
        </span>
      </div>

      {/* CTA: đúng logic tính năng theo trạng thái người dùng */}
      <div className="mx-0.5 xl:mx-1 mb-4 xl:mb-6 space-y-2">
        {!mounted ? null : (
          <>
            <Link href="/vip" className="block">
              <div
                className={`rounded-2xl p-3 xl:p-4 relative overflow-hidden border transition-all duration-300 ${
                  isActiveVip
                    ? "bg-linear-to-br from-[#1a0f09] via-zinc-900/90 to-[#1b120a] border-orange-400/35 hover:border-orange-300/65"
                    : "bg-linear-to-br from-[#1a0a07] via-zinc-900/85 to-[#1a0f05] border-vibe-pink/25 hover:border-orange-400/65"
                }`}
              >
                <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full bg-vibe-pink/18 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-6 -left-5 w-20 h-20 rounded-full bg-orange-500/18 blur-2xl pointer-events-none" />

                <div className="relative flex items-start gap-3">
                  <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-xl bg-linear-to-br from-vibe-pink to-orange-500 flex items-center justify-center shrink-0 shadow-[0_0_14px_rgba(255,69,0,0.35)]">
                    <Crown size={15} className="text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-white font-black text-xs xl:text-sm tracking-tight truncate">
                        {isActiveVip ? "Cấp hộp quà" : "Nâng cấp hộp quà"}
                      </p>

                      {isActiveVip && (
                        <span className="hidden xl:inline-flex shrink-0 items-center gap-0.5 bg-orange-500/20 border border-orange-400/35 text-orange-200 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">
                          <CheckCircle2 size={7} />
                          Đang dùng
                        </span>
                      )}
                    </div>

                    <p className="text-white/55 text-[10px] xl:text-[11px] mt-1 leading-tight">
                      {isActiveVip
                        ? ""
                        : "Tăng bậc hộp quà để nhận nhiều xu hơn"}
                    </p>

                    {isActiveVip && countdownLabel && (
                      <p className="text-white/60 text-[10px] mt-1.5 flex items-center gap-1">
                        <Timer size={9} className="text-orange-300/80" />
                        Hết hạn sau {countdownLabel}
                      </p>
                    )}
                  </div>
                </div>

                <div className="relative mt-2.5 w-full py-1.5 rounded-lg text-center text-[10px] xl:text-[11px] font-black tracking-widest uppercase border transition-all duration-300 bg-linear-to-r from-vibe-pink to-orange-500 text-white border-transparent">
                  {isActiveVip ? "Gia hạn" : "Tăng quà ngay"}
                </div>
              </div>
            </Link>

            {!user && (
              <button
                onClick={openLoginModal}
                className="w-full rounded-xl border border-white/12 bg-white/4 hover:bg-white/8 px-3 py-2 text-left transition-all"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-vibe-pink" />
                  <p className="text-[11px] font-bold text-white/90">
                    Đăng nhập để mở đầy đủ tính năng kiếm xu
                  </p>
                </div>
              </button>
            )}
          </>
        )}
      </div>

      {/* Nav Groups */}
      <div className="flex-1 space-y-5 xl:space-y-6 overflow-y-auto scrollbar-hide">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-2.5 xl:px-4 text-[10px] font-black uppercase tracking-[0.16em] xl:tracking-[0.3em] text-white/25 mb-2">
              {group.label}
            </p>
            {group.items.map(renderItem)}
          </div>
        ))}
      </div>

      {/* User */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <Link
          href="/profile"
          className={`w-full group flex items-center space-x-2.5 xl:space-x-4 px-3 xl:px-5 py-2.5 xl:py-3.5 rounded-2xl transition-all duration-300 relative ${
            pathname === "/profile"
              ? "bg-vibe-pink/15 text-white"
              : "text-white/40 hover:bg-white/5 hover:text-white"
          }`}
        >
          <User
            size={17}
            className={`transition-transform duration-300 group-hover:scale-110 ${pathname === "/profile" ? "text-vibe-pink" : ""}`}
          />
          <span className="font-bold text-[13px] xl:text-sm tracking-wide">
            User
          </span>
          {pathname === "/profile" && (
            <motion.div
              layoutId="sidebarActiveIndicator"
              className="absolute right-0 w-1 h-6 bg-vibe-pink rounded-full shadow-[0_0_20px_rgba(223,36,255,1)]"
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
          )}
        </Link>
      </div>

      {/* Neon right-edge glow */}
      <div className="absolute top-0 right-0 w-px h-full bg-vibe-pink/20 shadow-[0_0_15px_rgba(223,36,255,0.3)]" />
    </aside>
  );
}
