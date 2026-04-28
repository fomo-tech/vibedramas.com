"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Copy,
  Check,
  ChevronRight,
  Zap,
  Crown,
  Shield,
  Star,
  Gift,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import LoginCTA from "@/components/shared/LoginCTA";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Milestone {
  id: string;
  label: string;
  min: number;
  rate: number;
  bonus: number;
  color: string;
}

interface ReferralStats {
  referralCode: string | null;
  referralCount: number;
  coins: number;
  currentMilestone: Milestone;
  nextMilestone: Milestone | null;
  recentReferrals: {
    id: string;
    coinsAwarded: number;
    bonusAwarded: number;
    milestone?: string;
    createdAt: string;
  }[];
  allMilestones?: Milestone[]; // Add this to receive all milestones from API
}

// ─── Milestone icons ──────────────────────────────────────────────────────────

const MILESTONE_ICONS: Record<string, React.ElementType> = {
  newbie: Star,
  warrior: Shield,
  ambassador: Crown,
  legend: Zap,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ReferralPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    fetch(`/api/referral/stats?userId=${user.id}`)
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id]);

  const refLink = stats?.referralCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}?ref=${stats.referralCode}`
    : null;

  const copyLink = () => {
    if (!refLink) return;
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!mounted) return null;

  return (
    <div className="h-full bg-black overflow-y-auto pb-24 lg:pb-8">
      <div className="max-w-lg mx-auto lg:max-w-2xl">
        {/* Header */}
        <div className="px-4 lg:px-6 pt-6 lg:pt-8 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-vibe-pink/10 flex items-center justify-center">
              <Users size={16} className="text-vibe-pink" />
            </div>
            <h1 className="text-white font-black text-xl tracking-tight">
              Giới thiệu bạn bè
            </h1>
          </div>
          <p className="text-white/30 text-sm mt-2 pl-10 leading-relaxed">
            Mỗi người bạn giới thiệu — bạn nhận xu theo cấp bậc của mình.
          </p>
        </div>

        {!user ? (
          <LoginCTA
            icon={Users}
            title="Đăng nhập để giới thiệu"
            description="Giới thiệu bạn bè và nhận xu thưởng mỗi khi họ tham gia."
          />
        ) : loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-vibe-pink border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 px-4 lg:px-6">
            {/* Hero stats */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-2xl overflow-hidden border border-vibe-pink/20"
              style={{
                background:
                  "linear-gradient(135deg, #1a0907 0%, #0f0f0f 60%, #1a0500 100%)",
              }}
            >
              {/* glow */}
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-vibe-pink/15 blur-3xl pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-vibe-pink/60 via-orange-400/40 to-transparent" />

              <div className="relative p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-widest font-bold">
                    Đã giới thiệu
                  </p>
                  <p className="text-white font-black text-5xl tracking-tighter leading-none mt-1">
                    {stats?.referralCount ?? 0}
                    <span className="text-white/20 text-2xl ml-1">người</span>
                  </p>
                  {stats?.currentMilestone && (
                    <div className="flex items-center gap-1.5 mt-2">
                      {React.createElement(
                        MILESTONE_ICONS[stats.currentMilestone.id] ?? Star,
                        {
                          size: 12,
                          style: { color: stats.currentMilestone.color },
                        },
                      )}
                      <span
                        className="text-xs font-black"
                        style={{ color: stats.currentMilestone.color }}
                      >
                        {stats.currentMilestone.label}
                      </span>
                      <span className="text-white/20 text-xs">·</span>
                      <span className="text-white/40 text-xs">
                        +{stats.currentMilestone.rate} xu/người
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-white/40 text-xs uppercase tracking-widest font-bold">
                    Tổng xu
                  </p>
                  <p className="text-vibe-pink font-black text-3xl tracking-tighter leading-none mt-1">
                    {stats?.coins ?? 0}
                  </p>
                  <p className="text-white/20 text-[10px] mt-0.5">
                    xu tích luỹ
                  </p>
                </div>
              </div>

              {/* Progress to next milestone */}
              {stats?.nextMilestone && (
                <div className="relative px-5 pb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-white/30 text-[10px]">
                      Còn {stats.nextMilestone.min - (stats.referralCount ?? 0)}{" "}
                      người →{" "}
                      <span
                        className="font-bold"
                        style={{ color: stats.nextMilestone.color }}
                      >
                        {stats.nextMilestone.label}
                      </span>
                    </span>
                    <span className="text-white/30 text-[10px]">
                      {stats.referralCount}/{stats.nextMilestone.min}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(((stats.referralCount ?? 0) / stats.nextMilestone.min) * 100, 100)}%`,
                      }}
                      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full bg-vibe-pink"
                    />
                  </div>
                </div>
              )}
            </motion.div>

            {/* Ref link card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="rounded-2xl bg-zinc-900/60 border border-white/6 p-4"
            >
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3">
                Link giới thiệu của bạn
              </p>
              {refLink ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0 bg-black/60 border border-white/8 rounded-xl px-3 py-2.5">
                    <p className="text-white/50 text-xs truncate font-mono">
                      {refLink}
                    </p>
                  </div>
                  <button
                    onClick={copyLink}
                    className="w-10 h-10 rounded-xl bg-vibe-pink flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(255,69,0,0.3)] hover:shadow-[0_0_24px_rgba(255,69,0,0.5)] transition-all active:scale-95"
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Check size={16} className="text-white" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Copy size={16} className="text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </div>
              ) : (
                <p className="text-white/25 text-sm">
                  Link chưa được tạo. Vui lòng liên hệ hỗ trợ.
                </p>
              )}
            </motion.div>

            {/* Milestone ladder */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              className="rounded-2xl bg-zinc-900/60 border border-white/6 overflow-hidden"
            >
              <div className="px-4 pt-4 pb-2">
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest">
                  Bảng cấp bậc thưởng
                </p>
                <p className="text-white/25 text-[10px] mt-1">
                  Giới thiệu càng nhiều người, cấp bậc càng cao và xu nhận mỗi
                  người càng lớn.
                </p>
              </div>
              <div className="px-4 pb-4 space-y-2.5 mt-1">
                {(
                  stats?.allMilestones || [
                    stats?.currentMilestone,
                    stats?.nextMilestone,
                  ]
                )
                  .filter((m): m is Milestone => m !== null && m !== undefined)
                  .slice()
                  .sort((a, b) => a.min - b.min)
                  .map((m) => {
                    const Icon = MILESTONE_ICONS[m.id] ?? Star;
                    const isActive = stats?.currentMilestone.id === m.id;
                    const count = stats?.referralCount ?? 0;
                    const isPast = count >= m.min;

                    // Progress: how far through THIS tier the user is
                    // Get next milestone after this one to calculate tier range
                    const allSorted = (
                      stats?.allMilestones || [
                        stats?.currentMilestone,
                        stats?.nextMilestone,
                      ]
                    )
                      .filter(
                        (x): x is Milestone => x !== null && x !== undefined,
                      )
                      .sort((a, b) => a.min - b.min);
                    const tierIdx = allSorted.findIndex((x) => x.id === m.id);
                    const nextM = allSorted[tierIdx + 1] ?? null;

                    let progressPct = 0;
                    if (isPast && !nextM) {
                      progressPct = 100; // max tier, fully filled
                    } else if (isActive && nextM) {
                      progressPct = Math.min(
                        100,
                        ((count - m.min) / (nextM.min - m.min)) * 100,
                      );
                    } else if (isPast) {
                      progressPct = 100;
                    }

                    return (
                      <div
                        key={m.id}
                        className="rounded-2xl p-3"
                        style={{
                          background: isActive
                            ? `linear-gradient(135deg, ${m.color}18, rgba(0,0,0,0))`
                            : "rgba(255,255,255,0.025)",
                          border: `1px solid ${isActive ? m.color + "44" : "rgba(255,255,255,0.06)"}`,
                        }}
                      >
                        <div className="flex items-center gap-2.5 mb-2">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              background: isPast
                                ? `${m.color}22`
                                : "rgba(255,255,255,0.04)",
                              border: `1px solid ${isPast ? m.color + "44" : "rgba(255,255,255,0.06)"}`,
                            }}
                          >
                            <Icon
                              size={14}
                              style={{
                                color: isPast
                                  ? m.color
                                  : "rgba(255,255,255,0.2)",
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p
                                className="text-sm font-black"
                                style={{
                                  color: isPast
                                    ? "white"
                                    : "rgba(255,255,255,0.3)",
                                }}
                              >
                                {m.label}
                              </p>
                              {isActive && (
                                <span
                                  className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                                  style={{
                                    background: `${m.color}22`,
                                    color: m.color,
                                  }}
                                >
                                  ĐANG Ở ĐÂY
                                </span>
                              )}
                              {isPast && !isActive && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/8 text-white/30">
                                  ĐÃ ĐẠT
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-white/25 mt-0.5">
                              Từ {m.min} người trở lên
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p
                              className="text-sm font-black"
                              style={{
                                color: isPast
                                  ? m.color
                                  : "rgba(255,255,255,0.2)",
                              }}
                            >
                              +{m.rate} xu
                            </p>
                            <p className="text-[10px] text-white/20">
                              mỗi người
                            </p>
                            {m.bonus > 0 && (
                              <p
                                className="text-[9px] font-bold"
                                style={{
                                  color: isPast
                                    ? m.color + "cc"
                                    : "rgba(255,255,255,0.15)",
                                }}
                              >
                                +{m.bonus} thưởng
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Progress bar for this tier */}
                        {(isActive || (isPast && nextM)) && (
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[9px] text-white/25">
                                {isActive
                                  ? nextM
                                    ? `${count} / ${nextM.min} người → ${nextM.label}`
                                    : `${count} người — cấp cao nhất`
                                  : `Đã đạt ${m.min}+ người`}
                              </span>
                              <span
                                className="text-[9px] font-bold"
                                style={{ color: m.color }}
                              >
                                {Math.round(progressPct)}%
                              </span>
                            </div>
                            <div
                              className="h-1.5 rounded-full overflow-hidden"
                              style={{ background: "rgba(255,255,255,0.06)" }}
                            >
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPct}%` }}
                                transition={{
                                  duration: 0.9,
                                  ease: [0.22, 1, 0.36, 1],
                                }}
                                className="h-full rounded-full"
                                style={{
                                  background: `linear-gradient(90deg, ${m.color}, ${m.color}bb)`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </motion.div>

            {/* Recent referrals */}
            {stats?.recentReferrals && stats.recentReferrals.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl bg-zinc-900/60 border border-white/6 overflow-hidden"
              >
                <div className="px-4 pt-4 pb-2">
                  <p className="text-white/50 text-xs font-bold uppercase tracking-widest">
                    Lịch sử giới thiệu
                  </p>
                </div>
                <div className="divide-y divide-white/5">
                  {stats.recentReferrals.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-vibe-pink/10 border border-vibe-pink/20 flex items-center justify-center shrink-0">
                          <Users size={12} className="text-vibe-pink/60" />
                        </div>
                        <div>
                          <p className="text-white/70 text-sm font-bold">
                            Bạn mới tham gia
                          </p>
                          <p className="text-white/25 text-[10px] mt-0.5">
                            {timeAgo(r.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-vibe-pink font-black text-sm">
                          +{r.coinsAwarded} xu
                        </p>
                        {r.bonusAwarded > 0 && (
                          <p className="text-yellow-400/70 text-[10px] font-bold">
                            +{r.bonusAwarded} bonus
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* How it works */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
              className="rounded-2xl bg-zinc-900/40 border border-white/4 p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Gift size={14} className="text-vibe-pink/60" />
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
                  Cách hoạt động
                </p>
              </div>
              <div className="space-y-3">
                {[
                  { step: "1", text: "Sao chép link và chia sẻ với bạn bè" },
                  { step: "2", text: "Bạn bè đăng ký qua link của bạn" },
                  { step: "3", text: "Bạn nhận xu ngay lập tức theo cấp bậc" },
                  {
                    step: "4",
                    text: "Càng nhiều người → cấp cao hơn → xu nhiều hơn",
                  },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-vibe-pink/15 border border-vibe-pink/25 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-vibe-pink text-[9px] font-black">
                        {step}
                      </span>
                    </div>
                    <p className="text-white/40 text-sm leading-relaxed">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
