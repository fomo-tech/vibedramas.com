"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowDownToLine, CheckCircle2, Clock, XCircle } from "lucide-react";
import PageHeader from "./shared/PageHeader";
import EmptyState from "./shared/EmptyState";
import { motion } from "framer-motion";

type WithdrawItem = {
  id: string;
  amount: number;
  description: string;
  status: "pending" | "processing" | "completed" | "rejected";
  metadata: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    adminNote?: string;
    processedAt?: string;
  };
  createdAt: string;
};

const STATUS_CONFIG = {
  pending: {
    label: "Chờ duyệt",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.12)",
  },
  processing: {
    label: "Đang xử lý",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.12)",
  },
  completed: {
    label: "Đã hoàn thành",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.12)",
  },
  rejected: {
    label: "Từ chối",
    color: "#f87171",
    bg: "rgba(248,113,113,0.12)",
  },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

export default function WithdrawHistoryPage() {
  const [items, setItems] = useState<WithdrawItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wallet/withdraw-history?page=${p}`);
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
    fetchData(1);
  }, [fetchData]);

  return (
    <div className="h-full bg-black overflow-y-auto pb-24 lg:pb-8">
      <div className="max-w-lg mx-auto">
        <PageHeader title="Lịch sử rút xu" />

        {loading && items.length === 0 ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-orange-500 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={ArrowDownToLine}
            title="Chưa có yêu cầu rút xu"
            subtitle="Tích lũy xu rồi rút về tài khoản ngân hàng của bạn"
            ctaLabel="Rút xu ngay"
            ctaHref="/wallet/withdraw"
          />
        ) : (
          <div
            className="mx-4 mt-2 rounded-2xl overflow-hidden divide-y divide-white/5"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {items.map((item, i) => {
              const st = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
              const StatusIcon =
                item.status === "completed"
                  ? CheckCircle2
                  : item.status === "rejected"
                    ? XCircle
                    : Clock;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                  className="flex items-center gap-3 px-4 py-3.5"
                >
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: st.bg }}
                  >
                    <StatusIcon size={18} style={{ color: st.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-white/90 text-sm font-semibold leading-tight truncate">
                      {item.description}
                    </p>
                    {item.metadata?.accountName && (
                      <p className="text-white/30 text-[11px] mt-0.5 truncate">
                        {item.metadata.accountName} ·{" "}
                        {item.metadata.accountNumber}
                      </p>
                    )}
                    {item.metadata?.adminNote && (
                      <p className="text-white/30 text-[11px] mt-0.5 truncate">
                        Ghi chú: {item.metadata.adminNote}
                      </p>
                    )}
                    <p className="text-white/25 text-[11px] mt-0.5">
                      {timeAgo(item.createdAt)}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-red-400 font-black text-sm">
                      -{item.amount.toLocaleString("vi-VN")}
                    </p>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ color: st.color, background: st.bg }}
                    >
                      {st.label}
                    </span>
                  </div>
                </motion.div>
              );
            })}

            {page < totalPages && (
              <button
                onClick={() => fetchData(page + 1)}
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
