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
  const { user, openLoginModal, logout } = useAuthStore();

  return (
    <div className="flex items-center justify-between px-4 lg:px-6 pt-6 lg:pt-8 pb-2">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="w-16 h-16 lg:w-18 lg:h-18 rounded-full overflow-hidden border border-white/10">
            <UserAvatar
              name={user?.name ?? "?"}
              avatar={user?.avatar}
              size={72}
            />
          </div>
          <div className="absolute inset-0 rounded-full ring-2 ring-vibe-pink/20" />
        </div>
        <div>
          {user ? (
            <>
              <p className="text-white font-black text-xl lg:text-2xl tracking-tight leading-none">
                {user.name}
              </p>
              <p className="text-white/30 text-[11px] mt-1.5 truncate max-w-45">
                {user.email}
              </p>
            </>
          ) : (
            <button
              onClick={openLoginModal}
              className="flex items-center gap-1.5 group"
            >
              <span className="text-white font-black text-xl lg:text-2xl tracking-tight leading-none group-hover:text-vibe-pink transition-colors">
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
      {user ? (
        <button
          onClick={logout}
          className="w-9 h-9 rounded-full bg-white/6 border border-white/8 flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
          title="Đăng xuất"
        >
          <LogOut size={16} />
        </button>
      ) : (
        <button className="w-9 h-9 rounded-full bg-white/6 border border-white/8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
          <Settings size={17} />
        </button>
      )}
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
      className="mx-4 lg:mx-6 mt-4 rounded-2xl overflow-hidden relative"
      style={{ background: "linear-gradient(135deg,#0d0d0d 0%,#111 100%)" }}
    >
      <div className="absolute inset-0 bg-linear-to-r from-yellow-500/6 via-orange-500/4 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-yellow-500/40 via-orange-400/20 to-transparent" />
      <div className="relative p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-yellow-500/15 flex items-center justify-center shadow-[0_0_16px_rgba(234,179,8,0.2)]">
            <CoinIcon size={22} />
          </div>
          <div>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
              Số dư xu
            </p>
            <p className="text-white font-black text-2xl tracking-tighter leading-none mt-0.5">
              {(coins ?? 0).toLocaleString()}
              <span className="text-yellow-400/70 text-sm font-bold ml-1">
                xu
              </span>
            </p>
          </div>
        </div>
        <Link href="/vip">
          <motion.button
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-black px-3 py-1.5 rounded-xl hover:bg-yellow-500/20 transition-all"
          >
            <CoinIcon size={12} />
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

  if (!isVip) {
    // Not VIP — show upgrade banner
    return (
      <Link href="/vip">
        <motion.div
          whileTap={{ scale: 0.98 }}
          className="mx-4 lg:mx-6 mt-3 rounded-2xl relative overflow-hidden cursor-pointer"
          style={{
            background:
              "linear-gradient(135deg,#1a0907 0%,#0f0f0f 55%,#1a0500 100%)",
          }}
        >
          <div className="absolute inset-0 bg-linear-to-r from-vibe-pink/15 via-orange-500/8 to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-vibe-pink via-orange-400 to-transparent" />
          <div className="relative p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-vibe-pink flex items-center justify-center shadow-[0_0_20px_rgba(255,69,0,0.5)] shrink-0">
                <Crown size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white font-black text-base leading-tight tracking-tight">
                  Gói <span className="text-vibe-pink">Bậc Hộp Quà</span>
                </p>
                <p className="text-white/40 text-[11px] mt-0.5">
                  Xem phim để tích thời gian, mở hộp nhận xu theo bậc
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="bg-vibe-pink/20 border border-vibe-pink/30 text-vibe-pink text-[10px] font-black px-2 py-0.5 rounded-full">
                    Kiếm xu/phút
                  </span>
                  <span className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                    Thưởng theo bậc
                  </span>
                </div>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1.5">
              <span className="text-vibe-pink text-xs font-black">
                Chọn gói
              </span>
              <ChevronRight size={14} className="text-vibe-pink/60" />
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
        className="mx-4 lg:mx-6 mt-3 rounded-2xl overflow-hidden relative"
        style={{ background: "linear-gradient(135deg,#1a0907 0%,#0d0d0d 60%)" }}
      >
        <div className="absolute inset-0 bg-linear-to-b from-vibe-pink/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-vibe-pink via-orange-400 to-rose-500" />

        {/* Header row */}
        <div className="relative p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-vibe-pink flex items-center justify-center shadow-[0_0_20px_rgba(255,69,0,0.5)]">
              <Crown size={18} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-white font-black text-base tracking-tight">
                  Gói <span className="text-vibe-pink">Bậc Hộp Quà</span>
                </p>
                <span className="bg-green-500/20 border border-green-500/30 text-green-400 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                  Đang dùng
                </span>
              </div>
              <p className="text-white/35 text-[11px] mt-0.5 flex items-center gap-1.5">
                <Timer size={10} className="text-vibe-pink/60" />
                {expiryLabel}
              </p>
            </div>
          </div>
          <Link href="/vip">
            <span className="text-white/30 text-xs hover:text-white/60 transition-colors flex items-center gap-1">
              Mua gói khác
              <ChevronRight size={12} />
            </span>
          </Link>
        </div>

        {/* Coins earning rate */}
        {vipCoinsPerMinute > 0 && (
          <div className="mx-4 mb-3 rounded-xl bg-yellow-500/8 border border-yellow-500/15 px-3 py-2.5 flex items-center gap-2.5">
            <CoinIcon size={16} className="shrink-0" />
            <p className="text-yellow-400/80 text-xs font-bold">
              {vipCoinsPerMinute > 1
                ? `+${vipCoinsPerMinute} xu/phút`
                : "Kiếm tiền đã bật"}
              <span className="text-white/30 font-normal">
                {vipCoinsPerMinute > 1
                  ? " khi xem phim theo gói đã mua"
                  : " theo cấu hình gói hiện tại"}
              </span>
            </p>
          </div>
        )}

        {/* Perks grid */}
        <div className="px-4 pb-4 grid grid-cols-2 gap-2">
          {VIP_PERKS.map(({ label }) => (
            <div key={label} className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-vibe-pink shrink-0" />
              <span className="text-white/60 text-[11px] font-medium">
                {label}
              </span>
            </div>
          ))}
        </div>

        {progress && (
          <div className="px-4 pb-4">
            <motion.button
              whileTap={{ scale: 0.99 }}
              onClick={() => setOpen(true)}
              className="w-full rounded-2xl border border-white/8 bg-zinc-900/60 p-4 block text-left"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-vibe-pink/15 border border-vibe-pink/25 flex items-center justify-center">
                    <Sparkles size={16} className="text-vibe-pink" />
                  </div>
                  <div>
                    <p className="text-white font-black text-sm">
                      Cấp bậc quà hiện tại
                    </p>
                    <p className="text-vibe-pink text-xs font-bold mt-0.5">
                      Bậc {progress.rank} · {progress.rankName}
                    </p>
                  </div>
                </div>
                <ChevronRight size={15} className="text-white/35" />
              </div>

              <div className="mt-3">
                <p className="text-[11px] text-white/45">
                  {progress.nextRankName
                    ? `Bậc kế tiếp: ${progress.nextRankName}`
                    : "Đã đạt bậc cao nhất"}
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
                  Bậc {progress.rank} · {progress.rankName}
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
                  {progress.nextRankName
                    ? `Bậc kế tiếp: ${progress.nextRankName}`
                    : "Đã đạt bậc cao nhất"}
                </p>
              </div>

              <div className="mt-3 space-y-2">
                {ranks.map((tier) => {
                  const isCurrent = tier.rank === progress.rank;
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
    <div className="mx-4 lg:mx-6 mt-3 rounded-2xl overflow-hidden border border-white/6 bg-zinc-900/60 grid grid-cols-4">
      {items.map(({ icon: Icon, label, value, color }, index) => (
        <div
          key={label}
          className={`flex flex-col items-center justify-center px-2 py-3.5 ${index < items.length - 1 ? "border-r border-white/6" : ""}`}
        >
          <div className="w-8 h-8 rounded-xl bg-white/6 flex items-center justify-center">
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
      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/4 active:bg-white/6 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-white/5 group-hover:bg-white/8 flex items-center justify-center transition-all shrink-0">
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
    <div className="mx-4 lg:mx-6 rounded-2xl bg-zinc-900/60 border border-white/6 overflow-hidden divide-y divide-white/5">
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
    <div className="h-full bg-black overflow-y-auto pt-safe pb-24 lg:pb-8">
      <div className="max-w-lg mx-auto lg:max-w-xl">
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
          VibeDrama v{BUILD_VERSION}
        </p>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────
