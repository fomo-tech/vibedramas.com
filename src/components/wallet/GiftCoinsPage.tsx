"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Gift,
  Send,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  Crown,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import PageHeader from "./shared/PageHeader";
import TransactionRow, { type TransactionItem } from "./shared/TransactionRow";
import EmptyState from "./shared/EmptyState";
import CoinIcon from "@/components/ui/CoinIcon";
import Link from "next/link";

// ─── Send Form ────────────────────────────────────────────────────────────────
function SendGiftForm({
  onSuccess,
}: {
  onSuccess: (coinsLeft: number) => void;
}) {
  const { coins, setCoins } = useAuthStore();
  const [username, setUsername] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const QUICK_AMOUNTS = [10, 50, 100, 500];

  const handleSend = async () => {
    setError(null);
    setSuccess(null);
    const parsedAmount = parseInt(amount, 10);
    if (!username.trim()) {
      setError("Vui lòng nhập tên người nhận");
      return;
    }
    if (!parsedAmount || parsedAmount < 1) {
      setError("Số xu tối thiểu là 1");
      return;
    }
    if (parsedAmount > (coins ?? 0)) {
      setError("Số dư xu không đủ");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/wallet/gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUsername: username.trim(),
          amount: parsedAmount,
          note: note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Giao dịch thất bại");
        return;
      }
      setCoins(data.coinsLeft);
      setSuccess(
        `Đã tặng ${parsedAmount.toLocaleString("vi-VN")} xu cho @${username.trim()}!`,
      );
      setUsername("");
      setAmount("");
      setNote("");
      onSuccess(data.coinsLeft);
    } catch {
      setError("Lỗi kết nối, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-2 rounded-2xl p-4"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Balance display */}
      <div className="flex items-center gap-2 mb-4 px-0.5">
        <CoinIcon size={14} />
        <span className="text-white/40 text-xs">
          Số dư:{" "}
          <span className="text-white/70 font-black">
            {(coins ?? 0).toLocaleString("vi-VN")} xu
          </span>
        </span>
      </div>

      {/* Username */}
      <div className="mb-3">
        <label className="text-white/40 text-[11px] font-bold uppercase tracking-wider mb-1.5 block">
          Tên người nhận
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-semibold placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 transition-colors"
        />
      </div>

      {/* Amount */}
      <div className="mb-3">
        <label className="text-white/40 text-[11px] font-bold uppercase tracking-wider mb-1.5 block">
          Số xu
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Nhập số xu muốn tặng"
          min={1}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-semibold placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 transition-colors"
        />
        {/* Quick amounts */}
        <div className="flex gap-2 mt-2">
          {QUICK_AMOUNTS.map((q) => (
            <button
              key={q}
              onClick={() => setAmount(String(q))}
              className="flex-1 py-1.5 rounded-lg text-[11px] font-black transition-all"
              style={{
                background:
                  amount === String(q)
                    ? "rgba(255,69,0,0.2)"
                    : "rgba(255,255,255,0.06)",
                color:
                  amount === String(q) ? "#FF6B2B" : "rgba(255,255,255,0.4)",
                border:
                  amount === String(q)
                    ? "1px solid rgba(255,107,43,0.4)"
                    : "1px solid transparent",
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="mb-4">
        <label className="text-white/40 text-[11px] font-bold uppercase tracking-wider mb-1.5 block">
          Lời nhắn (tuỳ chọn)
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nhập lời nhắn..."
          maxLength={100}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 transition-colors"
        />
      </div>

      {/* Feedback */}
      {error && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <p className="text-red-400 text-xs font-semibold">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
          <Gift size={14} className="text-green-400 shrink-0" />
          <p className="text-green-400 text-xs font-semibold">{success}</p>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSend}
        disabled={loading || !username || !amount}
        className="w-full py-3.5 rounded-2xl font-black text-sm text-white transition-all"
        style={{
          background:
            loading || !username || !amount
              ? "rgba(255,255,255,0.08)"
              : "linear-gradient(135deg,#FF4500,#FF6B2B)",
          color:
            loading || !username || !amount ? "rgba(255,255,255,0.25)" : "#fff",
          boxShadow:
            loading || !username || !amount
              ? "none"
              : "0 4px 20px rgba(255,69,0,0.3)",
        }}
      >
        {loading ? "Đang gửi..." : "Tặng xu ngay"}
      </button>
    </motion.div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function GiftCoinsPage() {
  const { vipStatus, vipExpiry } = useAuthStore();
  const isVip = !!(vipStatus && vipExpiry && new Date(vipExpiry) > new Date());

  const [items, setItems] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistory = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wallet/gift?page=${p}`);
      if (!res.ok) return;
      const data = await res.json();
      setItems((prev) => (p === 1 ? data.items : [...prev, ...data.items]));
      setTotalPages(data.totalPages ?? 1);
      setPage(p);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  return (
    <div className="h-full bg-black overflow-y-auto pb-24 lg:pb-8">
      <div className="max-w-lg mx-auto">
        <PageHeader title="Tặng Xu" />

        {/* VIP gate */}
        {!isVip && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-4 rounded-2xl p-6 text-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,69,0,0.08) 0%, rgba(0,0,0,0) 100%)",
              border: "1px solid rgba(255,69,0,0.2)",
            }}
          >
            <Crown
              className="w-10 h-10 mx-auto mb-3"
              style={{ color: "#FF4500" }}
            />
            <p className="text-white font-black text-base mb-1">
              Tính năng dành cho VIP
            </p>
            <p className="text-white/40 text-sm mb-4 leading-relaxed">
              Nâng cấp VIP để tặng xu cho bạn bè và chia sẻ niềm vui.
            </p>
            <Link href="/vip">
              <button
                className="px-6 py-3 rounded-2xl font-black text-white text-sm"
                style={{
                  background: "linear-gradient(135deg, #FF4500, #FF6B2B)",
                  boxShadow: "0 4px 20px rgba(255,69,0,0.35)",
                }}
              >
                Nâng cấp VIP ngay
              </button>
            </Link>
          </motion.div>
        )}

        {/* Send form — only for VIP */}
        {isVip && <SendGiftForm onSuccess={() => fetchHistory(1)} />}

        {/* History section */}
        <div className="mx-4 mt-5 mb-2">
          <p className="text-white/40 text-xs font-bold uppercase tracking-wider">
            Lịch sử tặng xu
          </p>
        </div>

        {loading && items.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-orange-500 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Gift}
            title="Chưa có lịch sử tặng xu"
            subtitle="Tặng xu cho bạn bè để chia sẻ niềm vui!"
          />
        ) : (
          <div
            className="mx-4 rounded-2xl overflow-hidden divide-y divide-white/5"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {items.map((item, i) => (
              <TransactionRow
                key={item.id}
                item={item}
                index={i}
                icon={
                  item.type === "coin_gift_sent" ? ArrowUpRight : ArrowDownLeft
                }
                iconColor={
                  item.type === "coin_gift_sent" ? "#f87171" : "#4ade80"
                }
                iconBg={
                  item.type === "coin_gift_sent"
                    ? "rgba(248,113,113,0.12)"
                    : "rgba(74,222,128,0.12)"
                }
              />
            ))}
            {page < totalPages && (
              <button
                onClick={() => fetchHistory(page + 1)}
                disabled={loading}
                className="w-full py-4 text-white/40 text-sm font-bold hover:text-white/70 transition-colors"
              >
                {loading ? "Đang tải..." : "Tải thêm"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
