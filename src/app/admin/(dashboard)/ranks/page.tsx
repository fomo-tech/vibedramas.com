"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Info } from "lucide-react";
import RankTable, { RankRow } from "@/components/admin/ranks/RankTable";

export default function AdminRanksPage() {
  const [ranks, setRanks] = useState<RankRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRanks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ranks");
      const data = await res.json();
      setRanks(Array.isArray(data) ? data : []);
    } catch {
      setRanks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(fetchRanks, 0);
    return () => window.clearTimeout(timer);
  }, [fetchRanks]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Cấp độ người dùng</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Cấu hình mốc EXP và phần thưởng cho từng level.
          </p>
        </div>
        <button
          onClick={fetchRanks}
          disabled={loading}
          className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Info box */}
      <div className="flex items-start gap-3 bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
        <Info size={16} className="text-orange-400 mt-0.5 shrink-0" />
        <div className="text-sm text-gray-300 space-y-1">
          <p>
            <strong className="text-white">Mốc EXP</strong> là tổng EXP cần có
            để tự động mở khóa level tương ứng.
          </p>
          <p>
            <strong className="text-white">EXP / hộp và Xu / hộp</strong> được
            cộng sau mỗi lần người dùng xem đủ thời gian và mở hộp quà.
          </p>
          <p>
            Level tăng tự động theo EXP, không có mua gói hoặc thời hạn sử dụng.
          </p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-500 text-sm animate-pulse">
          Đang tải dữ liệu cấp độ...
        </div>
      ) : (
        <RankTable ranks={ranks} onSaved={fetchRanks} />
      )}
    </div>
  );
}
