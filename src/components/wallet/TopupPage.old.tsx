"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign,
  Copy,
  Check,
  Clock,
  QrCode as QrIcon,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import Image from "next/image";

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

const PRESET_AMOUNTS = [
  { amount: 10000, label: "10K", coins: 10000 },
  { amount: 20000, label: "20K", coins: 20000 },
  { amount: 50000, label: "50K", coins: 50000 },
  { amount: 100000, label: "100K", coins: 100000 },
  { amount: 200000, label: "200K", coins: 200000 },
  { amount: 500000, label: "500K", coins: 500000 },
];

export default function TopupPage() {
  const { user, coins } = useAuthStore();
  const router = useRouter();
  const [step, setStep] = useState<"select" | "payment">("select");
  const [selectedAmount, setSelectedAmount] = useState<number>(50000);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<DepositOrder | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  // Countdown timer
  useEffect(() => {
    if (!order) return;

    const updateTimer = () => {
      const now = Date.now();
      const expires = new Date(order.expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expires - now) / 1000));
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
    const amount = customAmount ? parseInt(customAmount) : selectedAmount;

    if (amount < 10000) {
      alert("Số tiền tối thiểu 10,000 VNĐ");
      return;
    }

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
        alert(error.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Create order error:", error);
      alert("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-white mb-2">Nạp Xu</h1>
          <p className="text-gray-400">
            Số dư hiện tại:{" "}
            <span className="text-vibe-pink font-bold">
              {formatCurrency(coins)} xu
            </span>
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 space-y-6"
            >
              <div>
                <h3 className="text-lg font-bold text-white mb-4">
                  Chọn số tiền nạp
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {PRESET_AMOUNTS.map((preset) => (
                    <button
                      key={preset.amount}
                      onClick={() => {
                        setSelectedAmount(preset.amount);
                        setCustomAmount("");
                      }}
                      className={`p-4 rounded-xl font-bold transition-all ${
                        selectedAmount === preset.amount && !customAmount
                          ? "bg-vibe-pink text-white border-2 border-vibe-pink"
                          : "bg-gray-900 text-gray-300 border border-gray-700 hover:border-vibe-pink"
                      }`}
                    >
                      <div className="text-lg">{preset.label}</div>
                      <div className="text-xs opacity-70">
                        {formatCurrency(preset.coins)} xu
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">
                  Hoặc nhập số tiền tùy chỉnh (VNĐ)
                </label>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Tối thiểu 10,000 VNĐ"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-vibe-pink outline-none"
                  min="10000"
                  step="1000"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-300">
                    <p className="font-bold mb-1">Lưu ý quan trọng:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-200">
                      <li>1 VNĐ = 1 xu</li>
                      <li>Thời gian thanh toán: 15 phút/giao dịch</li>
                      <li>
                        Chuyển khoản đúng nội dung để hệ thống tự động cộng xu
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreateOrder}
                disabled={loading || (!customAmount && !selectedAmount)}
                className="w-full bg-vibe-pink hover:bg-vibe-pink/90 text-white py-4 rounded-xl font-black text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Đang tạo đơn..." : "Tiếp tục"}
              </button>
            </motion.div>
          )}

          {step === "payment" && order && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Timer */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-300 font-bold">
                      Thời gian còn lại:
                    </span>
                  </div>
                  <span className="text-2xl font-black text-yellow-400">
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <QrIcon className="w-6 h-6 text-vibe-pink" />
                  <h3 className="text-xl font-black text-white">
                    Quét mã QR để thanh toán
                  </h3>
                </div>
                <div className="bg-white rounded-xl p-4 flex items-center justify-center">
                  <Image
                    src={order.qrCodeUrl}
                    alt="QR Code"
                    width={300}
                    height={300}
                    className="rounded-lg"
                  />
                </div>
              </div>

              {/* Bank Info */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-white mb-4">
                  Thông tin chuyển khoản
                </h3>

                <div>
                  <label className="text-xs text-gray-400 uppercase mb-1 block">
                    Ngân hàng
                  </label>
                  <div className="bg-gray-900 rounded-lg p-3 text-white font-bold">
                    {order.bankInfo.bankName}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 uppercase mb-1 block">
                    Số tài khoản
                  </label>
                  <div className="bg-gray-900 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-white font-mono font-bold">
                      {order.bankInfo.accountNumber}
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(order.bankInfo.accountNumber, "account")
                      }
                      className="p-2 hover:bg-gray-800 rounded-lg transition-all"
                    >
                      {copiedField === "account" ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 uppercase mb-1 block">
                    Chủ tài khoản
                  </label>
                  <div className="bg-gray-900 rounded-lg p-3 text-white font-bold">
                    {order.bankInfo.accountName}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 uppercase mb-1 block">
                    Số tiền
                  </label>
                  <div className="bg-gray-900 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-vibe-pink font-black text-xl">
                      {formatCurrency(order.amount)} VNĐ
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(order.amount.toString(), "amount")
                      }
                      className="p-2 hover:bg-gray-800 rounded-lg transition-all"
                    >
                      {copiedField === "amount" ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 uppercase mb-1 block">
                    Nội dung chuyển khoản
                  </label>
                  <div className="bg-yellow-500/10 border-2 border-yellow-500/50 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-yellow-300 font-black text-lg">
                      {order.orderCode}
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(order.orderCode, "content")
                      }
                      className="p-2 hover:bg-yellow-500/20 rounded-lg transition-all"
                    >
                      {copiedField === "content" ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-yellow-400" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-yellow-400 mt-2">
                    ⚠️ Vui lòng nhập đúng nội dung để hệ thống tự động cộng xu
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setStep("select");
                  setOrder(null);
                }}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-bold transition-all"
              >
                Hủy giao dịch
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
