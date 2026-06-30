"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock3,
  Gift,
  LockKeyhole,
  Play,
  Sparkles,
  Trophy,
  WalletCards,
  Zap,
} from "lucide-react";
import CoinIcon from "@/components/ui/CoinIcon";
import GiftBoxIcon from "@/components/home/gift/GiftBoxIcon";
import { useGiftRanks, type GiftRankTier } from "@/hooks/useGiftRanks";
import { useAuthStore } from "@/store/useAuthStore";
import { API_ROUTES } from "@/lib/api";
import {
  RANK_BADGES,
  RANK_COLORS,
} from "@/components/home/gift/giftConstants";

interface RewardConfig {
  rank: number;
  rankName: string;
  nextRankName: string | null;
  watchMax: number;
  coinsReward: number;
  expReward: number;
  giftExp: number;
  currentRankExp: number;
  nextRankExp: number | null;
  coinsToday: number;
  coinsTotal: number;
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function VipPage() {
  const router = useRouter();
  const { user, coins, openLoginModal } = useAuthStore();
  const { ranks, loading: ranksLoading } = useGiftRanks();
  const [config, setConfig] = useState<RewardConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    fetch(API_ROUTES.gift.config, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("reward config failed");
        return (await response.json()) as RewardConfig;
      })
      .then((data) => {
        if (!cancelled) setConfig(data);
      })
      .catch(() => {
        if (!cancelled) setConfig(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const levelProgress = useMemo(() => {
    if (!config || config.nextRankExp === null) return 1;
    const span = Math.max(1, config.nextRankExp - config.currentRankExp);
    return Math.max(
      0,
      Math.min(1, (config.giftExp - config.currentRankExp) / span),
    );
  }, [config]);

  const rank = Math.max(1, Math.min(5, numberValue(config?.rank, 1)));
  const [primary, secondary] = RANK_COLORS[rank] ?? RANK_COLORS[1];
  const RankIcon = RANK_BADGES[rank] ?? Trophy;
  const remainingExp =
    config?.nextRankExp === null
      ? 0
      : Math.max(
          0,
          numberValue(config?.nextRankExp) - numberValue(config?.giftExp),
        );

  return (
    <div
      data-testid="vip-scroll"
      className="h-full min-h-0 overflow-y-auto overscroll-y-contain bg-[#050403] text-white [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch]"
      style={{ backgroundColor: "#050403" }}
    >
      <header className="sticky top-0 z-30 border-b border-orange-500/15 bg-[#070504]/92 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center gap-3 px-4 py-3 lg:px-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-orange-400/15 bg-orange-500/5 text-white/65 transition hover:border-orange-400/30 hover:bg-orange-500/10 hover:text-white"
            aria-label="Quay lại"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-black lg:text-lg">
              Phần thưởng
            </h1>
            <p className="truncate text-[11px] text-white/38">
              Xem phim · Mở hộp · Tăng level
            </p>
          </div>
          <div className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-orange-400/25 bg-linear-to-r from-orange-500/12 to-amber-300/8 px-3 shadow-[0_0_24px_rgba(255,69,0,0.08)]">
            <CoinIcon size={18} />
            <span className="text-sm font-black text-amber-100">
              {numberValue(coins).toLocaleString("vi-VN")}
            </span>
          </div>
        </div>
      </header>

      {!user ? (
        <GuestState onLogin={openLoginModal} />
      ) : loading ? (
        <RewardSkeleton />
      ) : (
        <main className="mx-auto max-w-6xl px-4 pb-32 pt-5 lg:px-8 lg:pb-12 lg:pt-8">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-lg border border-orange-500/25 bg-linear-to-br from-[#210b05] via-[#120806] to-[#090807] shadow-[0_24px_80px_-46px_rgba(255,69,0,0.8)]"
          >
            <div
              className="h-1 w-full"
              style={{
                background:
                  "linear-gradient(90deg, " +
                  primary +
                  ", " +
                  secondary +
                  ", #fbbf24)",
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  "linear-gradient(115deg, transparent 0%, rgba(255,69,0,.12) 38%, transparent 39%), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)",
                backgroundSize: "100% 100%, 42px 42px",
              }}
            />

            <div className="grid items-center gap-6 px-5 py-6 sm:px-7 lg:grid-cols-[220px_1fr_auto] lg:gap-8 lg:px-9 lg:py-8">
              <div className="flex justify-center lg:justify-start">
                <LevelVisual
                  rank={rank}
                  progress={levelProgress}
                  primary={primary}
                  secondary={secondary}
                />
              </div>

              <div className="min-w-0 text-center lg:text-left">
                <div className="flex items-center justify-center gap-2 lg:justify-start">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-black uppercase"
                    style={{
                      borderColor: primary + "55",
                      background: primary + "15",
                      color: primary,
                    }}
                  >
                    <RankIcon size={12} />
                    Level {rank}
                  </span>
                  {config?.nextRankExp === null && (
                    <span className="rounded-md border border-amber-300/25 bg-amber-300/10 px-2 py-1 text-[10px] font-black uppercase text-amber-200">
                      Tối đa
                    </span>
                  )}
                </div>

                <h2 className="mt-3 text-3xl font-black lg:text-4xl">
                  {config?.rankName ?? "Khán Giả"}
                </h2>
                <p className="mt-2 text-sm text-white/45">
                  Mỗi hộp nhận{" "}
                  <strong className="text-amber-200">
                    {numberValue(config?.coinsReward)} xu
                  </strong>{" "}
                  và{" "}
                  <strong className="text-orange-200">
                    {numberValue(config?.expReward)} EXP
                  </strong>
                </p>

                <div className="mx-auto mt-6 max-w-xl lg:mx-0">
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                    <span className="font-bold text-white/65">
                      {config?.nextRankName
                        ? "Tiến tới " + config.nextRankName
                        : "Đã đạt level cao nhất"}
                    </span>
                    <span className="shrink-0 font-bold text-white/38">
                      {config?.nextRankExp === null
                        ? numberValue(config?.giftExp).toLocaleString("vi-VN") +
                          " EXP"
                        : remainingExp.toLocaleString("vi-VN") +
                          " EXP còn lại"}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full border border-white/5 bg-black/50 p-0.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: levelProgress * 100 + "%" }}
                      transition={{ duration: 0.75, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{
                        background:
                          "linear-gradient(90deg, " +
                          primary +
                          ", " +
                          secondary +
                          ")",
                        boxShadow: "0 0 14px " + primary + "80",
                      }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] font-bold text-white/28">
                    <span>
                      {numberValue(config?.giftExp).toLocaleString("vi-VN")} EXP
                    </span>
                    <span>
                      {config?.nextRankExp === null
                        ? "MAX"
                        : numberValue(config?.nextRankExp).toLocaleString(
                            "vi-VN",
                          ) + " EXP"}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/foryou"
                className="group mx-auto flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#ff4500] to-[#ff6b2b] px-5 text-sm font-black text-white shadow-[0_10px_28px_-12px_rgba(255,69,0,0.9)] transition hover:brightness-110 lg:mx-0 lg:w-auto"
              >
                <Play size={17} fill="currentColor" />
                Xem phim ngay
                <ArrowUpRight
                  size={16}
                  className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </motion.section>

          <section className="mt-4 grid grid-cols-2 overflow-hidden rounded-lg border border-orange-500/15 bg-[#0d0806] sm:grid-cols-4">
            <RewardStat
              icon={<CoinIcon size={21} />}
              label="Xu hôm nay"
              value={numberValue(config?.coinsToday).toLocaleString("vi-VN")}
            />
            <RewardStat
              icon={<WalletCards size={20} className="text-orange-300" />}
              label="Tổng xu nhận"
              value={numberValue(config?.coinsTotal).toLocaleString("vi-VN")}
            />
            <RewardStat
              icon={<Clock3 size={20} className="text-rose-300" />}
              label="Thời gian / hộp"
              value={numberValue(config?.watchMax, 60) + " giây"}
            />
            <RewardStat
              icon={<Zap size={20} className="text-amber-300" />}
              label="EXP / hộp"
              value={"+" + numberValue(config?.expReward)}
            />
          </section>

          <section className="mt-8">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase text-vibe-pink">
                  Lộ trình phần thưởng
                </p>
                <h2 className="mt-1 text-xl font-black lg:text-2xl">
                  Các mốc level
                </h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-orange-200/45">
                <Sparkles size={14} />
                Tự động nâng cấp
              </div>
            </div>

            {ranksLoading ? (
              <div className="h-48 animate-pulse rounded-lg bg-white/5" />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                {ranks.map((tier) => (
                  <RankCard
                    key={tier.rank}
                    tier={tier}
                    currentRank={rank}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="mt-8 flex flex-col gap-4 border-t border-orange-500/15 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                <Gift size={18} className="text-amber-200" />
              </div>
              <div>
                <p className="text-sm font-black">Hộp quà đang chờ bạn</p>
                <p className="mt-0.5 text-xs text-white/38">
                  Tiến độ được tính khi video đang phát
                </p>
              </div>
            </div>
            <Link
              href="/foryou"
              className="flex h-11 items-center justify-center gap-2 rounded-lg border border-orange-500/40 bg-orange-500/10 px-5 text-sm font-black text-orange-300 transition hover:bg-orange-500 hover:text-white"
            >
              Bắt đầu xem
              <ChevronRight size={16} />
            </Link>
          </section>
        </main>
      )}
    </div>
  );
}

function LevelVisual({
  rank,
  progress,
  primary,
  secondary,
}: {
  rank: number;
  progress: number;
  primary: string;
  secondary: string;
}) {
  const radius = 76;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative h-44 w-44 shrink-0 lg:h-48 lg:w-48">
      <svg
        viewBox="0 0 176 176"
        className="absolute inset-0 h-full w-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="88"
          cy="88"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="5"
        />
        <motion.circle
          cx="88"
          cy="88"
          r={radius}
          fill="none"
          stroke={primary}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - progress) }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ filter: "drop-shadow(0 0 5px " + primary + ")" }}
        />
      </svg>
      <div
        className="absolute inset-4 flex items-center justify-center rounded-full border"
        style={{
          borderColor: primary + "35",
          background:
            "linear-gradient(145deg, " +
            primary +
            "18, #0b0b0b 58%, " +
            secondary +
            "12)",
        }}
      >
        <GiftBoxIcon size={104} rank={rank} openProgress={0.08} />
      </div>
      <div
        className="absolute bottom-1 left-1/2 flex h-7 min-w-14 -translate-x-1/2 items-center justify-center rounded-md border bg-[#0b0b0b] px-2 text-xs font-black"
        style={{ borderColor: primary + "55", color: primary }}
      >
        LV.{rank}
      </div>
    </div>
  );
}

function RewardStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-24 items-center gap-3 border-b border-r border-white/8 p-4 last:border-r-0 sm:border-b-0 lg:px-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-orange-400/15 bg-orange-500/6">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[10px] font-bold uppercase text-white/32">
          {label}
        </p>
        <p className="mt-1 truncate text-lg font-black text-white">{value}</p>
      </div>
    </div>
  );
}

function RankCard({
  tier,
  currentRank,
}: {
  tier: GiftRankTier;
  currentRank: number;
}) {
  const current = tier.rank === currentRank;
  const unlocked = tier.rank <= currentRank;
  const [primary, secondary] = RANK_COLORS[tier.rank] ?? RANK_COLORS[1];
  const Icon = RANK_BADGES[tier.rank] ?? Trophy;

  return (
    <motion.article
      whileHover={{ y: -3 }}
      className="relative overflow-hidden rounded-lg border bg-linear-to-b from-[#160b07] to-[#0b0807] p-4"
      style={{
        borderColor: current ? primary + "66" : "rgba(255,255,255,0.09)",
        boxShadow: current ? "0 14px 36px -24px " + primary : "none",
      }}
    >
      {current && (
        <div
          className="absolute inset-x-0 top-0 h-0.5"
          style={{
            background:
              "linear-gradient(90deg, " + primary + ", " + secondary + ")",
          }}
        />
      )}
      <div className="flex items-start justify-between gap-3">
        <div
          className="relative flex h-16 w-16 items-center justify-center"
          style={{
            filter: unlocked ? "none" : "grayscale(0.7)",
            opacity: unlocked ? 1 : 0.62,
          }}
        >
          <GiftBoxIcon size={62} rank={tier.rank} />
          <div
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-md border bg-[#100806]"
            style={{ borderColor: primary + "45", color: primary }}
          >
            <Icon size={12} />
          </div>
        </div>
        <div
          className="flex h-6 items-center gap-1 rounded-md border px-2 text-[9px] font-black uppercase"
          style={{
            borderColor: current
              ? primary + "45"
              : "rgba(255,255,255,.08)",
            background: current ? primary + "12" : "rgba(255,255,255,.03)",
            color: current ? primary : "rgba(255,255,255,.38)",
          }}
        >
          {current ? (
            <>
              <Check size={10} /> Hiện tại
            </>
          ) : unlocked ? (
            "Đã mở"
          ) : (
            <>
              <LockKeyhole size={10} /> Chưa mở
            </>
          )}
        </div>
      </div>

      <p className="mt-3 text-[10px] font-black uppercase text-orange-200/35">
        Level {tier.rank}
      </p>
      <h3 className="mt-1 truncate text-base font-black">{tier.name}</h3>
      <p className="mt-1 text-[11px] text-white/38">
        {numberValue(tier.requiredExp).toLocaleString("vi-VN")} EXP để mở khóa
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3">
        <div className="flex items-center gap-1.5 text-xs font-black text-amber-200">
          <CoinIcon size={16} />+{numberValue(tier.coinsReward)}
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold text-orange-300">
          <Zap size={13} />+{numberValue(tier.expReward)} EXP
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1 text-[10px] text-white/28">
        <Clock3 size={11} />
        {numberValue(tier.watchSeconds)} giây mỗi hộp
      </div>
    </motion.article>
  );
}

function GuestState({ onLogin }: { onLogin: () => void }) {
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-6xl items-center justify-center px-5 pb-24 text-center">
      <div className="max-w-sm">
        <div className="mx-auto flex h-24 w-24 items-center justify-center">
          <GiftBoxIcon size={92} rank={1} locked />
        </div>
        <h2 className="mt-5 text-2xl font-black">Đăng nhập để tích EXP</h2>
        <p className="mt-2 text-sm leading-6 text-white/42">
          Tiến độ xem, xu và level sẽ được lưu theo tài khoản của bạn.
        </p>
        <button
          type="button"
          onClick={onLogin}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-white px-5 text-sm font-black text-black transition hover:bg-amber-100"
        >
          Đăng nhập
          <ChevronRight size={17} />
        </button>
      </div>
    </main>
  );
}

function RewardSkeleton() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
      <div className="h-80 animate-pulse rounded-lg bg-white/5" />
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-24 animate-pulse rounded-lg bg-white/5" />
        ))}
      </div>
    </main>
  );
}
