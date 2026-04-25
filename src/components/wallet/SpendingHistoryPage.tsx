"use client";

import { useState, useEffect, useCallback } from "react";
import { Crown, Calendar } from "lucide-react";
import PageHeader from "./shared/PageHeader";
import TransactionRow, { type TransactionItem } from "./shared/TransactionRow";
import EmptyState from "./shared/EmptyState";

export default function SpendingHistoryPage() {
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wallet/vip-history?page=${p}`);
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
        <PageHeader title="Lịch sử mua bậc" />

        {loading && items.length === 0 ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-orange-500 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Crown}
            title="Chưa có lịch sử mua bậc"
            subtitle="Mua gói bậc để tăng xu/phút và mở hộp quà theo bậc tương ứng"
            ctaLabel="Xem gói bậc"
            ctaHref="/vip"
          />
        ) : (
          <div
            className="mx-4 mt-2 rounded-2xl overflow-hidden divide-y divide-white/5"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {items.map((item, i) => (
              <TransactionRow
                key={item.id}
                item={{ ...item, direction: "debit" }}
                index={i}
                icon={item.metadata?.days ? Calendar : Crown}
                iconColor="#FF6B2B"
                iconBg="rgba(255,107,43,0.12)"
              />
            ))}

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
