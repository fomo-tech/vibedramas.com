"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DollarSign, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

const PRESET_AMOUNTS = [
  { amount: 50000, label: "50K" },
  { amount: 100000, label: "100K" },
  { amount: 200000, label: "200K" },
  { amount: 500000, label: "500K" },
  { amount: 1000000, label: "1M" },
];

export default function WithdrawPage() {
  const { user, coins, setCoins } = useAuthStore();
  const router = useRouter();
  const [selectedAmount, setSelectedAmount] = useState<number>(50000);
  const [customAmount, setCustomAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [userNote, setUserNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = customAmount ? parseInt(customAmount) : selectedAmount;

    if (amount < 50000) {
      alert("Số tiền rút tối thiểu 50,000 xu");
      return;
    }

    if (!user || coins < amount) {
      alert("Số dư không đủ");
      return;
    }

    if (!bankName || !accountNumber || !accountName) {
      alert("Vui lòng điền đầy đủ thông tin tài khoản ngân hàng");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/coins/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          bankName,
          accountNumber,
          accountName,
          userNote,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setCoins(coins - amount); // Update local coins state

        // Reset form
        setTimeout(() => {
          setSelectedAmount(50000);
          setCustomAmount("");
          setBankName("");
          setAccountNumber("");
          setAccountName("");
          setUserNote("");
          setSuccess(false);
        }, 3000);
      } else {
        const error = await res.json();
        alert(error.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Withdraw error:", error);
      alert("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  if (!user) return null;

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 text-center max-w-md"
        >
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">
            Yêu cầu rút tiền đã được tạo!
          </h2>
          <p className="text-gray-400">
            Yêu cầu của bạn đang được xử lý. Admin sẽ duyệt và chuyển tiền trong
            vòng 24 giờ.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-white mb-2">Rút Xu</h1>
          <p className="text-gray-400">
            Số dư hiện tại:{" "}
            <span className="text-green-400 font-bold">
              {formatCurrency(coins)} xu
            </span>
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 space-y-6"
        >
          {/* Amount Selection */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">
              Chọn số tiền rút
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset.amount}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(preset.amount);
                    setCustomAmount("");
                  }}
                  disabled={coins < preset.amount}
                  className={`p-4 rounded-xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                    selectedAmount === preset.amount && !customAmount
                      ? "bg-green-500 text-white border-2 border-green-500"
                      : "bg-gray-900 text-gray-300 border border-gray-700 hover:border-green-500"
                  }`}
                >
                  <div className="text-lg">{preset.label}</div>
                  <div className="text-xs opacity-70">
                    {formatCurrency(preset.amount)} xu
                  </div>
                </button>
              ))}
            </div>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Hoặc nhập số tiền tùy chỉnh (tối thiểu 50,000 xu)"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none"
              min="50000"
              step="1000"
            />
          </div>

          {/* Bank Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">
              Thông tin tài khoản nhận
            </h3>

            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">
                Ngân hàng *
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                required
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none"
              >
                <option value="">Chọn ngân hàng</option>
                <option value="Vietcombank">Vietcombank</option>
                <option value="Techcombank">Techcombank</option>
                <option value="VietinBank">VietinBank</option>
                <option value="BIDV">BIDV</option>
                <option value="Agribank">Agribank</option>
                <option value="MBBank">MB Bank</option>
                <option value="TPBank">TPBank</option>
                <option value="Sacombank">Sacombank</option>
                <option value="VPBank">VPBank</option>
                <option value="ACB">ACB</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">
                Số tài khoản *
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none font-mono"
                placeholder="1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">
                Tên chủ tài khoản *
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                required
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none uppercase"
                placeholder="NGUYEN VAN A"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">
                Ghi chú (tùy chọn)
              </label>
              <textarea
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none"
                rows={3}
                placeholder="Nhập ghi chú nếu cần..."
              />
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-300">
                <p className="font-bold mb-1">Lưu ý quan trọng:</p>
                <ul className="list-disc list-inside space-y-1 text-yellow-200">
                  <li>Số tiền rút tối thiểu: 50,000 xu</li>
                  <li>Xu sẽ bị trừ ngay sau khi tạo yêu cầu</li>
                  <li>Thời gian xử lý: 1-24 giờ (ngày làm việc)</li>
                  <li>Kiểm tra kỹ thông tin tài khoản trước khi gửi</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              loading ||
              !user ||
              coins < (customAmount ? parseInt(customAmount) : selectedAmount)
            }
            className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-black text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <DollarSign className="w-5 h-5" />
                Tạo yêu cầu rút tiền
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
