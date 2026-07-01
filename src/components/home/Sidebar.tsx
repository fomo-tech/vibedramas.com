"use client";

import React from "react";
import {
  Home,
  PlaySquare,
  LayoutGrid,
  Clock,
  Heart,
  User,
  Gift,
  Search,
  Sparkles,
  ChevronRight,
  Trophy,
  Coins,
} from "lucide-react";

import Link from "next/link";
import Image from "next/image";
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
  const { user, coins, giftLevel, vipStatus, openLoginModal } = useAuthStore();
  const LEVEL_NAMES = ["", "Khán Giả", "Hâm Mộ", "Tri Kỷ", "Trưởng Lão", "Phú Hộ"];
  const levelName = LEVEL_NAMES[giftLevel] || LEVEL_NAMES[1];
  const formattedCoins = Number(coins || 0).toLocaleString("vi-VN");

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
          <div className="absolute right-0 w-1 h-6 bg-vibe-pink rounded-full shadow-[0_0_20px_rgba(223,36,255,1)]" />
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
      <div className="px-1.5 xl:px-3 mb-5 xl:mb-8 flex items-center">
        <Link href="/" aria-label="Phim Ngắn Hay - Trang chủ">
          <Image
            src="/icons/phim-ngan-hay-logo-alpha.png"
            alt="Phim Ngắn Hay"
            width={908}
            height={299}
            priority
            className="h-auto w-40 xl:w-48"
          />
        </Link>
      </div>

      {/* Watch rewards */}
      <div className="mx-0.5 xl:mx-1 mb-4 xl:mb-6">
        {!user ? (
          /* Guest state: Premium Loyalty Card */
          <div className="rounded-2xl p-3.5 xl:p-4 relative overflow-hidden border transition-all duration-300 bg-linear-to-br from-[#1c0d0a]/90 via-[#0f0e12]/95 to-[#1c120a]/90 border-orange-500/20 hover:border-orange-500/40 shadow-lg group">
            {/* Background gradient flares */}
            <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-vibe-pink/15 blur-2xl pointer-events-none group-hover:bg-vibe-pink/25 transition-all duration-500" />
            <div className="absolute -bottom-12 -left-10 w-24 h-24 rounded-full bg-orange-500/15 blur-2xl pointer-events-none group-hover:bg-orange-500/25 transition-all duration-500" />

            <div className="relative flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-linear-to-br from-vibe-pink to-orange-500 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(255,69,0,0.3)] group-hover:scale-105 transition-transform duration-300">
                <Gift size={16} className="text-white animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-extrabold text-xs xl:text-sm tracking-tight leading-tight">
                  Phúc Lợi Xem Phim
                </h3>
                <p className="text-white/40 text-[10px] mt-0.5 font-medium leading-none">
                  Tích lũy quà tặng & EXP
                </p>
              </div>
            </div>

            {/* Perks list */}
            <div className="relative mt-3 space-y-1.5 border-t border-white/5 pt-3">
              <div className="flex items-center gap-2 text-white/70 text-[10px] xl:text-[11px]">
                <Coins size={11} className="text-vibe-pink shrink-0" />
                <span className="truncate">Nhận xu miễn phí mỗi tập</span>
              </div>
              <div className="flex items-center gap-2 text-white/70 text-[10px] xl:text-[11px]">
                <Gift size={11} className="text-orange-400 shrink-0" />
                <span className="truncate">Mở hộp quà VIP nhận thưởng</span>
              </div>
            </div>

            {/* Login CTA Button */}
            <button
              onClick={openLoginModal}
              className="relative mt-3.5 w-full py-2 rounded-xl text-center text-[10px] xl:text-xs font-black tracking-wider uppercase bg-linear-to-r from-vibe-pink to-orange-500 text-white cursor-pointer shadow-[0_4px_12px_rgba(255,69,0,0.2)] hover:shadow-[0_4px_16px_rgba(255,69,0,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              Đăng Nhập Nhận Quà
            </button>
          </div>
        ) : (
          /* Logged-in state: User loyalty progress and coin dashboard */
          <Link href="/vip" className="block group">
            <div className="rounded-2xl p-3.5 xl:p-4 relative overflow-hidden border transition-all duration-300 bg-linear-to-br from-[#120a06]/90 via-[#0e0e12]/95 to-[#161208]/90 border-orange-500/20 hover:border-orange-500/40 shadow-lg">
              {/* Background gradient flares */}
              <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-vibe-pink/15 blur-2xl pointer-events-none group-hover:bg-vibe-pink/25 transition-all duration-500" />
              <div className="absolute -bottom-12 -left-10 w-24 h-24 rounded-full bg-orange-500/15 blur-2xl pointer-events-none group-hover:bg-orange-500/25 transition-all duration-500" />

              {/* Level / User Info */}
              <div className="relative flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                    <Trophy size={16} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-extrabold text-orange-400 uppercase tracking-widest leading-none">
                      Cấp {giftLevel}
                    </p>
                    <h3 className="text-white font-extrabold text-xs xl:text-sm tracking-tight mt-1 truncate">
                      {levelName}
                    </h3>
                  </div>
                </div>
                <ChevronRight size={14} className="text-white/30 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {/* Info dashboard */}
              <div className="relative mt-3 pt-3 border-t border-white/5 grid grid-cols-2 gap-2">
                <div className="bg-white/3 rounded-xl p-2 border border-white/5 min-w-0">
                  <p className="text-[8px] xl:text-[9px] font-bold text-white/40 uppercase tracking-wider leading-none">Ví Xu</p>
                  <div className="flex items-center gap-1 mt-1 min-w-0">
                    <Coins size={11} className="text-amber-400 shrink-0" />
                    <span className="text-[11px] xl:text-xs font-black text-white truncate">
                      {formattedCoins}
                    </span>
                  </div>
                </div>

                <div className="bg-white/3 rounded-xl p-2 border border-white/5 min-w-0">
                  <p className="text-[8px] xl:text-[9px] font-bold text-white/40 uppercase tracking-wider leading-none">Đặc Quyền</p>
                  <p className="text-[10px] xl:text-[10.5px] font-bold text-amber-300 mt-1 truncate">
                    {vipStatus ? "Thành viên VIP" : "Mở Hộp Quà"}
                  </p>
                </div>
              </div>

              {/* Bottom interactive link */}
              <div className="relative mt-3 w-full py-1.5 rounded-xl text-center text-[10px] font-bold tracking-widest uppercase border border-orange-500/25 bg-orange-500/5 text-orange-400 group-hover:bg-linear-to-r group-hover:from-vibe-pink group-hover:to-orange-500 group-hover:text-white group-hover:border-transparent transition-all duration-300">
                Xem Tiến Độ
              </div>
            </div>
          </Link>
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
            <div className="absolute right-0 w-1 h-6 bg-vibe-pink rounded-full shadow-[0_0_20px_rgba(223,36,255,1)]" />
          )}
        </Link>
      </div>

      {/* Neon right-edge glow */}
      <div className="absolute top-0 right-0 w-px h-full bg-vibe-pink/20 shadow-[0_0_15px_rgba(223,36,255,0.3)]" />
    </aside>
  );
}
