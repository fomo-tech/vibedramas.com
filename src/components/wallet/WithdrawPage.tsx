"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  CheckCircle,
  Sparkles,
  Building2,
  Smartphone,
  CreditCard,
  ArrowLeft,
  ChevronRight,
  Plus,
  Check,
  FileText,
  BadgeCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import CoinIcon from "@/components/ui/CoinIcon";
import { useToast } from "@/hooks/useToast";
import { MIN_WITHDRAW_COINS } from "@/constants/coinPackages";

interface PaymentMethod {
  id: string;
  type: "bank" | "momo";
  bankName: string;
  bankCode?: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
}

const PRESET_AMOUNTS = [
  { amount: 50000, label: "50K" },
  { amount: 100000, label: "100K", hot: true },
  { amount: 200000, label: "200K", hot: true },
  { amount: 500000, label: "500K" },
  { amount: 1000000, label: "1M" },
  { amount: 2000000, label: "2M" },
];

function maskAccount(num: string) {
  if (num.length <= 4) return num;
  return "*".repeat(Math.min(num.length - 4, 6)) + num.slice(-4);
}

export default function WithdrawPage() {
  const { user, coins, setCoins } = useAuthStore();
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<"amount" | "bank" | "confirm">("amount");
  const [selectedAmount, setSelectedAmount] = useState<number>(100000);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [userNote, setUserNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) router.push("/");
  }, [user, router]);

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const res = await fetch("/api/wallet/payment-methods");
        if (res.ok) {
          const data = await res.json();
          const items: PaymentMethod[] = data.items ?? [];
          setPaymentMethods(items);
          // Auto-select default
          const def = items.find((m) => m.isDefault) ?? items[0];
          if (def) {
            setSelectedMethodId(def.id);
            setBankName(def.bankName);
            setAccountNumber(def.accountNumber);
            setAccountName(def.accountName);
          }
        }
      } catch {
      } finally {
        setLoadingMethods(false);
      }
    };
    fetchMethods();
  }, []);

  const finalAmount = customAmount ? parseInt(customAmount) : selectedAmount;
  const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

  const handleSubmit = async () => {
    if (finalAmount < MIN_WITHDRAW_COINS) {
      toast.error(
        "Số xu không hợp lệ",
        `Số xu rút tối thiểu ${MIN_WITHDRAW_COINS.toLocaleString("vi-VN")} xu`,
      );
      return;
    }
    if (!user || coins < finalAmount) {
      toast.error("Số dư không đủ", "Vui lòng nạp thêm xu trước khi rút");
      return;
    }
    if (!bankName || !accountNumber || !accountName) {
      toast.error(
        "Thiếu thông tin",
        "Vui lòng điền đầy đủ thông tin ngân hàng",
      );
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/coins/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          bankName,
          accountNumber,
          accountName,
          userNote,
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setCoins(coins - finalAmount);
        setTimeout(() => router.push("/wallet"), 3000);
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

  if (!user) return null;

  // Success screen
  if (success) {
    return (
      <div className="h-full overflow-y-auto bg-black flex items-center justify-center px-5">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="w-full max-w-sm"
        >
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-vibe-pink/15 via-black to-orange-500/10 border border-vibe-pink/25 p-8 text-center">
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 bg-vibe-pink/15 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.15, type: "spring", damping: 12 }}
                className="w-20 h-20 mx-auto mb-6 bg-linear-to-br from-vibe-pink to-orange-500 rounded-3xl flex items-center justify-center shadow-[0_8px_32px_rgba(255,42,109,0.4)]"
              >
                <CheckCircle
                  className="w-10 h-10 text-white"
                  strokeWidth={2.5}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <h2 className="text-2xl font-black text-white mb-2">
                  Gửi thành công!
                </h2>
                <p className="text-white/50 text-sm leading-relaxed">
                  Yêu cầu rút{" "}
                  <span className="text-vibe-pink font-black">
                    {fmt(finalAmount)} xu
                  </span>{" "}
                  đã được ghi nhận
                </p>
                <p className="text-white/30 text-xs mt-2">
                  Admin sẽ xử lý trong vòng 24 giờ
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const stepIdx = step === "amount" ? 0 : step === "bank" ? 1 : 2;

  return (
    <div className="h-full overflow-y-auto bg-black pb-safe">
      {/* Header */}
      <div className="sticky top-0 z-20 backdrop-blur-2xl bg-black/80 border-b border-white/6 px-5 py-4 pt-safe">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  step === "amount"
                    ? router.back()
                    : setStep(step === "bank" ? "amount" : "bank")
                }
                className="w-8 h-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4 text-white/70" />
              </button>
              <h1 className="text-base font-black text-white tracking-tight">
                Rút Xu
              </h1>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-vibe-pink/10 border border-vibe-pink/20">
              <CoinIcon size={14} />
              <span className="text-sm font-black text-white">
                {fmt(coins)}
              </span>
            </div>
          </div>
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-0 pt-1">
            {[
              { num: 1, label: "Số xu" },
              { num: 2, label: "Tài khoản" },
              { num: 3, label: "Xác nhận" },
            ].map((s, i, arr) => {
              const done = stepIdx + 1 > s.num;
              const active = stepIdx + 1 === s.num;
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
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
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
                  {i < arr.length - 1 && (
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
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Amount */}
        {step === "amount" && (
          <motion.div
            key="amount"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="max-w-lg mx-auto px-5 pt-6 pb-28 space-y-6"
          >
            {/* Balance hero */}
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-vibe-pink/20 via-black to-orange-500/10 border border-vibe-pink/20 p-6">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-vibe-pink/20 rounded-full blur-3xl pointer-events-none" />
              <div className="relative">
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">
                  Số dư khả dụng
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">
                    {fmt(coins)}
                  </span>
                  <span className="text-vibe-pink font-black text-sm">xu</span>
                </div>
                <p className="text-white/30 text-xs mt-2 font-medium">
                  1 xu = 1 VNĐ · Tối thiểu rút {fmt(MIN_WITHDRAW_COINS)} xu
                </p>
              </div>
            </div>

            {/* Preset grid */}
            <div>
              <p className="text-[11px] font-black text-white/30 uppercase tracking-widest mb-3">
                Chọn số xu muốn rút
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {PRESET_AMOUNTS.map((preset, i) => {
                  const canAfford = coins >= preset.amount;
                  const active =
                    selectedAmount === preset.amount &&
                    !customAmount &&
                    canAfford;
                  return (
                    <motion.button
                      key={preset.amount}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                      whileTap={canAfford ? { scale: 0.93 } : {}}
                      onClick={() => {
                        if (canAfford) {
                          setSelectedAmount(preset.amount);
                          setCustomAmount("");
                        }
                      }}
                      disabled={!canAfford}
                      className={`relative flex flex-col items-center py-4 rounded-2xl transition-all ${
                        !canAfford
                          ? "opacity-25 cursor-not-allowed bg-white/2 border border-white/5"
                          : active
                            ? "bg-linear-to-br from-vibe-pink via-orange-500 to-rose-500 shadow-[0_4px_24px_rgba(255,42,109,0.4)]"
                            : "bg-white/3 border border-white/8 hover:border-vibe-pink/30"
                      }`}
                    >
                      {preset.hot && canAfford && (
                        <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-yellow-400 text-black text-[8px] font-black leading-none">
                          HOT
                        </span>
                      )}
                      <span
                        className={`text-lg font-black leading-none ${active ? "text-white" : canAfford ? "text-white/80" : "text-white/30"}`}
                      >
                        {preset.label}
                      </span>
                      <span
                        className={`text-[10px] font-bold mt-1 ${active ? "text-white/70" : canAfford ? "text-white/30" : "text-white/15"}`}
                      >
                        {fmt(preset.amount)} xu
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Custom input */}
            <div>
              <p className="text-[11px] font-black text-white/30 uppercase tracking-widest mb-3">
                Hoặc nhập số xu khác
              </p>
              <div className="relative">
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Tối thiểu 50,000 xu"
                  className="w-full bg-white/3 border border-white/8 rounded-2xl px-4 py-3.5 text-white font-bold focus:border-vibe-pink/50 outline-none transition-all placeholder:text-white/20 pr-16"
                  min="50000"
                  step="1000"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 text-xs font-black tracking-wider">
                  XU
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-4 flex gap-3">
              <AlertCircle className="w-4 h-4 text-vibe-pink/70 shrink-0 mt-0.5" />
              <ul className="text-xs text-white/40 space-y-1.5 font-medium">
                <li>• Rút tối thiểu 50,000 xu</li>
                <li>• Thời gian xử lý: 24 giờ làm việc</li>
                <li>• 1 xu = 1 VNĐ</li>
              </ul>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setStep("bank")}
              disabled={finalAmount < 50000 || finalAmount > coins}
              className="w-full bg-linear-to-r from-vibe-pink via-orange-500 to-rose-500 text-white py-4 rounded-2xl font-black text-base transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-[0_4px_32px_rgba(255,42,109,0.35)]"
            >
              Tiếp tục <ChevronRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}

        {/* Step 2: Select Payment Method */}
        {step === "bank" && (
          <motion.div
            key="bank"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="max-w-lg mx-auto px-5 pt-6 pb-28 space-y-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-black text-white/30 uppercase tracking-widest">
                Chọn phương thức rút
              </p>
              <button
                onClick={() => router.push("/wallet/payment-methods")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-vibe-pink/10 border border-vibe-pink/20 text-vibe-pink text-xs font-black"
              >
                <Plus className="w-3 h-3" strokeWidth={3} /> Thêm mới
              </button>
            </div>

            {loadingMethods ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-2xl bg-white/3 border border-white/8 animate-pulse"
                  />
                ))}
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-3xl bg-white/3 border border-white/8 flex items-center justify-center mb-4">
                  <CreditCard className="w-7 h-7 text-white/20" />
                </div>
                <p className="text-white/50 font-black text-sm mb-1">
                  Chưa có phương thức rút xu
                </p>
                <p className="text-white/25 text-xs mb-5">
                  Thêm tài khoản ngân hàng hoặc ví điện tử để rút xu
                </p>
                <button
                  onClick={() => router.push("/wallet/payment-methods")}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-linear-to-r from-vibe-pink via-orange-500 to-rose-500 text-white font-black text-sm shadow-[0_4px_24px_rgba(255,42,109,0.3)]"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} /> Thêm ngay
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentMethods.map((method, i) => {
                  const isSelected = selectedMethodId === method.id;
                  const Icon = method.type === "momo" ? Smartphone : Building2;
                  return (
                    <motion.button
                      key={method.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setSelectedMethodId(method.id);
                        setBankName(method.bankName);
                        setAccountNumber(method.accountNumber);
                        setAccountName(method.accountName);
                      }}
                      className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                        isSelected
                          ? "bg-vibe-pink/8 border-vibe-pink/40 shadow-[0_0_20px_rgba(255,42,109,0.12)]"
                          : "bg-white/3 border-white/8 hover:border-white/15"
                      }`}
                    >
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-vibe-pink/20 border border-vibe-pink/30"
                            : "bg-white/5 border border-white/8"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${isSelected ? "text-vibe-pink" : "text-white/30"}`}
                          strokeWidth={2}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p
                            className={`text-sm font-black leading-tight ${isSelected ? "text-white" : "text-white/70"}`}
                          >
                            {method.bankName}
                          </p>
                          {method.isDefault && (
                            <span className="text-[9px] font-black text-white/30 bg-white/5 px-1.5 py-0.5 rounded-full leading-none">
                              MẶC ĐỊNH
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-white/40">
                          {maskAccount(method.accountNumber)}
                        </p>
                        <p className="text-[11px] text-white/30 mt-0.5">
                          {method.accountName}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-vibe-pink flex items-center justify-center shrink-0">
                          <Check
                            className="w-3.5 h-3.5 text-white"
                            strokeWidth={3}
                          />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Note */}
            {paymentMethods.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-3.5 h-3.5 text-white/30" />
                  <span className="text-xs font-bold text-white/30 uppercase tracking-wider">
                    Ghi chú (tuỳ chọn)
                  </span>
                </div>
                <textarea
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  className="w-full bg-white/3 border border-white/8 rounded-2xl px-4 py-3.5 text-white font-medium focus:border-vibe-pink/50 outline-none transition-all resize-none"
                  rows={2}
                  placeholder="Thêm ghi chú..."
                />
              </div>
            )}

            {paymentMethods.length > 0 && (
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setStep("amount")}
                  className="flex-1 bg-white/5 border border-white/8 text-white/70 py-4 rounded-2xl font-black text-sm transition-all"
                >
                  Quay lại
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setStep("confirm")}
                  disabled={!selectedMethodId}
                  className="flex-2 px-8 bg-linear-to-r from-vibe-pink via-orange-500 to-rose-500 text-white py-4 rounded-2xl font-black text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(255,42,109,0.3)]"
                >
                  Tiếp tục <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 3: Confirm */}
        {step === "confirm" && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="max-w-lg mx-auto px-5 pt-6 pb-28 space-y-5"
          >
            <p className="text-[11px] font-black text-white/30 uppercase tracking-widest">
              Xác nhận thông tin
            </p>

            {/* Amount card */}
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-vibe-pink/15 via-black to-orange-500/10 border border-vibe-pink/20 p-6 text-center">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-32 h-32 bg-vibe-pink/20 rounded-full blur-3xl pointer-events-none" />
              <div className="relative">
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">
                  Số xu rút
                </p>
                <p className="text-5xl font-black text-white">
                  {fmt(finalAmount)}
                </p>
                <p className="text-vibe-pink text-xs font-black mt-1 uppercase tracking-widest">
                  XU · ≈ {fmt(finalAmount)} VNĐ
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2">
              {[
                { label: "Ngân hàng", value: bankName, icon: Building2 },
                {
                  label: "Số tài khoản",
                  value: accountNumber,
                  icon: CreditCard,
                  mono: true,
                },
                { label: "Chủ tài khoản", value: accountName, icon: Building2 },
                ...(userNote
                  ? [{ label: "Ghi chú", value: userNote, icon: FileText }]
                  : []),
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-2xl px-4 py-3.5"
                >
                  <div className="w-9 h-9 rounded-xl bg-vibe-pink/10 border border-vibe-pink/15 flex items-center justify-center shrink-0">
                    <item.icon
                      className="w-4 h-4 text-vibe-pink/80"
                      strokeWidth={2.5}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-white/30 mb-0.5">
                      {item.label}
                    </p>
                    <p
                      className={`text-sm font-bold text-white truncate ${"mono" in item && item.mono ? "font-mono" : ""}`}
                    >
                      {item.value}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Warning */}
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 flex gap-3">
              <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-200/60 leading-relaxed">
                Sau khi xác nhận, yêu cầu sẽ không thể thay đổi. Vui lòng kiểm
                tra kỹ thông tin.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setStep("bank")}
                disabled={loading}
                className="flex-1 bg-white/5 border border-white/8 text-white/70 py-4 rounded-2xl font-black text-sm transition-all disabled:opacity-50"
              >
                Sửa
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={loading}
                className="flex-2 px-8 bg-linear-to-r from-vibe-pink via-orange-500 to-rose-500 text-white py-4 rounded-2xl font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(255,42,109,0.3)]"
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
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" strokeWidth={2.5} /> Xác
                    nhận rút
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
