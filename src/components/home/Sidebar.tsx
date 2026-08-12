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
  ChevronRight,
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

    const cls = `w-full group flex items-center space-x-2.5 xl:space-x-4 px-3 xl:px-5 py-2.5 xl:py-3.5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
      isActive
        ? "border-orange-400/20 bg-linear-to-r from-vibe-pink/18 via-orange-500/8 to-transparent text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_24px_rgba(255,69,0,0.08)]"
        : "border-transparent text-white/45 hover:border-white/7 hover:bg-white/5 hover:text-white"
    }`;

    const inner = (
      <>
        <div className="relative shrink-0">
          <span className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${isActive ? "bg-orange-500/15 shadow-[0_0_18px_rgba(255,69,0,0.18)]" : "bg-white/0 group-hover:bg-white/6"}`}>
            <item.icon
              size={17}
              className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-orange-400" : ""}`}
            />
          </span>
        </div>
        <span className="font-bold text-[13px] xl:text-sm tracking-wide truncate">
          {item.label}
        </span>
        {isActive && (
          <div className="absolute right-0 h-7 w-1 rounded-l-full bg-linear-to-b from-amber-300 via-orange-500 to-red-500 shadow-[0_0_18px_rgba(255,69,0,0.75)]" />
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
    <aside className="hidden lg:flex flex-col w-56 xl:w-72 h-screen fixed top-0 left-0 overflow-hidden bg-[#080706]/92 backdrop-blur-2xl border-r border-white/7 px-3 xl:px-6 py-5 xl:py-8 z-60 shadow-[22px_0_70px_rgba(0,0,0,0.28)]">
      <div className="pointer-events-none absolute -top-24 -left-20 h-64 w-64 rounded-full bg-orange-600/8 blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-56 w-56 rounded-full bg-red-600/6 blur-[90px]" />
      {/* Brand */}
      <div className="relative px-1.5 xl:px-3 mb-5 xl:mb-8 flex items-center">
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
          <div className="rounded-[20px] p-3.5 xl:p-4 relative overflow-hidden border transition-all duration-300 bg-linear-to-br from-[#21100b]/95 via-[#100d0d]/98 to-[#17100b]/95 border-orange-500/25 hover:border-orange-400/45 shadow-[0_16px_38px_rgba(0,0,0,0.32)] group">
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
              className="relative mt-3.5 w-full overflow-hidden py-2.5 rounded-xl text-center text-[10px] xl:text-xs font-black tracking-wider uppercase bg-linear-to-r from-[#ff3d00] via-[#ff5722] to-[#ff8a00] text-white cursor-pointer shadow-[0_8px_24px_rgba(255,69,0,0.28)] hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(255,69,0,0.42)] active:translate-y-0 active:scale-[0.98] transition-all duration-300"
            >
              Đăng Nhập Nhận Quà
            </button>
          </div>
        ) : (
          /* Logged-in state: User loyalty progress and coin dashboard */
          <Link href="/reward-box" className="block group">
            <div className="relative overflow-hidden rounded-[18px] border border-orange-500/25 bg-linear-to-br from-[#190c08]/95 via-[#0f0d0d]/98 to-[#181207]/95 p-3 shadow-[0_12px_30px_rgba(0,0,0,0.28)] transition-all duration-300 hover:border-orange-400/45 group-hover:-translate-y-0.5">
              {/* Background gradient flares */}
              <div className="pointer-events-none absolute -right-8 -top-10 h-20 w-20 rounded-full bg-orange-500/15 blur-2xl transition-all duration-500 group-hover:bg-orange-500/25" />

              {/* Level / User Info */}
              <div className="relative flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-orange-300/20 bg-linear-to-br from-orange-500 to-amber-500 shadow-[0_0_15px_rgba(249,115,22,0.25)]">
                    <Gift size={15} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[8px] font-black uppercase tracking-[0.16em] text-orange-400">
                        Cấp {giftLevel}
                      </p>
                      <span className="h-1 w-1 rounded-full bg-white/20" />
                      <p className="truncate text-[11px] font-extrabold text-white xl:text-xs">
                        {levelName}
                      </p>
                    </div>
                    <p className="mt-0.5 text-[9px] font-medium text-white/35">
                      Phúc lợi xem phim
                    </p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-white/30 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {/* Compact wallet + action row */}
              <div className="relative mt-2.5 flex items-center gap-2 border-t border-white/6 pt-2.5">
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  <Coins size={13} className="shrink-0 text-amber-400" />
                  <span className="truncate text-xs font-black text-white">
                    {formattedCoins}
                  </span>
                  <span className="text-[9px] font-medium text-white/35">xu</span>
                </div>
                <span className="rounded-full border border-orange-400/25 bg-orange-500/10 px-2.5 py-1 text-[9px] font-black text-orange-300 transition-colors group-hover:bg-orange-500 group-hover:text-white">
                  {vipStatus ? "Quyền lợi VIP" : "Mở hộp quà"}
                </span>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Nav Groups */}
      <div className="relative flex-1 space-y-5 xl:space-y-6 overflow-y-auto scrollbar-hide">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="flex items-center gap-2 px-2.5 xl:px-4 text-[9px] font-black uppercase tracking-[0.18em] xl:tracking-[0.28em] text-white/28 mb-2 after:h-px after:flex-1 after:bg-white/6">
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
      <div className="absolute top-0 right-0 w-px h-full bg-linear-to-b from-transparent via-orange-500/35 to-transparent shadow-[0_0_18px_rgba(255,69,0,0.22)]" />
    </aside>
  );
}
