"use client";

import React from "react";
import { Home, Compass, Crown, Film, User } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

const TABS = [
  { icon: Home, label: "Trang chủ", href: "/" },
  { icon: Crown, label: "Hội viên", href: "/vip" },
  { icon: Compass, label: "Đề Xuất", href: "/foryou", isCenter: true },
  { icon: Film, label: "Tất cả phim", href: "/all" },
  { icon: User, label: "Của tôi", href: "/profile" },
];

export default function MobileNav() {
  const router = useRouter();
  const pathname = usePathname();

  if (
    pathname?.startsWith("/vip") ||
    pathname?.startsWith("/wallet/topup") ||
    pathname?.startsWith("/wallet/withdraw")
  ) {
    return null;
  }

  return (
    <nav
      aria-label="Điều hướng chính"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-100 bg-black"
    >
      <div className="relative bg-black/78 border-t border-white/12">
        <div className="flex items-center justify-between px-2 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;

            if (tab.isCenter) {
              return (
                <button
                  key={tab.href}
                  onClick={() => router.push(tab.href)}
                  aria-label={tab.label}
                  aria-current={isActive ? "page" : undefined}
                  className="flex flex-col items-center justify-center flex-1 group relative py-2 active:scale-90 transition-transform duration-150"
                >
                  <div className="relative w-10 h-10">
                    <div className="relative w-10 h-10 bg-linear-to-br from-vibe-pink via-orange-500 to-rose-500 rounded-full flex items-center justify-center border border-white/20">
                      <Icon
                        size={20}
                        className="text-white"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </button>
              );
            }

            return (
              <button
                key={tab.href}
                onClick={() => router.push(tab.href)}
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
                className="flex flex-col items-center justify-center flex-1 group relative py-2"
              >
                <div className="relative mb-1">
                  <Icon
                    size={22}
                    aria-hidden="true"
                    className={`relative transition-all duration-300 ${
                      isActive
                        ? "text-vibe-pink scale-110"
                        : "text-white/35 group-hover:text-white/60 group-hover:scale-105"
                    }`}
                  />
                </div>

                <span
                  className={`text-[9px] font-extrabold uppercase tracking-wider transition-all duration-300 ${
                    isActive
                      ? "text-vibe-pink"
                      : "text-white/25 group-hover:text-white/40"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
