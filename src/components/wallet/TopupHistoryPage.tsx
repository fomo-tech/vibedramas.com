"use client";

import { useState, useEffect, useCallback } from "react";
import { Crown, Package } from "lucide-react";
import PageHeader from "./shared/PageHeader";
import TransactionRow, { type TransactionItem } from "./shared/TransactionRow";
import EmptyState from "./shared/EmptyState";

export default function TopupHistoryPage() {
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wallet/topup-history?page=${p}`);
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
      <div className="mx-auto max-w-lg lg:max-w-3xl xl:max-w-4xl">
        <PageHeader title="Lịch sử nạp xu" />

        {loading && items.length === 0 ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-orange-500 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Crown}
            title="Chưa có giao dịch nạp xu"
            subtitle="Mua gói bậc để nâng cấp hộp quà và nhận nhiều xu hơn mỗi lần mở hộp"
            ctaLabel="Xem gói bậc"
            ctaHref="/vip"
          />
        ) : (
          <div
            className="mx-4 mt-2 overflow-hidden rounded-2xl divide-y divide-white/5 lg:mx-6 xl:mx-8"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {items.map((item, i) => (
              <TransactionRow
                key={item.id}
                item={{ ...item, direction: "credit" }}
                index={i}
                icon={item.metadata?.packageName ? Crown : Package}
                iconColor="#FF6B2B"
                iconBg="rgba(255,107,43,0.12)"
              />
            ))}

            {/* Load more */}
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
