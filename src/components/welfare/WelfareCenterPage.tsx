"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Gift,
  Link2,
  Shield,
  Users,
  Video,
  ChevronRight,
  Zap,
  PawPrint,
  Gamepad2,
  Trophy,
  Star,
  CheckCircle2,
  Wallet,
  Sparkles,
  LogIn,
} from "lucide-react";
import CoinIcon from "@/components/ui/CoinIcon";
import LoginCTA from "@/components/shared/LoginCTA";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/hooks/useToast";

type WelfareTask = {
  id: string;
  title: string;
  subtitle: string;
  reward: number;
  actionLabel: string;
  icon: "login" | "notifications" | "watch_ad" | "facebook";
  actionType:
    | "login"
    | "notifications"
    | "watch_ad"
    | "follow_facebook"
    | "custom";
  enabled: boolean;
  dailyLimit: number;
  totalLimit: number;
  requiresImageProof: boolean;
  linkUrl?: string;
  order: number;
  todayCount: number;
  totalCount: number;
  dailyRemaining: number | null;
  totalRemaining: number | null;
  canClaim: boolean;
};

type WelfareSummaryResponse = {
  config: {
    headerTitle: string;
    headerSubtitle: string;
    rewardsTabLabel: string;
    memberTabLabel: string;
    dailyCheckInRewards: number[];
    tasks: WelfareTask[];
  };
  user: null | {
    coins: number;
    bonusCoins: number;
    stats: {
      earnedToday: number;
      earnedAllTime: number;
      spentToday: number;
      spentAllTime: number;
    };
    checkIn: {
      todayClaimed: boolean;
      currentDay: number;
      nextDay: number;
      rewards: number[];
      nextReward: number;
    };
    tasks: WelfareTask[];
  };
};

type GiftConfigResponse = {
  rank: number;
  rankName: string;
  nextRankName: string | null;
  coinsReward: number;
  coinsToday: number;
  coinsTotal: number;
};

const TASK_ICONS = {
  login: Link2,
  notifications: Bell,
  watch_ad: Video,
  facebook: Users,
} as const;

const TAB_ANIM = {
  initial: { opacity: 0, y: 14, filter: "blur(3px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -10, filter: "blur(2px)" },
};

const LIST_ANIM = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

const ITEM_ANIM = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

function formatNumber(value: number) {
  return value.toLocaleString("vi-VN");
}

function taskAccent(task: WelfareTask) {
  switch (task.actionType) {
    case "watch_ad":
      return {
        tint: "rgba(255, 15, 99, 0.18)",
        border: "rgba(255, 15, 99, 0.35)",
        icon: "#ff4d8d",
      };
    case "notifications":
      return {
        tint: "rgba(251, 191, 36, 0.16)",
        border: "rgba(251, 191, 36, 0.3)",
        icon: "#fbbf24",
      };
    case "follow_facebook":
      return {
        tint: "rgba(96, 165, 250, 0.16)",
        border: "rgba(96, 165, 250, 0.3)",
        icon: "#60a5fa",
      };
    case "login":
      return {
        tint: "rgba(52, 211, 153, 0.16)",
        border: "rgba(52, 211, 153, 0.3)",
        icon: "#34d399",
      };
    default:
      return {
        tint: "rgba(255, 107, 43, 0.16)",
        border: "rgba(255, 107, 43, 0.3)",
        icon: "#ff6b2b",
      };
  }
}

function CheckInDay({
  day,
  reward,
  active,
  completed,
}: {
  day: number;
  reward: number;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div
      className={`relative w-full aspect-[4/5] rounded-2xl border flex flex-col items-center justify-center transition-all duration-300 ${
        active
          ? "border-vibe-pink bg-vibe-pink/10 shadow-[0_0_15px_rgba(255,69,0,0.2)]"
          : completed
            ? "border-white/10 bg-white/5"
            : "border-white/5 bg-white/[0.02]"
      }`}
    >
      <p
        className={`text-[10px] font-black tracking-tight ${active ? "text-vibe-pink" : "text-white/45"}`}
      >
        N{day}
      </p>
      <div className="my-2 relative">
        {active && (
          <motion.div
            layoutId="active-glow"
            className="absolute inset-0 bg-vibe-pink/40 blur-xl rounded-full"
          />
        )}
        <div
          className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
            active
              ? "bg-gradient-vibe shadow-lg shadow-vibe-pink/20"
              : completed
                ? "bg-white/10"
                : "bg-white/5"
          }`}
        >
          {completed ? (
            <CheckCircle2 size={16} className="text-white" />
          ) : (
            <CoinIcon size={active ? 18 : 16} />
          )}
        </div>
      </div>
      <p
        className={`text-[11px] font-bold ${active ? "text-white" : "text-white/30"}`}
      >
        +{reward}
      </p>

      {active && (
        <div className="absolute -top-1 -right-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-vibe-pink opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-vibe-pink"></span>
          </span>
        </div>
      )}
    </div>
  );
}

function TaskCard({
  task,
  loading,
  proofName,
  onSelectProof,
  onClearProof,
  onClaim,
}: {
  task: WelfareTask;
  loading: boolean;
  proofName?: string;
  onSelectProof: (task: WelfareTask, file: File | null) => void;
  onClearProof: (taskId: string) => void;
  onClaim: (task: WelfareTask) => void;
}) {
  const Icon = TASK_ICONS[task.icon];
  const accent = taskAccent(task);

  return (
    <motion.div
      variants={ITEM_ANIM}
      className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:bg-white/8 hover:border-white/20"
    >
      <div
        className="absolute -right-4 -top-4 h-24 w-24 rounded-full blur-[40px] opacity-20 transition-opacity group-hover:opacity-30"
        style={{ background: accent.icon }}
      />

      <div className="flex items-start gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition-transform duration-500 group-hover:scale-110"
          style={{
            background: `linear-gradient(135deg, ${accent.tint}, transparent)`,
            borderColor: accent.border,
          }}
        >
          <Icon size={24} style={{ color: accent.icon }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-black text-white leading-tight">
                {task.title}
              </h3>
              <div className="mt-1 flex items-center gap-1.5 text-vibe-pink">
                <CoinIcon size={12} />
                <span className="text-xs font-black">
                  +{formatNumber(task.reward)} xu
                </span>
              </div>
            </div>
            {task.dailyLimit > 0 && (
              <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                  {task.todayCount}/{task.dailyLimit}
                </span>
              </div>
            )}
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-white/40 line-clamp-2">
            {task.subtitle}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
          {task.totalLimit > 0
            ? `${task.totalCount}/${task.totalLimit} lần`
            : "Vô tận"}
        </div>
        <button
          onClick={() => onClaim(task)}
          disabled={loading || !task.canClaim}
          className={`relative h-10 px-6 rounded-xl text-xs font-black transition-all active:scale-95 disabled:opacity-40 shadow-lg shadow-black/20 ${
            task.canClaim
              ? "bg-gradient-vibe text-white"
              : "bg-white/5 border border-white/10 text-white/30"
          }`}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Đang xử lý</span>
            </div>
          ) : task.canClaim ? (
            task.actionLabel
          ) : (
            "Hoàn thành"
          )}
        </button>
      </div>

      {task.requiresImageProof && (
        <div className="mt-4 rounded-2xl border border-white/5 bg-black/20 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-white/25 uppercase tracking-tighter">
              Bằng chứng hình ảnh
            </span>
            {proofName && (
              <button
                onClick={() => onClearProof(task.id)}
                className="text-[10px] font-black text-vibe-pink/60 hover:text-vibe-pink"
              >
                XÓA ✕
              </button>
            )}
          </div>
          <label className="mt-2.5 flex items-center justify-center w-full h-12 rounded-xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
            <span className="text-xs font-bold text-white/40">
              {proofName || "Gửi ảnh minh chứng"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) =>
                onSelectProof(task, event.target.files?.[0] ?? null)
              }
            />
          </label>
        </div>
      )}
    </motion.div>
  );
}

export default function WelfareCenterPage() {
  const { user, openLoginModal, setCoins } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"rewards" | "member">("rewards");
  const [summary, setSummary] = useState<WelfareSummaryResponse | null>(null);
  const [giftConfig, setGiftConfig] = useState<GiftConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [proofByTask, setProofByTask] = useState<
    Record<string, { dataUrl: string; name: string }>
  >({});

  const tasks = useMemo(() => {
    return [...(summary?.user?.tasks ?? [])].sort((a, b) => a.order - b.order);
  }, [summary?.user?.tasks]);

  const rewardsUser = summary?.user;

  async function loadSummary() {
    setLoading(true);
    try {
      const res = await fetch("/api/welfare/summary");
      const data = (await res.json()) as WelfareSummaryResponse;
      setSummary(data);
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadGiftConfig() {
    if (!user) {
      setGiftConfig(null);
      return;
    }

    try {
      const res = await fetch("/api/gift/config");
      if (!res.ok) {
        setGiftConfig(null);
        return;
      }
      const data = (await res.json()) as GiftConfigResponse;
      setGiftConfig(data);
    } catch {
      setGiftConfig(null);
    }
  }

  useEffect(() => {
    loadSummary();
    loadGiftConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function handleCheckIn() {
    setClaimingId("daily_checkin");
    try {
      const res = await fetch("/api/welfare/check-in", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(
          "Lỗi điểm danh",
          data.error ?? "Không thể điểm danh lúc này",
        );
        return;
      }
      setCoins(data.coins ?? 0);
      toast.success(
        "Điểm danh thành công",
        `Nhận ${formatNumber(data.reward)} xu`,
      );
      await loadSummary();
    } catch {
      toast.error("Lỗi kết nối", "Không thể kết nối server");
    } finally {
      setClaimingId(null);
    }
  }

  async function handleTaskClaim(task: WelfareTask) {
    if (task.actionType === "login" && !user) {
      openLoginModal();
      return;
    }

    const payload: Record<string, unknown> = {};

    if (task.requiresImageProof) {
      const proof = proofByTask[task.id];
      if (!proof?.dataUrl) {
        toast.error(
          "Thiếu ảnh minh chứng",
          "Vui lòng upload ảnh minh chứng trước khi nhận thưởng",
        );
        return;
      }
      payload.proofImageData = proof.dataUrl;
      payload.proofImageName = proof.name;
    }
    if (task.actionType === "notifications") {
      if (typeof Notification === "undefined") {
        toast.error(
          "Không hỗ trợ",
          "Thiết bị này không hỗ trợ thông báo trình duyệt",
        );
        return;
      }

      let permission = Notification.permission;
      if (permission !== "granted") {
        permission = await Notification.requestPermission();
      }

      if (permission !== "granted") {
        toast.error(
          "Chưa cho phép",
          "Bạn cần cho phép thông báo để nhận thưởng",
        );
        return;
      }

      payload.notificationPermission = permission;
    }

    if (
      task.linkUrl &&
      (task.actionType === "follow_facebook" || task.actionType === "custom")
    ) {
      window.open(task.linkUrl, "_blank", "noopener,noreferrer");
    }

    setClaimingId(task.id);
    try {
      const res = await fetch(`/api/welfare/tasks/${task.id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(
          "Lỗi nhận thưởng",
          data.error ?? "Không thể nhận thưởng lúc này",
        );
        return;
      }
      setCoins(data.coins ?? 0);
      toast.success(
        "Nhận thưởng thành công",
        `+${formatNumber(data.reward)} xu từ ${task.title}`,
      );
      if (task.requiresImageProof) {
        setProofByTask((prev) => {
          const next = { ...prev };
          delete next[task.id];
          return next;
        });
      }
      await loadSummary();
    } catch {
      toast.error("Lỗi kết nối", "Không thể kết nối server");
    } finally {
      setClaimingId(null);
    }
  }

  function handleSelectProof(task: WelfareTask, file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File không hợp lệ", "Chỉ hỗ trợ file ảnh");
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      toast.error(
        "File quá lớn",
        "Ảnh quá lớn, vui lòng chọn ảnh nhỏ hơn 1.5MB",
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) {
        toast.error("Lỗi đọc file", "Không đọc được ảnh minh chứng");
        return;
      }
      setProofByTask((prev) => ({
        ...prev,
        [task.id]: { dataUrl, name: file.name },
      }));
    };
    reader.onerror = () =>
      toast.error("Lỗi đọc file", "Không đọc được ảnh minh chứng");
    reader.readAsDataURL(file);
  }

  function clearProof(taskId: string) {
    setProofByTask((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  }

  return (
    <div className="min-h-full h-full overflow-y-auto bg-[#050505] pb-32 lg:pb-12 text-white selection:bg-vibe-pink/30">
      <div className="mx-auto max-w-lg lg:max-w-4xl xl:max-w-6xl">
        {/* Premium Banner Header */}
        <div className="relative pt-10 pb-20 px-6 overflow-hidden">
          {/* Background Ambient Spheres */}
          <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-vibe-pink/15 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-[-5%] w-[250px] h-[250px] bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 w-fit"
              >
                <Sparkles size={12} className="text-vibe-pink animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                  Vibe Rewards Program
                </span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl lg:text-5xl font-black tracking-tight"
              >
                Trạm <span className="text-vibe-pink">Phúc Lợi</span>
              </motion.h1>
              <p className="text-sm text-white/40 max-w-sm">
                Tích lũy xu thưởng từ các hoạt động hàng ngày và đổi lấy quà
                tặng giá trị.
              </p>
            </div>

            {/* Wallet Quick View */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-4 bg-white/[0.03] backdrop-blur-md border border-white/10 p-5 rounded-[2.5rem] shadow-2xl"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-vibe flex items-center justify-center shadow-[0_0_20px_rgba(255,69,0,0.3)]">
                <Wallet className="text-white" size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                  Ví xu khả dụng
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-3xl font-black tracking-tighter">
                    {formatNumber(rewardsUser?.coins ?? 0)}
                  </span>
                  <CoinIcon size={20} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="px-6 -mt-10 relative z-20">
          {/* Tab Navigation Modernized */}
          <div className="flex gap-6 mb-8 border-b border-white/5">
            {[
              {
                key: "rewards",
                label: summary?.config.rewardsTabLabel ?? "Hoạt động & Xu",
              },
              {
                key: "member",
                label: summary?.config.memberTabLabel ?? "Đặc quyền Hội viên",
              },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key as "rewards" | "member")}
                className="pb-4 px-1 text-sm font-black transition-all relative group"
                style={{
                  color:
                    activeTab === item.key
                      ? "#ffffff"
                      : "rgba(255,255,255,0.4)",
                }}
              >
                <span className="group-hover:text-white transition-colors">
                  {item.label}
                </span>
                {activeTab === item.key && (
                  <motion.div
                    layoutId="underline-premium"
                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-vibe-pink rounded-full shadow-[0_0_15px_rgba(255,69,0,0.6)]"
                  />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "rewards" ? (
              <motion.div
                key="rewards-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="space-y-10"
              >
                {!user ? (
                  <div className="py-20 flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
                      <LogIn size={40} className="text-vibe-pink/50" />
                    </div>
                    <h2 className="text-2xl font-black mb-2">
                      Bắt đầu hành trình của bạn
                    </h2>
                    <p className="text-white/40 mb-8 max-w-xs">
                      Đăng nhập để tham gia các hoạt động thú vị và nhận xu miễn
                      phí mỗi ngày.
                    </p>
                    <button
                      onClick={openLoginModal}
                      className="px-10 py-4 rounded-2xl bg-gradient-vibe text-white font-black shadow-xl shadow-vibe-pink/20 active:scale-95 transition-all"
                    >
                      Đăng nhập ngay
                    </button>
                  </div>
                ) : loading && !summary ? (
                  <div className="space-y-6">
                    <div className="h-48 animate-pulse rounded-[2.5rem] bg-white/5" />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-40 animate-pulse rounded-3xl bg-white/5" />
                      <div className="h-40 animate-pulse rounded-3xl bg-white/5" />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Activity Carousel / Grid */}
                    <section>
                      <div className="flex items-center justify-between mb-5 px-1">
                        <h2 className="text-xl font-black tracking-tight">
                          Hoạt động nổi bật
                        </h2>
                        <span className="text-[10px] font-black text-vibe-pink uppercase tracking-widest">
                          Hot 🔥
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Daily Check-in Shortcut */}
                        <motion.div
                          whileHover={{ y: -5 }}
                          className="relative overflow-hidden group aspect-square rounded-[2.5rem] bg-gradient-to-br from-indigo-600/20 to-vibe-pink/20 border border-white/10 p-6 flex flex-col justify-between cursor-pointer"
                          onClick={() =>
                            document
                              .getElementById("checkin-section")
                              ?.scrollIntoView({ behavior: "smooth" })
                          }
                        >
                          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Trophy className="text-yellow-400" size={24} />
                          </div>
                          <div>
                            <p className="text-sm font-black mb-1">Điểm danh</p>
                            <p className="text-[10px] text-white/50">
                              Hàng ngày
                            </p>
                          </div>
                        </motion.div>

                        {/* Pet Activity */}
                        <motion.div
                          whileHover={{ y: -5 }}
                          className="relative overflow-hidden group aspect-square rounded-[2.5rem] bg-white/5 border border-white/10 p-6 flex flex-col justify-between cursor-wait"
                        >
                          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-vibe-pink text-[8px] font-black uppercase tracking-tighter shadow-lg shadow-vibe-pink/50">
                            Coming
                          </div>
                          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                            <PawPrint className="text-orange-400" size={24} />
                          </div>
                          <div>
                            <p className="text-sm font-black mb-1">Nuôi Pet</p>
                            <p className="text-[10px] text-white/50">
                              Sắp ra mắt
                            </p>
                          </div>
                        </motion.div>

                        {/* Ranking Activity */}
                        <motion.div
                          whileHover={{ y: -5 }}
                          className="relative overflow-hidden group aspect-square rounded-[2.5rem] bg-white/5 border border-white/10 p-6 flex flex-col justify-between cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Star className="text-blue-400" size={24} />
                          </div>
                          <div>
                            <p className="text-sm font-black mb-1">Xếp hạng</p>
                            <p className="text-[10px] text-white/50">
                              Cạnh tranh
                            </p>
                          </div>
                        </motion.div>

                        {/* Games Activity */}
                        <motion.div
                          whileHover={{ y: -5 }}
                          className="relative overflow-hidden group aspect-square rounded-[2.5rem] bg-white/5 border border-white/10 p-6 flex flex-col justify-between cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Gamepad2 className="text-emerald-400" size={24} />
                          </div>
                          <div>
                            <p className="text-sm font-black mb-1">Trò chơi</p>
                            <p className="text-[10px] text-white/50">Vui vẻ</p>
                          </div>
                        </motion.div>
                      </div>
                    </section>

                    {/* Check-in Section */}
                    <section id="checkin-section" className="scroll-mt-6">
                      <div className="flex items-center justify-between mb-5 px-1">
                        <h2 className="text-xl font-black tracking-tight">
                          Điểm danh 7 ngày
                        </h2>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-white/40">
                            Chuỗi:{" "}
                            <span className="text-white">
                              {rewardsUser?.checkIn.currentDay ?? 0} ngày
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-6 lg:p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-vibe-pink/5 blur-[60px] rounded-full" />

                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 mb-8">
                          {(
                            rewardsUser?.checkIn.rewards ??
                            summary?.config.dailyCheckInRewards ??
                            []
                          ).map((reward, index) => {
                            const day = index + 1;
                            const claimedDay =
                              rewardsUser?.checkIn.currentDay ?? 0;
                            const todayClaimed =
                              rewardsUser?.checkIn.todayClaimed ?? false;
                            const nextDay = rewardsUser?.checkIn.nextDay ?? 1;
                            const isNewCycle =
                              !todayClaimed && nextDay === 1 && claimedDay > 0;
                            const completed = isNewCycle
                              ? false
                              : todayClaimed
                                ? day <= claimedDay
                                : nextDay > 1 && day < nextDay;
                            const isActive = todayClaimed
                              ? claimedDay === day
                              : nextDay === day;

                            return (
                              <CheckInDay
                                key={day}
                                day={day}
                                reward={reward}
                                active={isActive}
                                completed={completed}
                              />
                            );
                          })}
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          <button
                            onClick={handleCheckIn}
                            disabled={
                              claimingId === "daily_checkin" ||
                              rewardsUser?.checkIn.todayClaimed
                            }
                            className={`flex-1 w-full h-14 rounded-2xl text-base font-black transition-all active:scale-[0.98] disabled:opacity-50 shadow-2xl ${
                              rewardsUser?.checkIn.todayClaimed
                                ? "bg-white/10 text-white/30 cursor-not-allowed"
                                : "bg-gradient-vibe text-white shadow-vibe-pink/30 hover:shadow-vibe-pink/40"
                            }`}
                          >
                            {claimingId === "daily_checkin"
                              ? "ĐANG XỬ LÝ..."
                              : rewardsUser?.checkIn.todayClaimed
                                ? "NGÀY MAI QUAY LẠI NHẾ"
                                : "ĐIỂM DANH NHẬN XU"}
                          </button>

                          <div className="flex-none px-6 py-4 rounded-2xl bg-white/5 border border-white/10">
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] text-center mb-1">
                              Phần thưởng tiếp theo
                            </p>
                            <p className="text-lg font-black text-center flex items-center justify-center gap-1.5">
                              +
                              {formatNumber(
                                rewardsUser?.checkIn.nextReward ?? 0,
                              )}{" "}
                              <CoinIcon size={16} />
                            </p>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Task List Section */}
                    <section>
                      <div className="flex items-center justify-between mb-5 px-1">
                        <h2 className="text-xl font-black tracking-tight">
                          Nhiệm vụ nhận xu
                        </h2>
                        <span className="px-2 py-0.5 rounded-full bg-vibe-pink/10 border border-vibe-pink/20 text-[10px] font-black text-vibe-pink">
                          {tasks.length} MISSION AVAILABLE
                        </span>
                      </div>

                      {tasks.length === 0 ? (
                        <div className="py-12 border border-dashed border-white/10 rounded-[2rem] text-center">
                          <p className="text-white/30 text-sm">
                            Hiện tại chưa có nhiệm vụ mới.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {tasks.map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              loading={claimingId === task.id}
                              proofName={proofByTask[task.id]?.name}
                              onSelectProof={handleSelectProof}
                              onClearProof={clearProof}
                              onClaim={handleTaskClaim}
                            />
                          ))}
                        </div>
                      )}
                    </section>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="member-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {!user ? (
                  <div className="py-20 flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
                      <Zap size={40} className="text-vibe-pink/50" />
                    </div>
                    <h2 className="text-2xl font-black mb-2">
                      Đặc quyền hội viên
                    </h2>
                    <p className="text-white/40 mb-8 max-w-xs">
                      Đăng nhập để xem cấp bậc và nhận thêm nhiều ưu đãi hấp
                      dẫn.
                    </p>
                    <button
                      onClick={openLoginModal}
                      className="px-10 py-4 rounded-2xl bg-gradient-vibe text-white font-black shadow-xl shadow-vibe-pink/20 active:scale-95 transition-all"
                    >
                      Đăng nhập ngay
                    </button>
                  </div>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-vibe flex items-center justify-center">
                        <Trophy className="text-white" size={32} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black">
                          {giftConfig?.rankName ?? "Thành viên Vibe"}
                        </h2>
                        <p className="text-white/40">
                          Bậc hạng: {giftConfig?.rank ?? 1}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 text-center sm:text-left">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">
                          Đặc quyền xu/hộp
                        </p>
                        <p className="text-2xl font-black text-vibe-pink">
                          +{formatNumber(giftConfig?.coinsReward ?? 0)}
                        </p>
                      </div>
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 text-center sm:text-left">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">
                          Hộp quà hôm nay
                        </p>
                        <p className="text-2xl font-black">
                          {formatNumber(giftConfig?.coinsToday ?? 0)}
                        </p>
                      </div>
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 text-center sm:text-left">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">
                          Tổng xu tích lũy
                        </p>
                        <p className="text-2xl font-black">
                          {formatNumber(giftConfig?.coinsTotal ?? 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
