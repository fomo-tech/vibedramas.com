"use client";

import React from "react";
import {
  Settings,
  ChevronRight,
  Zap,
  Download,
  Clock,
  HeadphonesIcon,
  Wallet,
  Gift,
  Crown,
  LogIn,
  Heart,
  LogOut,
  Users,
  CheckCircle2,
  Timer,
  X,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { usePWA } from "@/components/PWAInstallPrompt";
import CoinIcon from "@/components/ui/CoinIcon";
import UserAvatar from "@/components/shared/UserAvatar";
import { useGiftRanks } from "@/hooks/useGiftRanks";
import { useWindowSize } from "@/hooks/useWindowSize";
import { BUILD_VERSION } from "@/constants/buildInfo";

interface ProfileWelfareStats {
  earnedToday: number;
  earnedAllTime: number;
  spentAllTime: number;
  bonusCoins: number;
}

interface GiftProgressData {
  rank: number;
  rankName: string;
  nextRankName: string | null;
  coinsReward: number;
  expReward: number;
  giftExp: number;
  currentRankExp: number;
  nextRankExp: number | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatExpiry(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  if (diffDays <= 0) return "Đã hết hạn";
  if (diffDays === 1) return "Còn 1 ngày";
  if (diffDays < 30) return `Còn ${diffDays} ngày`;
  const diffMonths = Math.floor(diffDays / 30);
  return `Còn ${diffMonths} tháng`;
}

// ─── ProfileHeader ────────────────────────────────────────────────────────────
function ProfileHeader() {
  const { user, openLoginModal, logout, vipStatus, vipExpiry } = useAuthStore();
  const isVip = vipStatus && vipExpiry && new Date(vipExpiry) > new Date();

  return (
    <div className="relative overflow-hidden px-4 pb-5 pt-7 lg:px-6 lg:pb-6 lg:pt-9">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-orange-500/14 blur-[72px]" />
        <div className="absolute -left-20 bottom-0 h-36 w-36 rounded-full bg-red-600/8 blur-[64px]" />
      </div>
      <div className="relative mb-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.24em] text-orange-400/80">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" />
        Hồ sơ thành viên
      </div>
      <div className="relative flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Avatar Container with Glow & Gradient Ring */}
        <div className="relative shrink-0">
          <div className={`w-16 h-16 lg:w-[72px] lg:h-[72px] rounded-[22px] overflow-hidden p-[2px] bg-gradient-to-br ${
            isVip 
              ? "from-amber-400 via-yellow-300 to-orange-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]" 
              : "from-white/10 to-white/5 border border-white/10"
          }`}>
            <div className="w-full h-full rounded-[20px] overflow-hidden bg-zinc-950">
              <UserAvatar
                name={user?.name ?? "?"}
                avatar={user?.avatar}
                size={72}
              />
            </div>
          </div>
          {isVip && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 flex items-center justify-center border-2 border-black shadow-lg">
              <Crown size={11} className="text-black font-extrabold" />
            </div>
          )}
        </div>

        {/* User Details */}
        <div className="flex flex-col justify-center">
          {user ? (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white font-black text-xl lg:text-2xl tracking-[-0.035em] leading-none">
                  {user.name}
                </span>
                {isVip && (
                  <span className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                    VIP
                  </span>
                )}
              </div>
              <span className="text-white/38 text-xs mt-1.5 font-medium truncate max-w-[200px] lg:max-w-[250px]">
                {user.email}
              </span>
            </>
          ) : (
            <button
              onClick={openLoginModal}
              className="flex items-center gap-1.5 group"
            >
              <span className="text-white font-black text-lg lg:text-xl tracking-tight leading-none group-hover:text-vibe-pink transition-colors">
                Đăng nhập
              </span>
              <LogIn
                size={16}
                className="text-white/40 group-hover:text-vibe-pink transition-colors"
              />
            </button>
          )}
        </div>
      </div>

      {/* Logout / Settings Button */}
      {user ? (
        <button
          onClick={logout}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all cursor-pointer shadow-lg"
          title="Đăng xuất"
        >
          <LogOut size={16} />
        </button>
      ) : (
        <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all shadow-lg">
          <Settings size={17} />
        </button>
      )}
      </div>
    </div>
  );
}

// ─── CoinsCard ────────────────────────────────────────────────────────────────
function CoinsCard() {
  const { user, coins } = useAuthStore();
  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -1, transition: { duration: 0.2 } }}
      className="mx-4 lg:mx-6 mt-1 rounded-[22px] overflow-hidden relative border border-amber-400/[0.14] bg-linear-to-br from-[#1a150c] via-[#12100e] to-[#100e0d] backdrop-blur-xl shadow-[0_18px_48px_rgba(0,0,0,0.42)]"
    >
      {/* Light highlights */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/[0.07] via-amber-500/[0.03] to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-yellow-400/30 via-amber-500/10 to-transparent" />
      
      <div className="relative p-4.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Animated Glowing Coin Icon Wrapper */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400/25 to-amber-600/10 border border-yellow-500/25 flex items-center justify-center shadow-[0_0_22px_rgba(245,158,11,0.22)] relative overflow-hidden group">
            <CoinIcon size={24} />
          </div>
          <div>
            <p className="text-amber-200/45 text-[9px] font-black uppercase tracking-[0.18em] leading-none">
              Ví xu của tôi
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-black text-2xl tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-white via-yellow-100 to-amber-400">
                {(coins ?? 0).toLocaleString()}
              </span>
              <span className="text-amber-400 text-xs font-extrabold">
                xu
              </span>
            </div>
          </div>
        </div>

        <Link href="/reward-box">
          <motion.button
            whileHover={{ scale: 1.03, y: -0.5 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-xs font-black px-3.5 py-2.5 rounded-xl shadow-[0_6px_18px_rgba(245,158,11,0.25)] hover:shadow-[0_8px_24px_rgba(245,158,11,0.45)] transition-all cursor-pointer border border-yellow-300/30"
          >
            <CoinIcon size={12} className="text-black filter brightness-50" />
            Dùng xu
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
}

// ─── VipStatusCard ────────────────────────────────────────────────────────────
function VipStatusCard() {
  const { user, vipStatus, vipExpiry, vipCoinsPerMinute } = useAuthStore();
  const { ranks } = useGiftRanks();
  const { width } = useWindowSize();
  const [open, setOpen] = React.useState(false);
  const [progress, setProgress] = React.useState<GiftProgressData | null>(null);

  React.useEffect(() => {
    if (!user) return;
    fetch("/api/gift/config")
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data: GiftProgressData) => {
        setProgress(data);
      })
      .catch(() => {
        setProgress(null);
      });
  }, [user]);

  if (!user) return null;

  const isVip = vipStatus && vipExpiry && new Date(vipExpiry) > new Date();
  const expiryLabel = formatExpiry(vipExpiry);
  const isMobile = (width ?? 0) < 1024;

  const nextExp = progress?.nextRankExp ?? null;
  const levelSpan = Math.max(
    1,
    Number(nextExp ?? progress?.giftExp ?? 0) -
      Number(progress?.currentRankExp ?? 0),
  );
  const levelProgress =
    nextExp === null
      ? 100
      : Math.max(
          0,
          Math.min(
            100,
            ((Number(progress?.giftExp ?? 0) -
              Number(progress?.currentRankExp ?? 0)) /
              levelSpan) *
              100,
          ),
        );

  return (
    <Link href="/reward-box">
      <motion.div
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.99 }}
        className="mx-4 mt-3.5 cursor-pointer overflow-hidden rounded-[22px] border border-orange-400/20 bg-linear-to-br from-[#18100d] via-[#11100f] to-[#120d0b] p-4 shadow-[0_16px_42px_rgba(0,0,0,0.36)] backdrop-blur-xl lg:mx-6"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-orange-300/20 bg-gradient-to-br from-vibe-pink to-orange-500 shadow-[0_10px_25px_rgba(255,69,0,0.24)]">
            <Gift size={20} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase text-white/35">
                  Level {progress?.rank ?? 1}
                </p>
                <p className="truncate text-sm font-black text-white">
                  {progress?.rankName ?? "Phần thưởng xem phim"}
                </p>
              </div>
              <ChevronRight size={16} className="shrink-0 text-white/35" />
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${levelProgress}%` }}
                className="h-full rounded-full bg-gradient-to-r from-[#ff3d00] via-orange-500 to-amber-400"
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] text-white/35">
              <span>{Number(progress?.giftExp ?? 0).toLocaleString("vi-VN")} EXP</span>
              <span>+{Number(progress?.coinsReward ?? 0)} xu · +{Number(progress?.expReward ?? 0)} EXP/hộp</span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );

  if (!isVip) {
    // Not VIP — show upgrade banner
    return (
      <Link href="/reward-box">
        <motion.div
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="mx-4 lg:mx-6 mt-3.5 rounded-2xl relative overflow-hidden cursor-pointer border border-vibe-pink/25 bg-zinc-900/30 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
        >
          {/* Deep glowing background leaks */}
          <div className="absolute inset-0 bg-gradient-to-r from-vibe-pink/[0.15] via-orange-500/[0.05] to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-vibe-pink via-orange-500 to-transparent" />
          
          <div className="relative p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Crown Icon Container with Premium Glow */}
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-vibe-pink to-orange-600 flex items-center justify-center shadow-[0_0_20px_rgba(255,42,109,0.4)] shrink-0 border border-white/10">
                <Crown size={20} className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" />
              </div>
              
              <div>
                <p className="text-white font-extrabold text-base leading-tight tracking-tight flex items-center gap-1.5">
                  <span>Gói</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-vibe-pink to-orange-400 font-black">
                    Bậc Hộp Quà
                  </span>
                </p>
                <p className="text-white/40 text-[11px] mt-1 font-medium leading-relaxed max-w-[220px] sm:max-w-xs md:max-w-md">
                  Xem phim để tích thời gian, mở hộp nhận xu theo bậc
                </p>
                
                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                  <span className="bg-vibe-pink/10 border border-vibe-pink/20 text-vibe-pink text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Kiếm xu/phút
                  </span>
                  <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Thưởng theo bậc
                  </span>
                </div>
              </div>
            </div>

            {/* Premium Button Trigger */}
            <div className="shrink-0 flex items-center gap-1.5 bg-vibe-pink/10 border border-vibe-pink/20 rounded-xl px-3 py-1.5 hover:bg-vibe-pink/20 transition-all">
              <span className="text-vibe-pink text-xs font-black uppercase tracking-wider">
                Chọn gói
              </span>
              <ChevronRight size={13} className="text-vibe-pink" />
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }

  // Active VIP — show full status card
  const VIP_PERKS = [
    {
      label:
        vipCoinsPerMinute > 1
          ? `Xem phim tích thời gian · Bonus +${vipCoinsPerMinute} xu/phút`
          : "Xem phim tích thời gian, mở hộp nhận xu",
    },
    { label: "Nhận thưởng hộp quà theo bậc hiện tại" },
    { label: "Mua gói mới sẽ thay thế gói hiện tại" },
    { label: "Thông số đồng bộ từ admin" },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -1 }}
        className="mx-4 lg:mx-6 mt-3.5 rounded-2xl overflow-hidden relative border border-vibe-pink/20 bg-zinc-900/40 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-vibe-pink/[0.08] via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-vibe-pink via-orange-400 to-rose-500" />

        {/* Header row */}
        <div className="relative p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-vibe-pink to-rose-600 flex items-center justify-center shadow-[0_0_20px_rgba(255,42,109,0.35)] shrink-0 border border-white/10">
              <Crown size={20} className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-white font-extrabold text-base tracking-tight leading-none">
                  Gói <span className="text-transparent bg-clip-text bg-gradient-to-r from-vibe-pink to-rose-400 font-black">Bậc Hộp Quà</span>
                </p>
                <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Đang dùng
                </span>
              </div>
              <p className="text-white/40 text-[11px] mt-1.5 flex items-center gap-1 font-medium">
                <Timer size={11} className="text-vibe-pink/60" />
                {expiryLabel}
              </p>
            </div>
          </div>
          <Link href="/reward-box">
            <span className="text-white/40 text-xs hover:text-vibe-pink transition-colors flex items-center gap-1 cursor-pointer">
              Mua gói khác
              <ChevronRight size={12} />
            </span>
          </Link>
        </div>

        {/* Coins earning rate */}
        {vipCoinsPerMinute > 0 && (
          <div className="mx-4 mb-3.5 rounded-xl bg-yellow-500/[0.05] border border-yellow-500/15 px-3 py-2 flex items-center gap-2">
            <CoinIcon size={14} className="shrink-0" />
            <p className="text-yellow-400/80 text-xs font-bold leading-normal">
              {vipCoinsPerMinute > 1
                ? `+${vipCoinsPerMinute} xu/phút`
                : "Kiếm tiền đã bật"}
              <span className="text-white/30 font-medium ml-1">
                {vipCoinsPerMinute > 1
                  ? "khi xem phim theo gói đã mua"
                  : "theo cấu hình gói hiện tại"}
              </span>
            </p>
          </div>
        )}

        {/* Perks grid */}
        <div className="px-4 pb-4 grid grid-cols-2 gap-x-3 gap-y-2 border-b border-white/[0.04]">
          {VIP_PERKS.map(({ label }) => (
            <div key={label} className="flex items-start gap-1.5">
              <CheckCircle2 size={12} className="text-vibe-pink shrink-0 mt-0.5" />
              <span className="text-white/50 text-[10px] font-medium leading-tight">
                {label}
              </span>
            </div>
          ))}
        </div>

        {progress && (
          <div className="p-4 bg-black/20">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setOpen(true)}
              className="w-full rounded-xl border border-white/[0.06] bg-zinc-950/40 p-3 block text-left hover:bg-zinc-950/70 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8.5 h-8.5 rounded-lg bg-vibe-pink/10 border border-vibe-pink/20 flex items-center justify-center shrink-0">
                    <Sparkles size={14} className="text-vibe-pink" />
                  </div>
                  <div>
                    <p className="text-white font-extrabold text-xs">
                      Cấp bậc quà hiện tại
                    </p>
                    <p className="text-vibe-pink text-[11px] font-bold mt-0.5">
                      Bậc {progress!.rank} · {progress!.rankName}
                    </p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-white/35" />
              </div>

              <div className="mt-3">
                <p className="text-[10px] text-white/40 leading-relaxed">
                  Bấm để xem lịch sử tích lũy và điều kiện thăng cấp bậc nhận xu
                </p>
              </div>
            </motion.button>
          </div>
        )}
      </motion.div>

      {open && progress && (
        <>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-120 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={
              isMobile ? { y: "100%" } : { opacity: 0, y: 20, scale: 0.96 }
            }
            animate={isMobile ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={isMobile ? { y: "100%" } : { opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className={
              isMobile
                ? "fixed bottom-0 left-0 right-0 z-130 rounded-t-3xl border-t border-white/10 bg-zinc-950 max-h-[86vh] overflow-hidden"
                : "fixed top-1/2 left-1/2 z-130 w-[min(92vw,640px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-zinc-950 overflow-hidden"
            }
          >
            <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
              <div>
                <p className="text-white font-black text-base">
                  Cấp bậc hộp quà
                </p>
                <p className="text-vibe-pink text-xs font-bold mt-1">
                  Bậc {progress!.rank} · {progress!.rankName}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/12 flex items-center justify-center"
              >
                <X size={14} className="text-white/60" />
              </button>
            </div>

            <div className="px-5 py-4 overflow-y-auto max-h-[72vh]">
              <div className="rounded-xl border border-white/8 bg-white/3 p-3.5">
                <p className="text-[11px] text-white/45">
                  {progress!.nextRankName
                    ? `Bậc kế tiếp: ${progress!.nextRankName}`
                    : "Đã đạt bậc cao nhất"}
                </p>
              </div>

              <div className="mt-3 space-y-2">
                {ranks.map((tier) => {
                  const isCurrent = tier.rank === progress!.rank;
                  return (
                    <div
                      key={tier.rank}
                      className={`rounded-xl border px-3 py-2.5 ${
                        isCurrent
                          ? "border-vibe-pink/40 bg-vibe-pink/10"
                          : "border-white/8 bg-black/30"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-white/85 text-xs font-bold">
                          Bậc {tier.rank} · {tier.name}
                        </p>
                        {isCurrent && (
                          <span className="text-[10px] font-black text-vibe-pink">
                            Hiện tại
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-white/55 text-[11px]">
                        +{tier.coinsReward} xu/lần · Đầy hộp {tier.watchSeconds}
                        s
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </>
  );
}

// ─── PerksRow ─────────────────────────────────────────────────────────────────
function PerksRow() {
  const { user } = useAuthStore();
  const [stats, setStats] = React.useState<ProfileWelfareStats>({
    earnedToday: 0,
    earnedAllTime: 0,
    spentAllTime: 0,
    bonusCoins: 0,
  });

  React.useEffect(() => {
    if (!user) return;

    fetch("/api/welfare/summary")
      .then((res) => res.json())
      .then((data) => {
        if (!data?.user?.stats) return;
        setStats({
          earnedToday: data.user.stats.earnedToday ?? 0,
          earnedAllTime: data.user.stats.earnedAllTime ?? 0,
          spentAllTime: data.user.stats.spentAllTime ?? 0,
          bonusCoins: data.user.bonusCoins ?? 0,
        });
      })
      .catch(() => {});
  }, [user]);

  const displayStats = user
    ? stats
    : {
        earnedToday: 0,
        earnedAllTime: 0,
        spentAllTime: 0,
        bonusCoins: 0,
      };

  const items = [
    {
      icon: Zap,
      label: "Hôm nay",
      value: displayStats.earnedToday,
      color: "#f97316",
    },
    {
      icon: Gift,
      label: "Tổng kiếm",
      value: displayStats.earnedAllTime,
      color: "#ffffff",
    },
    {
      icon: Wallet,
      label: "Tổng rút",
      value: displayStats.spentAllTime,
      color: "#f87171",
    },
    {
      icon: Crown,
      label: "Xu tặng",
      value: displayStats.bonusCoins,
      color: "#facc15",
    },
  ];

  return (
    <div className="mx-4 lg:mx-6 mt-3 rounded-[22px] overflow-hidden border border-white/7 bg-[#11100f]/90 grid grid-cols-4 shadow-[0_12px_36px_rgba(0,0,0,0.26)]">
      {items.map(({ icon: Icon, label, value, color }, index) => (
        <div
          key={label}
          className={`relative flex flex-col items-center justify-center px-2 py-3.5 ${index < items.length - 1 ? "border-r border-white/6" : ""}`}
        >
          <div className="w-8 h-8 rounded-xl bg-white/6 border border-white/5 flex items-center justify-center">
            <Icon size={14} style={{ color }} />
          </div>
          <span className="mt-2 text-white text-sm font-black tracking-tight leading-none text-center">
            {value.toLocaleString("vi-VN")}
          </span>
          <span className="mt-1 text-white/35 text-[9px] lg:text-[10px] font-bold text-center leading-tight">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── MenuRow / MenuCard ───────────────────────────────────────────────────────
interface MenuRowProps {
  icon: React.ElementType;
  label: string;
  badge?: React.ReactNode;
  onClick?: () => void;
}

function MenuRow({ icon: Icon, label, badge, onClick }: MenuRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-orange-500/[0.045] active:bg-white/6 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 group-hover:bg-orange-500/10 group-hover:border-orange-400/15 flex items-center justify-center transition-all shrink-0">
          <Icon
            size={14}
            className="text-white/40 group-hover:text-white/65 transition-colors"
          />
        </div>
        <span className="text-white/80 text-sm font-semibold group-hover:text-white transition-colors">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {badge}
        <ChevronRight
          size={14}
          className="text-white/20 group-hover:text-white/40 transition-colors"
        />
      </div>
    </button>
  );
}

function MenuCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-4 lg:mx-6 rounded-[22px] bg-[#11100f]/90 border border-white/7 overflow-hidden divide-y divide-white/6 shadow-[0_12px_36px_rgba(0,0,0,0.22)]">
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, coins, openLoginModal } = useAuthStore();
  const { setOpen: openSupportChat, setUnread } = useChatStore();
  const { showInstallModal, canInstall } = usePWA();

  const handleOpenSupport = React.useCallback(() => {
    if (!user) {
      openLoginModal();
      return;
    }

    setUnread(0);
    openSupportChat(true);
  }, [user, openLoginModal, openSupportChat, setUnread]);

  return (
    <div className="relative h-full overflow-y-auto bg-[#080706] pt-safe pb-24 lg:pb-8">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-1/2 top-0 h-[360px] w-[680px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(255,69,0,0.1),transparent_66%)]" />
      </div>
      <div className="relative mx-auto w-full max-w-lg lg:max-w-6xl">
        <ProfileHeader />

        {/* Coins + VIP cards */}
        <CoinsCard />
        <VipStatusCard />
        <PerksRow />

        {/* Menu group 1 — Wallet */}
        <div className="mt-4">
          <MenuCard>
            <Link href="/wallet" className="block">
              <MenuRow
                icon={Wallet}
                label="Ví xu của tôi"
                badge={
                  <span className="flex items-center gap-1 text-yellow-400 text-sm font-black">
                    <CoinIcon size={13} />
                    {user ? (coins ?? 0).toLocaleString() : "—"}
                  </span>
                }
              />
            </Link>
            <Link href="/welfare" className="block">
              <MenuRow
                icon={Gift}
                label="Trung tâm phúc lợi"
                badge={
                  <span className="bg-vibe-pink/20 border border-vibe-pink/30 text-vibe-pink text-[10px] font-black px-2 py-0.5 rounded-full">
                    +xu
                  </span>
                }
              />
            </Link>
          </MenuCard>
        </div>

        {/* Menu group 2 — Activity */}
        <div className="mt-3">
          <MenuCard>
            <Link href="/history" className="block">
              <MenuRow icon={Clock} label="Lịch sử xem" />
            </Link>
            <Link href="/liked" className="block">
              <MenuRow icon={Heart} label="Yêu thích" />
            </Link>
            <Link href="/referral" className="block">
              <MenuRow
                icon={Users}
                label="Giới thiệu bạn bè"
                badge={
                  <span className="bg-vibe-pink/20 border border-vibe-pink/30 text-vibe-pink text-[10px] font-black px-2 py-0.5 rounded-full">
                    +xu
                  </span>
                }
              />
            </Link>
            {canInstall && (
              <MenuRow
                icon={Download}
                label="Tải ứng dụng"
                onClick={showInstallModal}
                badge={
                  <span className="bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles size={10} />
                    Mới
                  </span>
                }
              />
            )}
          </MenuCard>
        </div>

        {/* Menu group 3 — Settings */}
        <div className="mt-3">
          <MenuCard>
            <MenuRow
              icon={HeadphonesIcon}
              label="CSKH trực tuyến"
              badge={
                <span className="bg-vibe-pink/20 border border-vibe-pink/30 text-vibe-pink text-[10px] font-black px-2 py-0.5 rounded-full">
                  Chat
                </span>
              }
              onClick={handleOpenSupport}
            />
          </MenuCard>
        </div>

        <p className="text-center text-white/10 text-[10px] mt-6 pb-2 tracking-widest uppercase">
          Phim ngắn hay v{BUILD_VERSION}
        </p>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────
