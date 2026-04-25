"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  Clock,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  Zap,
  ChevronRight,
  BadgeCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import Image from "next/image";
import CoinIcon from "@/components/ui/CoinIcon";
import { useToast } from "@/hooks/useToast";

interface DepositOrder {
  _id: string;
  orderCode: string;
  amount: number;
  qrCodeUrl: string;
  expiresAt: string;
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

interface TopupPackage {
  _id: string;
  label: string;
  amount: number;
  coins: number;
  bonus: number;
  hot?: boolean;
}

export default function TopupPage() {
  const { user, coins } = useAuthStore();
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<"select" | "payment">("select");
  const [packages, setPackages] = useState<TopupPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<TopupPackage | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [pkgLoading, setPkgLoading] = useState(true);
  const [order, setOrder] = useState<DepositOrder | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!user) router.push("/");
  }, [user, router]);

  useEffect(() => {
    fetch("/api/coins/packages")
      .then((r) => r.json())
      .then((data: TopupPackage[]) => {
        setPackages(Array.isArray(data) ? data : []);
        if (data.length > 0) setSelectedPackage(data[2] ?? data[0]);
      })
      .catch(() => setPackages([]))
      .finally(() => setPkgLoading(false));
  }, []);

  useEffect(() => {
    if (!order) return;
    const updateTimer = () => {
      const diff = Math.max(
        0,
        Math.floor((new Date(order.expiresAt).getTime() - Date.now()) / 1000),
      );
      setTimeLeft(diff);
      if (diff === 0) {
        setStep("select");
        setOrder(null);
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [order]);

  const handleCreateOrder = async () => {
    if (!selectedPackage) {
      toast.error("Chọn gói nạp", "Vui lòng chọn một gói nạp xu");
      return;
    }
    const amount = selectedPackage.amount;
    setLoading(true);
    try {
      const res = await fetch("/api/coins/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        setStep("payment");
      } else {
        const error = await res.json();
        toast.error("Lỗi", error.error || "Có lỗi xảy ra");
      }
    } catch {
      toast.error("Lỗi", "Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);
  const fmtTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (!user) return null;

  // Steps config
  const STEPS = [
    { num: 1, label: "Chọn số xu" },
    { num: 2, label: "Thanh toán" },
    { num: 3, label: "Hoàn tất" },
  ];
  const activeStep = step === "select" ? 1 : 2;

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-0 py-3">
      {STEPS.map((s, i) => {
        const done = activeStep > s.num;
        const active = activeStep === s.num;
        return (
          <div key={s.num} className="contents">
            <div className="flex flex-col items-center gap-1">
              <motion.div
                animate={{
                  backgroundColor: done
                    ? "#FF4500"
                    : active
                      ? "rgba(255,69,0,0.2)"
                      : "rgba(255,255,255,0.08)",
                  borderColor:
                    done || active ? "#FF4500" : "rgba(255,255,255,0.1)",
                  scale: active ? 1.1 : 1,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="w-7 h-7 rounded-full border-2 flex items-center justify-center"
              >
                {done ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    <BadgeCheck
                      className="w-4 h-4 text-white"
                      strokeWidth={2.5}
                    />
                  </motion.div>
                ) : (
                  <span
                    className={`text-[11px] font-black ${active ? "text-vibe-pink" : "text-white/25"}`}
                  >
                    {s.num}
                  </span>
                )}
              </motion.div>
              <span
                className={`text-[10px] font-bold transition-colors ${active ? "text-vibe-pink" : done ? "text-white/50" : "text-white/20"}`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-12 sm:w-16 h-px mb-5 mx-1 relative overflow-hidden rounded-full bg-white/8">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-vibe-pink rounded-full"
                  initial={false}
                  animate={{ width: done ? "100%" : "0%" }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="h-full overflow-y-auto bg-black pb-safe">
      {/* Unified sticky header — back button + title + coin balance + step indicator */}
      <div className="sticky top-0 z-30 backdrop-blur-2xl bg-black/80 border-b border-white/6 px-5 py-4 pt-safe">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (step === "payment") {
                    setStep("select");
                    setOrder(null);
                  } else {
                    router.back();
                  }
                }}
                className="w-8 h-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4 text-white/70" />
              </button>
              <h1 className="text-base font-black text-white tracking-tight">
                Nạp Xu
              </h1>
            </div>
            {step === "payment" ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Clock className="w-3.5 h-3.5 text-yellow-400" />
                </motion.div>
                <span className="text-sm font-black text-yellow-300 tabular-nums">
                  {fmtTime(timeLeft)}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-vibe-pink/10 border border-vibe-pink/20">
                <CoinIcon size={14} />
                <span className="text-sm font-black text-white">
                  {fmt(coins)}
                </span>
              </div>
            )}
          </div>
          <StepIndicator />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === "select" ? (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
          >
            <div className="max-w-lg mx-auto px-5 py-6 space-y-6 pb-28">
              {/* Hero */}
              <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-vibe-pink/20 via-black to-orange-500/10 border border-vibe-pink/20 p-6">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-vibe-pink/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="relative">
                  <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">
                    Số dư hiện tại
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white">
                      {fmt(coins)}
                    </span>
                    <span className="text-vibe-pink font-black text-sm">
                      xu
                    </span>
                  </div>
                  <p className="text-white/30 text-xs mt-2 font-medium">
                    1 xu = 1 VNĐ · Cộng tức thì sau khi thanh toán
                  </p>
                </div>
              </div>

              {/* Package grid */}
              <div>
                <p className="text-[11px] font-black text-white/30 uppercase tracking-widest mb-3">
                  Chọn gói nạp
                </p>
                {pkgLoading ? (
                  <div className="grid grid-cols-3 gap-2.5">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="h-20 animate-pulse rounded-2xl bg-white/4"
                      />
                    ))}
                  </div>
                ) : packages.length === 0 ? (
                  <p className="text-white/30 text-sm text-center py-6">
                    Chưa có gói nạp nào
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2.5">
                    {packages.map((pkg, i) => {
                      const active = selectedPackage?._id === pkg._id;
                      return (
                        <motion.button
                          key={pkg._id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.04 }}
                          whileTap={{ scale: 0.93 }}
                          onClick={() => setSelectedPackage(pkg)}
                          className={`relative flex flex-col items-center py-4 rounded-2xl transition-all ${
                            active
                              ? "bg-linear-to-br from-vibe-pink via-orange-500 to-rose-500 shadow-[0_4px_24px_rgba(255,42,109,0.4)]"
                              : "bg-white/3 border border-white/8 hover:border-vibe-pink/30"
                          }`}
                        >
                          {pkg.hot && (
                            <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-yellow-400 text-black text-[8px] font-black leading-none">
                              HOT
                            </span>
                          )}
                          {pkg.bonus > 0 && (
                            <span className="absolute -top-1.5 -left-1.5 px-1.5 py-0.5 rounded-full bg-green-500 text-white text-[8px] font-black leading-none">
                              +{pkg.bonus}%
                            </span>
                          )}
                          <span
                            className={`text-lg font-black leading-none ${active ? "text-white" : "text-white/80"}`}
                          >
                            {pkg.label}
                          </span>
                          <span
                            className={`text-[10px] font-bold mt-1 ${active ? "text-white/70" : "text-white/30"}`}
                          >
                            {fmt(pkg.coins)} xu
                          </span>
                          <span
                            className={`text-[9px] mt-0.5 ${active ? "text-white/50" : "text-white/20"}`}
                          >
                            {fmt(pkg.amount)} xu
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Info card */}
              <div className="bg-white/3 border border-white/8 rounded-2xl p-4 flex gap-3">
                <AlertCircle className="w-4 h-4 text-vibe-pink/70 shrink-0 mt-0.5" />
                <ul className="text-xs text-white/40 space-y-1.5 font-medium">
                  <li>• 1 xu = 1 VNĐ</li>
                  <li>• Thời gian thanh toán: 15 phút</li>
                  <li>• Xu cộng tự động sau khi chuyển khoản thành công</li>
                </ul>
              </div>

              {/* CTA */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleCreateOrder}
                disabled={loading || !selectedPackage}
                className="w-full relative overflow-hidden bg-linear-to-r from-vibe-pink via-orange-500 to-rose-500 text-white py-4 rounded-2xl font-black text-base transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-[0_4px_32px_rgba(255,42,109,0.35)]"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 0.7,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <>
                    <Zap className="w-5 h-5" strokeWidth={2.5} />
                    Tiếp tục
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="payment"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
          >
            <div className="max-w-lg mx-auto px-5 py-6 space-y-5 pb-28">
              {/* Amount banner */}
              <div className="bg-linear-to-r from-vibe-pink/15 via-orange-500/10 to-transparent border border-vibe-pink/20 rounded-2xl p-5 text-center">
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">
                  Số xu nạp
                </p>
                <p className="text-4xl font-black text-white">
                  {fmt(order?.amount ?? 0)}
                </p>
                <p className="text-vibe-pink text-xs font-bold mt-1 uppercase tracking-widest">
                  XU
                </p>
              </div>

              {/* QR Code */}
              {order?.qrCodeUrl && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/3 border border-white/8 rounded-2xl p-5"
                >
                  <p className="text-[11px] font-black text-white/30 uppercase tracking-widest mb-4">
                    Quét mã QR
                  </p>
                  <div className="bg-white rounded-2xl p-4 flex items-center justify-center">
                    <Image
                      src={order.qrCodeUrl}
                      alt="QR Code"
                      width={240}
                      height={240}
                      className="w-full max-w-60"
                    />
                  </div>
                </motion.div>
              )}

              {/* Bank info */}
              {order && (
                <div>
                  <p className="text-[11px] font-black text-white/30 uppercase tracking-widest mb-3">
                    Chuyển khoản thủ công
                  </p>
                  <div className="space-y-2">
                    {[
                      {
                        label: "Ngân hàng",
                        value: order.bankInfo.bankName,
                        field: "bank",
                      },
                      {
                        label: "Số tài khoản",
                        value: order.bankInfo.accountNumber,
                        field: "account",
                        mono: true,
                      },
                      {
                        label: "Chủ tài khoản",
                        value: order.bankInfo.accountName,
                        field: "name",
                      },
                      {
                        label: "Nội dung chuyển khoản",
                        value: order.orderCode,
                        field: "code",
                        mono: true,
                        highlight: true,
                      },
                    ].map((item) => (
                      <div
                        key={item.field}
                        className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 ${
                          item.highlight
                            ? "bg-vibe-pink/8 border border-vibe-pink/25"
                            : "bg-white/3 border border-white/8"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-white/30 mb-0.5">
                            {item.label}
                          </p>
                          <p
                            className={`text-sm font-bold truncate ${item.mono ? "font-mono" : ""} ${item.highlight ? "text-vibe-pink" : "text-white"}`}
                          >
                            {item.value}
                          </p>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() =>
                            copyToClipboard(item.value, item.field)
                          }
                          className="w-8 h-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center shrink-0"
                        >
                          <AnimatePresence mode="wait">
                            {copiedField === item.field ? (
                              <motion.div
                                key="ok"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                              >
                                <Check
                                  className="w-3.5 h-3.5 text-green-400"
                                  strokeWidth={3}
                                />
                              </motion.div>
                            ) : (
                              <motion.div
                                key="cp"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                              >
                                <Copy
                                  className="w-3.5 h-3.5 text-white/30"
                                  strokeWidth={2.5}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warning */}
              <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-4 flex gap-3">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-200/60 leading-relaxed">
                  Vui lòng chuyển khoản{" "}
                  <strong className="text-red-300">đúng nội dung</strong> để hệ
                  thống tự động cộng xu.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
