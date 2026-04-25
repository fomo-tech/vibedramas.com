"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { X, Gift, Zap, Clock, Star, Lock, Flame } from "lucide-react";
import { useWindowSize } from "@/hooks/useWindowSize";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import type { GiftBoxState } from "@/hooks/useGiftBox";
import GiftBoxIcon from "./GiftBoxIcon";
import { RANK_COLORS, RANK_BADGES, RANK_BG, RANK_NAMES } from "./giftConstants";

interface GiftInfoSheetProps {
  open: boolean;
  onClose: () => void;
  onClaim: () => void;
  locked?: boolean;
  isLoggedIn?: boolean;
  rank: number;
  rankName: string;
  nextRankName: string | null;
  coinsReward: number;
  coinsToday: number;
  coinsTotal: number;
  watchExp: number;
  watchMax: number;
  progress: number;
  state: GiftBoxState;
}

const RANK_STEPS = [1, 2, 3, 4, 5] as const;

function toFiniteNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function GiftInfoSheet({
  open,
  onClose,
  onClaim,
  locked = false,
  isLoggedIn = true,
  rank,
  rankName,
  nextRankName,
  coinsReward,
  coinsToday,
  coinsTotal,
  watchExp,
  watchMax,
  progress,
  state,
}: GiftInfoSheetProps) {
  const { width } = useWindowSize();
  const router = useRouter();
  const { openLoginModal } = useAuthStore();
  const isDesktop = (width ?? 0) >= 1024;

  // Lazy initializer: false on SSR (document undefined), true on client.
  // createPortal produces null in the tree so no hydration mismatch.
  const [mounted] = useState<boolean>(() => typeof document !== "undefined");
  const safeRank = Math.max(1, Math.min(5, toFiniteNumber(rank, 1)));
  const [PRIMARY, SECONDARY] = RANK_COLORS[safeRank] ?? RANK_COLORS[1];
  const isReady = state === "ready" && !locked;

  const safeCoinsReward = toFiniteNumber(coinsReward, 0);
  const safeCoinsToday = toFiniteNumber(coinsToday, 0);
  const safeCoinsTotal = toFiniteNumber(coinsTotal, 0);
  const safeWatchExp = Math.max(0, toFiniteNumber(watchExp, 0));
  const safeWatchMax = Math.max(1, toFiniteNumber(watchMax, 60));
  const safeProgress = Math.max(0, Math.min(1, toFiniteNumber(progress, 0)));
  const safeRankName =
    typeof rankName === "string" && rankName.trim()
      ? rankName
      : (RANK_NAMES[safeRank] ?? "Khán Giả");
  const remainingSeconds = Math.max(0, Math.ceil(safeWatchMax - safeWatchExp));
  const currentTier = (
    {
      1: { name: "Khán Giả", coins: 10, secs: 60 },
      2: { name: "Fan Cứng", coins: 20, secs: 55 },
      3: { name: "Sao Nổi", coins: 35, secs: 50 },
      4: { name: "Minh Tinh", coins: 55, secs: 45 },
      5: { name: "Huyền Thoại", coins: 80, secs: 40 },
    } as const
  )[safeRank] ?? {
    name: safeRankName,
    coins: safeCoinsReward,
    secs: safeWatchMax,
  };
  const CurrentRankBadgeIcon = RANK_BADGES[safeRank] ?? Flame;

  const rankStep = Math.max(1, Math.min(5, safeRank));

  const inner = (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        background: "rgba(12,12,12,0.98)",
        borderTop: isDesktop ? "none" : `2px solid ${PRIMARY}44`,
        borderRadius: isDesktop ? 16 : "20px 20px 0 0",
        maxHeight: isDesktop ? "85vh" : "90dvh",
        minHeight: isDesktop ? undefined : "60dvh",
      }}
    >
      {/* Drag handle (mobile only) */}
      {!isDesktop && (
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
      )}

      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2">
          <Gift size={18} style={{ color: PRIMARY }} />
          <span className="font-black text-white text-base">Hộp Quà</span>
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{
              background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`,
              color: "#fff",
            }}
          >
            {safeRankName}
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 hover:bg-white/10 transition-colors"
        >
          <X size={16} className="text-white/60" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="overflow-y-auto flex-1">
        {/* First-time free banner */}
        {safeCoinsTotal === 0 && isReady && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-3 rounded-2xl p-3 flex items-center gap-3"
            style={{
              background: `linear-gradient(135deg, ${PRIMARY}22, ${SECONDARY}14)`,
              border: `1px solid ${PRIMARY}55`,
            }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`,
              }}
            >
              <Gift size={16} color="#fff" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-xs">
                🎉 Lần đầu miễn phí!
              </p>
              <p className="text-white/55 text-[11px] mt-0.5">
                Hộp quà đầu tiên đã sẵn sàng — mở ngay để nhận xu và khám phá hệ
                thống phần thưởng.
              </p>
            </div>
          </motion.div>
        )}

        {/* Rank visual */}
        <div
          className="mx-4 mt-4 rounded-2xl p-4 flex items-center gap-4"
          style={{
            background: RANK_BG[safeRank] ?? RANK_BG[1],
            border: `1px solid ${PRIMARY}22`,
          }}
        >
          <div className="relative shrink-0">
            <GiftBoxIcon
              size={64}
              rank={safeRank}
              openProgress={isReady ? 0.3 : 0}
            />
            {isReady && (
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                style={{ boxShadow: `0 0 20px 8px ${PRIMARY}44` }}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-white font-black text-xl">
                {safeRankName}
              </span>
              <span className="text-white/50 text-xs">Cấp độ hộp quà</span>
            </div>
            <div className="flex items-center gap-1.5 mb-2">
              {RANK_STEPS.map((step) => (
                <div
                  key={step}
                  className="flex-1 h-1.5 rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: rankStep >= step ? "100%" : "0%",
                      background: `linear-gradient(90deg, ${PRIMARY}, ${SECONDARY})`,
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="text-white/40 text-[11px]">
              {nextRankName
                ? `Đang ở ${safeRankName} · Tiếp theo: ${nextRankName}`
                : "Đang ở cấp cao nhất"}
            </div>
          </div>
        </div>

        {/* Earnings stats */}
        <div className="mx-4 mt-3 grid grid-cols-2 gap-2">
          <div
            className="rounded-2xl p-3 flex flex-col gap-1"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <span className="text-[10px] text-white/40 font-medium">
              Hôm nay
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black" style={{ color: PRIMARY }}>
                {safeCoinsToday.toLocaleString("vi-VN")}
              </span>
              <span className="text-[11px] text-white/40">xu</span>
            </div>
          </div>
          <div
            className="rounded-2xl p-3 flex flex-col gap-1"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <span className="text-[10px] text-white/40 font-medium">
              Tổng cộng
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black" style={{ color: SECONDARY }}>
                {safeCoinsTotal.toLocaleString("vi-VN")}
              </span>
              <span className="text-[11px] text-white/40">xu</span>
            </div>
          </div>
        </div>

        {/* Reward preview */}
        <div className="mx-4 mt-3 grid grid-cols-2 gap-2">
          <div
            className="rounded-2xl p-3 flex flex-col items-center gap-1"
            style={{
              background: `${PRIMARY}14`,
              border: `1px solid ${PRIMARY}30`,
            }}
          >
            <span className="text-[11px] text-white/40 font-medium">
              Xu nhận được
            </span>
            <div className="flex items-center gap-1">
              <span className="text-lg font-black" style={{ color: PRIMARY }}>
                {locked
                  ? "???"
                  : safeCoinsReward > 0
                    ? `+${safeCoinsReward}`
                    : "---"}
              </span>
              <span className="text-[11px] text-white/40">xu</span>
            </div>
          </div>
          <div
            className="rounded-2xl p-3 flex flex-col items-center gap-1"
            style={{
              background: `${SECONDARY}14`,
              border: `1px solid ${SECONDARY}30`,
            }}
          >
            <span className="text-[11px] text-white/40 font-medium">
              Trạng thái bậc
            </span>
            <div className="flex items-center gap-1">
              <span className="text-lg font-black" style={{ color: SECONDARY }}>
                {locked ? "???" : `Bậc ${safeRank}`}
              </span>
              <span className="text-[11px] text-white/40">cố định</span>
            </div>
          </div>
        </div>

        {/* Fixed tier note */}
        <div
          className="mx-4 mt-3 rounded-2xl p-4"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Star size={14} style={{ color: PRIMARY }} />
            <span className="text-white/80 text-sm font-bold">
              Hệ thống bậc cố định
            </span>
            <span className="ml-auto text-white/50 text-xs font-mono">
              {nextRankName ? `Tiếp theo: ${nextRankName}` : "Đang cao nhất"}
            </span>
          </div>
          <div className="space-y-1.5">
            <p className="text-[11px] text-white/45">
              Mua gói bậc nào thì tài khoản được áp dụng ngay bậc đó.
            </p>
            <p className="text-[11px] text-white/35">
              Hệ thống chỉ dùng thời gian xem để mở hộp và nhận xu theo bậc hiện
              tại.
            </p>
            <div className="mt-1 flex justify-between text-[10px] text-white/30">
              <span>Bậc hiện tại: {safeRankName}</span>
              <span>
                {nextRankName
                  ? `Bậc kế tiếp: ${nextRankName}`
                  : "Đang ở bậc cao nhất"}
              </span>
            </div>
          </div>
        </div>

        {/* All rank levels overview */}
        <div
          className="mx-4 mt-3 rounded-2xl p-4"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Star size={14} style={{ color: PRIMARY }} />
            <span className="text-white/80 text-sm font-bold">
              Hành Trình Phần Thưởng
            </span>
          </div>
          <div className="space-y-2">
            <div
              className="flex items-center gap-3 rounded-2xl p-3"
              style={{
                background: `linear-gradient(135deg, ${PRIMARY}20, ${SECONDARY}0a)`,
                border: `1px solid ${PRIMARY}55`,
                boxShadow: `0 4px 24px -8px ${PRIMARY}40`,
              }}
            >
              <div
                className="relative w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${PRIMARY}30, ${SECONDARY}18)`,
                  border: `1px solid ${PRIMARY}44`,
                  boxShadow: `0 0 18px -4px ${PRIMARY}55`,
                }}
              >
                <GiftBoxIcon
                  size={38}
                  rank={safeRank}
                  openProgress={isReady ? 0.4 : 0}
                />
                <div
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`,
                    boxShadow: `0 0 8px ${PRIMARY}80`,
                  }}
                >
                  <CurrentRankBadgeIcon size={9} color="#fff" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className="text-xs font-black"
                    style={{ color: PRIMARY }}
                  >
                    {currentTier.name}
                  </span>
                  <span
                    className="text-[8px] font-black px-1.5 py-0.5 rounded-full tracking-wide"
                    style={{
                      background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`,
                      color: "#fff",
                    }}
                  >
                    ĐANG DÙNG
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-white/30">
                    Xem {currentTier.secs}s
                  </span>
                  <span className="text-[10px] text-white/15">·</span>
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: PRIMARY }}
                  >
                    +{currentTier.coins} xu
                  </span>
                </div>
              </div>

              <div
                className="text-sm font-black shrink-0 px-2.5 py-1 rounded-xl"
                style={{
                  background: `${PRIMARY}22`,
                  color: PRIMARY,
                  border: `1px solid ${PRIMARY}30`,
                }}
              >
                +{currentTier.coins}
              </div>
            </div>
          </div>
        </div>

        {/* Watch Progress */}
        <div
          className="mx-4 mt-3 rounded-2xl p-4"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} style={{ color: PRIMARY }} />
            <span className="text-white/80 text-sm font-bold">
              Tiến Độ Tích Lũy
            </span>
            <span className="ml-auto text-white/50 text-xs font-mono">
              {safeWatchExp}s / {safeWatchMax}s
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <motion.div
              className="h-full rounded-full"
              initial={false}
              animate={{ width: `${safeProgress * 100}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{
                background: `linear-gradient(90deg, ${PRIMARY}, ${SECONDARY})`,
              }}
            />
          </div>
          <div
            className="mt-2 text-[11px]"
            style={{ color: isReady ? PRIMARY : "rgba(255,255,255,0.3)" }}
          >
            {isReady
              ? "🎁 Hộp quà đã sẵn sàng!"
              : `Xem thêm ${remainingSeconds}s nữa để nhận quà`}
          </div>

          {/* Milestone ticks */}
          <div className="flex justify-between mt-3">
            {[0.25, 0.5, 0.75, 1].map((tick) => {
              const passed = safeProgress >= tick;
              return (
                <div key={tick} className="flex flex-col items-center gap-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
                    style={{
                      background: passed ? PRIMARY : "rgba(255,255,255,0.2)",
                    }}
                  />
                  <span
                    className="text-[9px]"
                    style={{
                      color: passed ? PRIMARY : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {Math.round(safeWatchMax * tick)}s
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* How it works */}
        <div
          className="mx-4 mt-3 mb-2 rounded-2xl p-4"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap size={13} style={{ color: SECONDARY }} />
            <span className="text-white/50 text-xs font-bold">
              Cách Nhận Thưởng
            </span>
          </div>
          <ul className="space-y-1.5">
            {[
              "Xem phim để tích lũy thời gian",
              "Đủ thời gian → hộp quà mở khóa",
              "Mở hộp để nhận xu theo bậc hiện tại",
              "Muốn thưởng cao hơn: nâng bậc trong trang gói bậc",
            ].map((t, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-[11px] text-white/40"
              >
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5"
                  style={{ background: `${PRIMARY}22`, color: PRIMARY }}
                >
                  {i + 1}
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Spacer for CTA */}
        <div className="h-4" />
      </div>

      {/* CTA button */}
      <div
        className="px-4 py-4 shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        {locked ? (
          <>
            <div className="flex items-center gap-2 mb-3 px-1">
              <Lock size={13} style={{ color: PRIMARY }} />
              <span className="text-white/50 text-xs">
                {isLoggedIn
                  ? "Mở gói bậc để tăng xu/phút và nhận quà tốt hơn"
                  : "Đăng nhập để nhận quà mỗi ngày"}
              </span>
            </div>
            <motion.button
              onClick={() => {
                onClose();
                if (!isLoggedIn) {
                  openLoginModal();
                  return;
                }
                router.push("/vip");
              }}
              className="w-full py-3.5 rounded-2xl font-black text-sm"
              style={{
                background: `linear-gradient(180deg, rgba(0,0,0,0.94), rgba(0,0,0,0.9)), linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`,
                color: "#fff",
                boxShadow: `0 0 24px ${PRIMARY}55`,
                border: "1px solid rgba(255,255,255,0.14)",
              }}
              whileTap={{ scale: 0.97 }}
            >
              {isLoggedIn ? "Mở Gói Bậc Ngay" : "Đăng Nhập Ngay"}
            </motion.button>
          </>
        ) : (
          <motion.button
            disabled={!isReady}
            onClick={() => {
              onClaim();
              onClose();
            }}
            className="w-full py-3.5 rounded-2xl font-black text-sm transition-all"
            style={{
              background: isReady
                ? `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`
                : "rgba(255,255,255,0.06)",
              color: isReady ? "#fff" : "rgba(255,255,255,0.25)",
              boxShadow: isReady ? `0 0 24px ${PRIMARY}55` : "none",
              cursor: isReady ? "pointer" : "not-allowed",
            }}
            whileTap={isReady ? { scale: 0.97 } : {}}
          >
            {isReady ? "Nhận Quà Ngay" : `Xem thêm ${remainingSeconds}s nữa...`}
          </motion.button>
        )}
      </div>
    </div>
  );

  if (!mounted) return null;

  if (isDesktop) {
    return createPortal(
      <AnimatePresence>
        {open && (
          <div
            className="fixed inset-0 pointer-events-none"
            style={{ zIndex: 2147483600 }}
          >
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
              style={{ zIndex: 1 }}
              onClick={onClose}
            />
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm transform-gpu pointer-events-auto"
              style={{ zIndex: 2 }}
            >
              {inner}
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body,
    );
  }

  // Mobile: drawer overlays bottom nav (anchored to bottom edge).
  const navBottom = "0px";

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 2147483600 }}
        >
          {/* Backdrop for full screen */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute left-0 right-0 top-0 bg-black/50 pointer-events-auto"
            style={{ zIndex: 1, bottom: navBottom }}
            onClick={onClose}
          />
          {/* Drawer anchored to screen bottom */}
          <motion.div
            key="drawer"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-0 right-0 transform-gpu pointer-events-auto"
            style={{ zIndex: 2, bottom: navBottom }}
          >
            {inner}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
