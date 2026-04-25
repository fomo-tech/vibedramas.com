"use client";

import Link from "next/link";

export default function AdminVipPage() {
  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-gray-900 p-6">
      <h1 className="text-2xl font-black text-white">Gói bậc đã được gộp</h1>
      <p className="text-sm text-gray-300 leading-relaxed">
        Hệ thống hiện dùng một nguồn dữ liệu duy nhất cho cả gói mua và bậc
        thưởng. Vui lòng cấu hình tại trang Bậc hộp quà để tránh lệch dữ liệu.
      </p>
      <Link
        href="/admin/ranks"
        className="inline-flex items-center rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-400 transition-colors"
      >
        Mở trang Bậc hộp quà
      </Link>
    </div>
  );
}
