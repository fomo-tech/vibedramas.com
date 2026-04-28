"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Coins,
  PlayCircle,
  Gift,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import VipHero from "@/components/vip/VipHero";
import PlanSelector, { usePlanSelection } from "@/components/vip/PlanSelector";
import BenefitList from "@/components/vip/BenefitList";
import VipCTA from "@/components/vip/VipCTA";
import VipDesktop from "@/components/vip/VipDesktop";
import PurchaseConfirmModal from "@/components/vip/PurchaseConfirmModal";
import BackgroundDecor from "@/components/home/BackgroundDecor";
import { useVipPackages, getVisibleVipPackages } from "@/hooks/useVipPackages";
import { useGiftRanks } from "@/hooks/useGiftRanks";
import { useAuthStore } from "@/store/useAuthStore";
import {
  RANK_COLORS,
  RANK_BADGES,
  RANK_BG,
} from "@/components/home/gift/giftConstants";

const VIP_GUIDE_STEPS = [
  {
    icon: Gift,
    title: "1. Chọn bậc hộp quà phù hợp",
    desc: "Mỗi bậc có xu thưởng khi mở hộp và thời gian xem cần thiết khác nhau.",
  },
  {
    icon: PlayCircle,
    title: "2. Xem video để tích lũy thời gian",
    desc: "Mỗi giây xem phim được tính vào bộ đếm. Đủ thời gian → hộp quà mở khóa.",
  },
  {
    icon: Coins,
    title: "3. Mở hộp nhận xu theo bậc",
    desc: "Hộp sẵn sàng thì mở ngay để nhận xu. Xu được cộng vào ví của bạn.",
  },
  {
    icon: TrendingUp,
    title: "4. Bậc càng cao, xu nhận càng nhiều",
    desc: "Bậc Huyền Thoại nhận 80 xu/hộp — gấp 8 lần so với bậc Khán Giả.",
  },
] as const;

export default function VipPage() {
  const router = useRouter();
  const {
    user,
    coins,
    setCoins,
    setVip,
    setGiftLevel,
    openLoginModal,
    vipStatus,
    vipExpiry,
    vipPackageName,
    giftLevel,
  } = useAuthStore();
  const isActiveVip =
    vipStatus && vipExpiry && new Date(vipExpiry) > new Date();
  const { packages } = useVipPackages();
  const visiblePackages = getVisibleVipPackages(packages);
  const { ranks } = useGiftRanks();

  const { selectedId, setSelectedId, selectedPlan } =
    usePlanSelection(visiblePackages);
  const selectedPlanByState = useMemo(
    () => visiblePackages.find((p) => p._id === selectedId) ?? null,
    [visiblePackages, selectedId],
  );

  useEffect(() => {
    if (!visiblePackages.length) return;
    if (selectedPlanByState) return;

    const preferred =
      visiblePackages.find((p) => p.name === vipPackageName) ??
      visiblePackages[0];
    setSelectedId(preferred._id);
  }, [visiblePackages, selectedPlanByState, vipPackageName, setSelectedId]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      openLoginModal();
      return;
    }
    setPendingPlanId(planId);
    setPurchaseError("");
    setConfirmOpen(true);
  };

  const handleConfirmPurchase = async () => {
    if (!pendingPlanId) return;
    setPurchaseLoading(true);
    setPurchaseError("");
    try {
      const res = await fetch("/api/vip/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pendingPlanId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          const required = Number(data?.required ?? 0);
          const current = Number(data?.current ?? 0);
          const missing = Math.max(0, required - current);
          setPurchaseError(
            `Không đủ xu. Bạn cần thêm ${missing.toLocaleString("vi-VN")} xu để mua gói này.`,
          );
          return;
        }
        setPurchaseError(data.error ?? "Có lỗi xảy ra");
        return;
      }
      setCoins(data.newCoins);
      setVip(true, data.vipExpiry, data.coinsPerMinute, data.packageName);
      if (typeof data.newGiftLevel === "number") {
        setGiftLevel(data.newGiftLevel);
      }
      setConfirmOpen(false);
      setSuccessMsg(`Kích hoạt ${data.packageName} thành công!`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch {
      setPurchaseError("Không thể kết nối server");
    } finally {
      setPurchaseLoading(false);
    }
  };

  const pendingPkg =
    visiblePackages.find((p) => p._id === pendingPlanId) ?? null;

  function renderRankTier(tier: {
    rank: number;
    name: string;
    coinsReward: number;
    watchSeconds: number;
  }) {
    const [PRIMARY, SECONDARY] = RANK_COLORS[tier.rank] ?? RANK_COLORS[1];
    const RankIcon = RANK_BADGES[tier.rank];
    const isUserRank = giftLevel === tier.rank;
    const isFree = tier.rank === 1;
    return (
      <motion.div
        key={tier.rank}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: tier.rank * 0.05 }}
        className="rounded-xl px-3 py-2.5 flex items-center gap-3"
        style={{
          background: isUserRank
            ? `linear-gradient(135deg, ${PRIMARY}22, ${SECONDARY}0e)`
            : (RANK_BG[tier.rank] ?? "rgba(255,255,255,0.03)"),
          border: `1px solid ${isUserRank ? PRIMARY + "55" : PRIMARY + "22"}`,
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: `linear-gradient(135deg, ${PRIMARY}44, ${SECONDARY}22)`,
            border: `1px solid ${PRIMARY}44`,
          }}
        >
          {RankIcon && <RankIcon size={16} style={{ color: PRIMARY }} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-white/90 text-xs font-bold">{tier.name}</p>
            {isUserRank && (
              <span
                className="text-[8px] font-black px-1.5 py-0.5 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`,
                  color: "#fff",
                }}
              >
                ĐANG DÙNG
              </span>
            )}
            {isFree && !isUserRank && (
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-white/40">
                MIỄN PHÍ
              </span>
            )}
          </div>
          <p className="text-white/40 text-[10px] mt-0.5">
            Xem {tier.watchSeconds}s để đầy hộp
          </p>
        </div>
        <div className="text-sm font-black shrink-0" style={{ color: PRIMARY }}>
          +{tier.coinsReward} xu
        </div>
      </motion.div>
    );
  }

  return (
    <div className="h-full">
      {/* ── Desktop layout (lg+) ── */}
      <div className="hidden lg:block h-full">
        <VipDesktop onSubscribe={handleSubscribe} />
      </div>

      {/* ── Mobile layout (< lg) ── */}
      <div className="lg:hidden relative h-full bg-black flex flex-col overflow-hidden">
        <BackgroundDecor />

        {/* Header bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3 bg-black/80 backdrop-blur-xl border-b border-white/5">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <h2 className="text-white font-black text-base tracking-tight">
            {isActiveVip ? "Gói bậc đang dùng" : "Nâng cấp bậc hộp quà"}
          </h2>
          <div className="w-9" />
        </div>

        {/* Scrollable content */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 24 }}
          className={`flex-1 overflow-y-auto ${
            selectedPlan
              ? "pb-[calc(10.5rem+env(safe-area-inset-bottom,0px))]"
              : "pb-[calc(6rem+env(safe-area-inset-bottom,0px))]"
          }`}
        >
          <VipHero
            isActiveVip={!!isActiveVip}
            vipExpiry={vipExpiry}
            selectedPlan={selectedPlan}
          />

          {/* Free earn callout */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03, duration: 0.3 }}
            className="mx-4 mt-1 mb-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-4 flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <PlayCircle size={16} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-emerald-400 font-black text-[11px] uppercase tracking-[0.14em]">
                Miễn phí — Bậc Khán Giả: +10 xu/hộp
              </p>
              <p className="text-white/55 text-[11px] mt-1 leading-relaxed">
                Xem video là tích thời gian. Đủ thời gian → mở hộp nhận xu. Nâng
                bậc để nhận nhiều xu hơn mỗi lần mở.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scaleX: 0.85 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.04, duration: 0.28 }}
            className="mx-4 border-t border-white/5 mb-4 origin-left"
          />
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.07, duration: 0.26 }}
            className="px-4 text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-3"
          >
            Chọn gói bậc
          </motion.p>
          <PlanSelector
            selectedId={selectedId}
            onSelect={setSelectedId}
            userCoins={coins}
          />
          <motion.div
            initial={{ opacity: 0, scaleX: 0.9 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.1, duration: 0.28 }}
            className="mx-4 border-t border-white/5 mt-6 origin-left"
          />
          <BenefitList selectedPlan={selectedPlan} />
          <div className="px-4 pt-1 pb-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-white/85 text-[11px] font-black uppercase tracking-[0.16em]">
                Cách nhận xu từ hộp quà
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2.5">
                {VIP_GUIDE_STEPS.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={step.title}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06, duration: 0.3 }}
                      className="rounded-xl border border-white/10 bg-black/35 px-3 py-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="h-7 w-7 shrink-0 rounded-lg bg-linear-to-br from-vibe-pink/30 to-orange-500/20 border border-vibe-pink/35 flex items-center justify-center">
                          <Icon size={14} className="text-vibe-pink" />
                        </div>
                        <div>
                          <p className="text-white/90 text-xs font-bold">
                            {step.title}
                          </p>
                          <p className="mt-0.5 text-white/55 text-[11px] leading-relaxed">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-4 border-t border-white/10 pt-3">
                <p className="text-white/75 text-[11px] font-black uppercase tracking-[0.16em] mb-1">
                  Xu nhận theo bậc hộp quà
                </p>
                <p className="text-white/40 text-[11px] leading-relaxed mb-3">
                  Xem đủ thời gian → mở hộp → nhận xu. Bậc càng cao, xu nhận mỗi
                  lần càng nhiều.
                </p>
                <div className="space-y-2">
                  {ranks.length === 0
                    ? [
                        {
                          rank: 1,
                          name: "Khán Giả",
                          coinsReward: 10,
                          watchSeconds: 60,
                        },
                        {
                          rank: 2,
                          name: "Fan Cứng",
                          coinsReward: 20,
                          watchSeconds: 55,
                        },
                        {
                          rank: 3,
                          name: "Sao Nổi",
                          coinsReward: 35,
                          watchSeconds: 50,
                        },
                        {
                          rank: 4,
                          name: "Minh Tinh",
                          coinsReward: 55,
                          watchSeconds: 45,
                        },
                        {
                          rank: 5,
                          name: "Huyền Thoại",
                          coinsReward: 80,
                          watchSeconds: 40,
                        },
                      ].map((tier) => renderRankTier(tier))
                    : ranks.map((tier) => renderRankTier(tier))}
                </div>
              </div>
            </div>
          </div>
          <div className="px-4 pb-4 flex items-center justify-center gap-2 text-white/25 text-[10px]">
            <ShieldCheck size={12} className="text-vibe-pink/50" />
            Mua gói mới sẽ thay thế gói hiện tại. Thưởng hộp quà luôn theo bậc
            đang áp dụng.
          </div>
        </motion.div>

        {/* Sticky CTA */}
        <VipCTA
          plan={selectedPlan}
          onSubscribe={handleSubscribe}
          hidden={confirmOpen}
        />
      </div>

      {/* Confirm modal */}
      <PurchaseConfirmModal
        open={confirmOpen}
        pkg={pendingPkg}
        userCoins={coins}
        loading={purchaseLoading}
        error={purchaseError}
        onConfirm={handleConfirmPurchase}
        onClose={() => setConfirmOpen(false)}
      />

      {/* Success toast */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-200 flex items-center gap-2.5 bg-green-500 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
          >
            <CheckCircle2 size={18} />
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
