"use client";

import { motion } from "framer-motion";
import {
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Zap,
  Trophy,
} from "lucide-react";

export interface VipPackageRow {
  _id: string;
  name: string;
  days: number;
  price: number;
  coinsPerMinute: number;
  giftRank: number;
  badge?: string;
  badgeVariant?: "popular" | "best";
  isActive: boolean;
  order: number;
  updatedAt?: string;
}

interface PackageTableProps {
  packages: VipPackageRow[];
  onEdit: (pkg: VipPackageRow) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, current: boolean) => void;
}

export default function PackageTable({
  packages,
  onEdit,
  onDelete,
  onToggleActive,
}: PackageTableProps) {
  const formatUpdatedAt = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("vi-VN", {
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (packages.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 text-sm">
        Chưa có gói nào. Tạo gói đầu tiên!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-900 text-gray-400 text-xs uppercase tracking-wider">
            <th className="px-4 py-3 text-left">Gói</th>
            <th className="px-4 py-3 text-center">Số ngày</th>
            <th className="px-4 py-3 text-center">Giá (xu)</th>
            <th className="px-4 py-3 text-center">Kiếm xu khi xem</th>
            <th className="px-4 py-3 text-center">Cấp hộp quà</th>
            <th className="px-4 py-3 text-center">Badge</th>
            <th className="px-4 py-3 text-center">Thứ tự</th>
            <th className="px-4 py-3 text-center">Cập nhật lúc</th>
            <th className="px-4 py-3 text-center">Trạng thái</th>
            <th className="px-4 py-3 text-center">Hành động</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {packages.map((pkg, i) => (
            <motion.tr
              key={pkg._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-gray-950 hover:bg-gray-900/60 transition-colors"
            >
              <td className="px-4 py-3">
                <span className="font-bold text-white">{pkg.name}</span>
              </td>
              <td className="px-4 py-3 text-center text-gray-300">
                {pkg.days}
              </td>
              <td className="px-4 py-3 text-center">
                <span className="font-bold text-orange-400">
                  {Number(pkg.price ?? 0).toLocaleString("vi-VN")}
                </span>
              </td>
              <td className="px-4 py-3 text-center text-gray-300 text-xs">
                {pkg.coinsPerMinute > 1
                  ? `+${pkg.coinsPerMinute} xu/phút`
                  : "Mặc định (đã bật)"}
              </td>
              <td className="px-4 py-3 text-center text-gray-300 text-xs">
                Bậc {pkg.giftRank ?? 1}
              </td>
              <td className="px-4 py-3 text-center">
                {pkg.badge ? (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase
                      ${
                        pkg.badgeVariant === "best"
                          ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                          : "bg-white/10 text-white/60 border border-white/10"
                      }`}
                  >
                    {pkg.badgeVariant === "best" ? (
                      <Trophy size={8} />
                    ) : (
                      <Zap size={8} />
                    )}
                    {pkg.badge}
                  </span>
                ) : (
                  <span className="text-gray-600">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-center text-gray-400">
                {pkg.order}
              </td>
              <td className="px-4 py-3 text-center text-gray-400 text-xs whitespace-nowrap">
                {formatUpdatedAt(pkg.updatedAt)}
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => onToggleActive(pkg._id, pkg.isActive)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold transition-colors"
                >
                  {pkg.isActive ? (
                    <>
                      <ToggleRight size={18} className="text-green-400" />
                      <span className="text-green-400">Hoạt động</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft size={18} className="text-gray-500" />
                      <span className="text-gray-500">Ẩn</span>
                    </>
                  )}
                </button>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onEdit(pkg)}
                    className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(pkg._id)}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
