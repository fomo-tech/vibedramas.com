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
    fetchRanks();
  }, [fetchRanks]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Cấp độ người dùng</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Hệ thống đã gộp VIP + cấp độ: mỗi bậc vừa là bậc thưởng hộp quà, vừa
            là gói mua với giá/thời hạn/xu-phút riêng.
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
            <strong className="text-white">Thời gian xem cơ bản (giây)</strong>{" "}
            là thời gian cần để hộp quà đầy cho mỗi lần mở quà, áp dụng trực
            tiếp theo cấu hình cấp hiện tại.
          </p>
          <p>
            <strong className="text-white">Giá / Thời hạn / Xu-phút</strong>{" "}
            quyết định chi phí mua bậc, thời gian hiệu lực và tốc độ kiếm xu khi
            xem trong thời gian kích hoạt.
          </p>
          <p>
            Hệ hiện tại dùng{" "}
            <strong className="text-white">set thẳng bậc</strong>, tức mua bậc
            nào thì user được gán ngay bậc đó; không còn cơ chế tăng bậc tự
            động.
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
