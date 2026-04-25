"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  LogIn,
  Wallet,
  Gift,
  Clock,
  Crown,
  ArrowDownToLine,
  History,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import CoinIcon from "@/components/ui/CoinIcon";
import PageHeader from "./shared/PageHeader";

interface WalletSummary {
  coins: number;
  bonusCoins: number;
  earnedThisMonth: number;
  spentThisMonth: number;
}

// ─── MenuItem ────────────────────────────────────────────────────────────────
function WalletMenuItem({
  href,
  icon: Icon,
  label,
  badge,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: React.ReactNode;
}) {
  return (
    <Link href={href} className="block">
      <div className="flex items-center justify-between px-4 py-4 hover:bg-white/4 active:bg-white/6 transition-colors group">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/6 flex items-center justify-center group-hover:bg-white/10 transition-colors">
            <Icon
              size={15}
              className="text-white/50 group-hover:text-white/70 transition-colors"
            />
          </div>
          <span className="text-white/85 text-sm font-semibold group-hover:text-white transition-colors">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {badge}
          <ChevronRight
            size={15}
            className="text-white/20 group-hover:text-white/40 transition-colors"
          />
        </div>
      </div>
    </Link>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function WalletPage() {
  const { user, coins, bonusCoins, openLoginModal } = useAuthStore();
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  useEffect(() => {
    if (!user) return;
    fetch("/api/wallet/summary")
      .then((r) => r.json())
      .then((data) => setSummary(data))
      .catch(() => {});
  }, [user]);

  // ── Not logged in ────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-full h-full bg-black flex flex-col">
        <PageHeader title="Ví của tôi" />
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center pb-24">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(255,69,0,0.12)" }}
          >
            <Wallet size={28} style={{ color: "#FF4500" }} />
          </div>
          <p className="text-white font-black text-lg mb-1">
            Đăng nhập để quản lý ví
          </p>
          <p className="text-white/30 text-sm mb-6">
            Tích lũy xu, theo dõi lịch sử và tặng xu cho bạn bè
          </p>
          <button
            onClick={openLoginModal}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm text-white"
            style={{ background: "linear-gradient(135deg, #FF4500, #FF6B2B)" }}
          >
            <LogIn size={16} />
            Đăng Nhập Ngay
          </button>
        </div>
      </div>
    );
  }

  const displayCoins = summary?.coins ?? coins ?? 0;
  const displayBonus = summary?.bonusCoins ?? bonusCoins ?? 0;

  return (
    <div className="min-h-full h-full bg-black overflow-y-auto pb-24 lg:pb-8">
      <div className="max-w-lg mx-auto">
        <PageHeader title="Ví của tôi" />

        {/* Balance card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-2 rounded-2xl overflow-hidden relative"
          style={{ background: "linear-gradient(135deg,#111 0%,#0d0d0d 100%)" }}
        >
          <div className="absolute inset-0 bg-linear-to-br from-orange-500/10 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-vibe-pink/60 via-orange-400/30 to-transparent" />

          <div className="relative px-6 py-6">
            {/* Two balance columns */}
            <div className="flex">
              <div className="flex-1 flex flex-col items-center">
                <span className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">
                  Xu
                </span>
                <div className="flex items-center gap-1.5">
                  <CoinIcon size={20} />
                  <span className="text-white font-black text-3xl tracking-tighter">
                    {displayCoins.toLocaleString("vi-VN")}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px bg-white/8 mx-4" />

              <div className="flex-1 flex flex-col items-center">
                <span className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">
                  Tặng xu
                </span>
                <div className="flex items-center gap-1.5">
                  <Gift size={18} style={{ color: "#FF6B2B" }} />
                  <span
                    className="font-black text-3xl tracking-tighter"
                    style={{ color: "#FF6B2B" }}
                  >
                    {displayBonus.toLocaleString("vi-VN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Monthly stats */}
            {summary && (
              <div className="mt-5 pt-4 border-t border-white/6 flex justify-center gap-8">
                <div className="text-center">
                  <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest">
                    Đã kiếm tháng này
                  </p>
                  <p className="text-green-400 font-black text-base mt-0.5">
                    +{summary.earnedThisMonth.toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest">
                    Đã tiêu tháng này
                  </p>
                  <p className="text-red-400 font-black text-base mt-0.5">
                    -{summary.spentThisMonth.toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Action buttons: tạm ẩn nạp xu, chỉ giữ rút xu */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mx-4 mt-3"
        >
          <Link href="/wallet/withdraw" className="block">
            <button
              className="w-full py-4 rounded-2xl font-black text-white text-base tracking-wide flex items-center justify-center gap-2"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <ArrowDownToLine size={16} />
              Rút Xu
            </button>
          </Link>
        </motion.div>

        {/* Menu list */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mx-4 mt-4 rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="divide-y divide-white/5">
            <WalletMenuItem
              href="/wallet/gift"
              icon={Gift}
              label="Tặng xu"
              badge={
                displayBonus > 0 ? (
                  <span className="text-orange-400 text-xs font-black">
                    {displayBonus.toLocaleString("vi-VN")} xu
                  </span>
                ) : undefined
              }
            />
            <WalletMenuItem
              href="/wallet/withdraw-history"
              icon={History}
              label="Lịch sử rút xu"
            />
            <WalletMenuItem
              href="/wallet/spending"
              icon={Crown}
              label="Lịch sử mua bậc"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
