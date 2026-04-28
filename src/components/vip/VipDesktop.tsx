"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Crown,
  Zap,
  Trophy,
  Coins,
  Gift,
  Clock3,
  WalletCards,
  ShieldCheck,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Timer,
  PlayCircle,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useVipPackages,
  type VipPackage,
  getVisibleVipPackages,
} from "@/hooks/useVipPackages";
import { useGiftRanks } from "@/hooks/useGiftRanks";
import CoinIcon from "@/components/ui/CoinIcon";
import { useAuthStore } from "@/store/useAuthStore";

const VIP_GUIDE_STEPS = [
  {
    icon: Crown,
    title: "Kích hoạt gói bậc",
    desc: "Chọn gói phù hợp và mua bằng xu trong ví.",
  },
  {
    icon: PlayCircle,
    title: "Xem video tích lũy thời gian",
    desc: "Mỗi giây xem phim tích vào bộ đếm. Đủ thời gian → hộp quà mở khóa.",
  },
  {
    icon: Gift,
    title: "Mở hộp nhận thưởng",
    desc: "Đầy hộp thì mở để nhận xu + EXP ngay.",
  },
  {
    icon: TrendingUp,
    title: "Thăng bậc tăng thưởng",
    desc: "Bậc hộp quà càng cao, thưởng mỗi lần mở càng lớn.",
  },
] as const;

// ─── Desktop Plan Card ────────────────────────────────────────────────────────
interface DesktopPlanCardProps {
  plan: VipPackage;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onSubscribe: (id: string) => Promise<void>;
  index: number;
}

function DesktopPlanCard({
  plan,
  isSelected,
  onSelect,
  onSubscribe,
  index,
}: DesktopPlanCardProps) {
  const [loading, setLoading] = useState(false);
  const isBest = plan.badgeVariant === "best";
  const hasCoinBonus = plan.coinsPerMinute > 1;
  const giftRankNum = Math.max(1, Math.min(5, plan.giftRank ?? 1));
  const tierNames: Record<number, string> = {
    1: "Khán Giả",
    2: "Fan Cứng",
    3: "Sao Nổi",
    4: "Minh Tinh",
    5: "Huyền Thoại",
  };
  const tierCoins: Record<number, number> = {
    1: 10,
    2: 20,
    3: 35,
    4: 55,
    5: 80,
  };
  const tierSecs: Record<number, number> = {
    1: 60,
    2: 55,
    3: 50,
    4: 45,
    5: 40,
  };
  const benefits = [
    {
      icon: Gift,
      text: `Bậc hộp quà: ${tierNames[giftRankNum]} — +${tierCoins[giftRankNum]} xu/hộp`,
    },
    {
      icon: Coins,
      text: `Xem ${tierSecs[giftRankNum]}s là đầy hộp · Mở nhận xu ngay`,
    },
    { icon: Clock3, text: `${plan.days} ngày sử dụng` },
    {
      icon: WalletCards,
      text: "Mua mới thay thế gói hiện tại, không cộng dồn thời hạn",
    },
  ] as const;

  const handleSubscribe = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      await onSubscribe(plan._id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.08,
        type: "spring",
        damping: 22,
        stiffness: 260,
      }}
      onClick={() => onSelect(plan._id)}
      className={`relative flex flex-col rounded-3xl cursor-pointer select-none overflow-hidden transition-all duration-300
        ${
          isBest
            ? "-mx-2 shadow-[0_0_0_2px_rgba(255,69,0,1),0_24px_60px_rgba(255,69,0,0.25),0_8px_24px_rgba(0,0,0,0.6)]"
            : isSelected
              ? "shadow-[0_0_0_2px_rgba(255,69,0,0.8),0_16px_40px_rgba(255,69,0,0.15),0_8px_20px_rgba(0,0,0,0.5)]"
              : "shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
        }`}
      style={{
        background: isBest
          ? "linear-gradient(145deg,#1a0d07 0%,#0d0d0d 60%)"
          : "#111",
      }}
    >
      {(isBest || isSelected) && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-vibe-pink via-orange-400 to-rose-500" />
      )}
      {isBest && (
        <div className="absolute inset-0 bg-linear-to-b from-vibe-pink/8 via-transparent to-transparent pointer-events-none" />
      )}

      {plan.badge && (
        <div className="absolute top-4 right-4">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
              ${isBest ? "bg-vibe-pink text-white shadow-[0_0_16px_rgba(255,69,0,0.6)]" : "bg-white/10 text-white/70 border border-white/15"}`}
          >
            {isBest ? <Trophy size={9} /> : <Zap size={9} />}
            {plan.badge}
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 p-6 gap-5">
        {/* Name + price */}
        <div>
          <p className="text-white/50 text-xs font-bold uppercase tracking-[0.18em] mb-2">
            {plan.name}
          </p>
          <div className="flex items-end gap-1.5">
            <CoinIcon size={22} className="mb-1" />
            <span
              className={`font-black text-5xl leading-none tracking-tighter ${isBest || isSelected ? "text-vibe-pink" : "text-white"}`}
            >
              {Number(plan.price ?? 0).toLocaleString("vi-VN")}
            </span>
            <span className="text-white/40 text-sm font-bold mb-1.5">xu</span>
          </div>
          <p className="text-white/30 text-xs mt-1.5">
            {plan.days} ngày · {tierNames[giftRankNum]} · +
            {tierCoins[giftRankNum]} xu/hộp
          </p>
        </div>

        <div className="border-t border-white/[0.07]" />

        {/* Benefits */}
        <div className="flex flex-col gap-2.5 flex-1">
          {benefits.map((b) => (
            <div key={b.text} className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isBest ? "bg-vibe-pink/20" : "bg-white/8"}`}
              >
                <b.icon
                  size={11}
                  className={isBest ? "text-vibe-pink" : "text-white/55"}
                />
              </div>
              <span
                className={`text-sm ${isBest ? "text-white/80" : "text-white/50"}`}
              >
                {b.text}
              </span>
            </div>
          ))}
        </div>

        {/* CTA button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubscribe}
          disabled={loading}
          className={`relative w-full flex items-center justify-center gap-2 font-black text-sm rounded-xl py-3.5 overflow-hidden transition-all duration-200 disabled:opacity-50
            ${
              isBest
                ? "bg-vibe-pink text-white hover:bg-orange-500 shadow-[0_0_24px_rgba(255,69,0,0.4)]"
                : isSelected
                  ? "bg-white/15 text-white hover:bg-white/20 border border-white/15"
                  : "bg-white/8 text-white/60 hover:bg-white/12 hover:text-white border border-white/8"
            }`}
        >
          {isBest && (
            <motion.div
              animate={{ x: ["-100%", "200%"] }}
              transition={{
                repeat: Infinity,
                duration: 3,
                ease: "linear",
                repeatDelay: 1.5,
              }}
              className="absolute inset-0 bg-linear-to-r from-transparent via-white/15 to-transparent skew-x-12 pointer-events-none"
            />
          )}
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Đang xử lý...
            </>
          ) : (
            <>
              <Crown size={14} />
              Mua gói này
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Desktop Gift Rank Page ───────────────────────────────────────────────────
interface VipDesktopProps {
  onSubscribe: (planId: string) => Promise<void>;
}

export default function VipDesktop({ onSubscribe }: VipDesktopProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const { packages, loading } = useVipPackages();
  const visiblePackages = getVisibleVipPackages(packages);
  const { ranks } = useGiftRanks();
  const { vipStatus, vipExpiry } = useAuthStore();
  const isActiveVip =
    vipStatus && vipExpiry && new Date(vipExpiry) > new Date();

  useEffect(() => {
    if (!isActiveVip || !vipExpiry) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [isActiveVip, vipExpiry]);

  const countdownLabel = (() => {
    if (!vipExpiry) return null;
    const remainingMs = new Date(vipExpiry).getTime() - now;
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
  })();

  return (
    <div className="relative h-full bg-black flex flex-col overflow-y-auto">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-100 bg-vibe-pink/10 rounded-full blur-[120px]" />
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-orange-500/8 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-rose-600/8 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center border-b border-white/6 px-5 py-4 xl:px-8 xl:py-5">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/50 hover:text-white text-sm font-bold transition-colors group"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-0.5 transition-transform"
          />
          Quay lại
        </button>
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-vibe-pink flex items-center justify-center shadow-[0_0_12px_rgba(255,69,0,0.5)]">
            <Crown size={12} className="text-white" />
          </div>
          <span className="text-white font-black text-sm tracking-tight">
            Gói <span className="text-vibe-pink">Bậc Hộp Quà</span>
          </span>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 px-5 py-8 xl:gap-12 xl:px-8 xl:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl text-center"
        >
          <h1 className="mb-4 text-5xl font-black italic leading-none tracking-tighter text-white drop-shadow-[0_2px_40px_rgba(255,69,0,0.35)] xl:text-6xl">
            BẬC <span className="text-vibe-pink">HỘP QUÀ</span>
          </h1>
          {isActiveVip ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 bg-green-500/15 border border-green-500/25 text-green-400 text-sm font-black px-4 py-1.5 rounded-full">
                <CheckCircle2 size={14} />
                Gói bậc · Đang hoạt động
              </div>
              {countdownLabel ? (
                <p className="text-white/35 text-sm flex items-center gap-1.5">
                  <Timer size={12} className="text-vibe-pink/60" />
                  Hết hạn sau {countdownLabel}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-white/45 text-base leading-relaxed">
              Chọn bậc hộp quà phù hợp, xem phim để tích thời gian, mở hộp nhận
              xu. Bậc càng cao, xu nhận mỗi lần càng nhiều.
            </p>
          )}
        </motion.div>

        <div className="w-full max-w-6xl grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_1fr] xl:items-start">
          {loading ? (
            <div className="flex items-center gap-3 text-white/30 rounded-2xl border border-white/10 bg-white/3 px-5 py-6">
              <Loader2 size={18} className="animate-spin text-vibe-pink" />
              <span className="text-sm">Đang tải gói bậc...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 items-stretch md:grid-cols-2">
              {visiblePackages.map((plan, i) => (
                <DesktopPlanCard
                  key={plan._id}
                  plan={plan}
                  isSelected={selectedId === plan._id}
                  onSelect={setSelectedId}
                  onSubscribe={onSubscribe}
                  index={i}
                />
              ))}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.45 }}
            className="rounded-2xl border border-white/10 bg-white/3 px-5 py-4"
          >
            {/* Free earn callout */}
            <div className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-3.5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <PlayCircle size={15} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-emerald-400 font-black text-[11px] uppercase tracking-[0.14em]">
                  Miễn phí — Bậc Khán Giả: +10 xu/hộp
                </p>
                <p className="text-white/55 text-xs mt-1 leading-relaxed">
                  Xem video là tích thời gian. Đủ thời gian → mở hộp nhận xu.
                  Nâng bậc để nhận nhiều xu hơn mỗi lần mở.
                </p>
              </div>
            </div>

            <p className="text-white/75 text-xs font-black uppercase tracking-[0.16em]">
              Cách nhận xu từ hộp quà
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2.5">
              {VIP_GUIDE_STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.28 }}
                    className="rounded-xl border border-white/8 bg-black/35 p-3.5"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="h-8 w-8 shrink-0 rounded-lg bg-linear-to-br from-vibe-pink/30 to-orange-500/20 border border-vibe-pink/35 flex items-center justify-center">
                        <Icon size={15} className="text-vibe-pink" />
                      </div>
                      <div>
                        <p className="text-white/90 text-sm font-bold">
                          {step.title}
                        </p>
                        <p className="mt-0.5 text-white/55 text-xs leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-4 border-t border-white/10 pt-3.5">
              <p className="text-white/75 text-xs font-black uppercase tracking-[0.16em]">
                Bảng thưởng theo cấp độ hộp quà
              </p>
              <p className="mt-1 text-white/45 text-xs">
                Cấp càng cao, xu nhận mỗi lần mở hộp càng lớn.
              </p>
              <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
                <div className="grid grid-cols-3 bg-white/5 px-3 py-2 text-[11px] text-white/45 font-bold">
                  <span>Cấp</span>
                  <span className="text-center">Xu/lần</span>
                  <span className="text-right">Đầy hộp</span>
                </div>
                <div className="divide-y divide-white/8">
                  {ranks.map((tier) => (
                    <div
                      key={tier.rank}
                      className="grid grid-cols-3 items-center px-3 py-2.5 text-sm"
                    >
                      <span className="text-white/80 font-semibold">
                        {tier.rank}. {tier.name}
                      </span>
                      <span className="text-center text-white/70">
                        +{tier.coinsReward}
                      </span>
                      <span className="text-right text-white/60">
                        {tier.watchSeconds}s
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex items-center gap-2 text-white/25 text-xs"
        >
          <ShieldCheck size={13} className="text-vibe-pink/50" />
          Thanh toán bằng xu · Kích hoạt ngay · Chỉ số bonus phụ thuộc gói đang
          chọn
        </motion.div>
      </div>
    </div>
  );
}
