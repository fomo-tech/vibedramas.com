"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Package } from "lucide-react";
import type { VipPackageRow } from "./PackageTable";

interface PackageFormData {
  name: string;
  days: string;
  price: string;
  coinsPerMinute: string;
  giftRank: string;
  badge: string;
  badgeVariant: "" | "popular" | "best";
  isActive: boolean;
  order: string;
}

const EMPTY: PackageFormData = {
  name: "",
  days: "",
  price: "",
  coinsPerMinute: "1",
  giftRank: "1",
  badge: "",
  badgeVariant: "",
  isActive: true,
  order: "0",
};

interface PackageFormModalProps {
  open: boolean;
  editing: VipPackageRow | null; // null = create mode
  onClose: () => void;
  onSaved: () => void; // refresh list
}

export default function PackageFormModal({
  open,
  editing,
  onClose,
  onSaved,
}: PackageFormModalProps) {
  const [form, setForm] = useState<PackageFormData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        days: String(editing.days),
        price: String(editing.price),
        coinsPerMinute: String(editing.coinsPerMinute),
        giftRank: String(editing.giftRank ?? 1),
        badge: editing.badge ?? "",
        badgeVariant: editing.badgeVariant ?? "",
        isActive: editing.isActive,
        order: String(editing.order),
      });
    } else {
      setForm(EMPTY);
    }
    setError("");
  }, [editing, open]);

  const set = (field: keyof PackageFormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      name: form.name.trim(),
      days: Number(form.days),
      price: Number(form.price),
      coinsPerMinute: Number(form.coinsPerMinute),
      giftRank: Number(form.giftRank),
      badge: form.badge.trim() || undefined,
      badgeVariant: form.badgeVariant || undefined,
      isActive: form.isActive,
      order: Number(form.order),
    };

    try {
      const url = editing
        ? `/api/admin/vip/packages/${editing._id}`
        : "/api/admin/vip/packages";
      const method = editing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Có lỗi xảy ra");
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError("Không thể kết nối server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-2xl bg-gray-950 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <Package size={18} className="text-orange-400" />
                  <h3 className="font-bold text-white">
                    {editing ? "Sửa gói bậc" : "Tạo gói bậc mới"}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
                >
                  <X size={16} className="text-gray-400" />
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="max-h-[calc(100vh-6rem)] overflow-y-auto px-6 py-5 space-y-4"
              >
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                    Tên gói <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="VD: Gói 7 Ngày"
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/60 transition-colors"
                  />
                </div>

                {/* Days + Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                      Thời hạn (ngày) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={form.days}
                      onChange={(e) => set("days", e.target.value)}
                      placeholder="7"
                      min="1"
                      required
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/60 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                      Giá (xu) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => set("price", e.target.value)}
                      placeholder="500"
                      min="0"
                      required
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/60 transition-colors"
                    />
                  </div>
                </div>

                {/* Coins per minute */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                    Kiếm xu khi xem (tuỳ chọn bonus){" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.coinsPerMinute}
                    onChange={(e) => set("coinsPerMinute", e.target.value)}
                    placeholder="1"
                    min="0"
                    step="0.1"
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/60 transition-colors"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    Nhập 1 để dùng mức mặc định chỉ bật kiếm tiền. Nhập lớn hơn
                    1 nếu muốn cộng thêm xu/phút.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                    Cấp bậc hộp quà <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.giftRank}
                    onChange={(e) => set("giftRank", e.target.value)}
                    placeholder="1"
                    min="1"
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/60 transition-colors"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    Khi mua gói, người dùng được nâng tối thiểu tới bậc hộp quà
                    này (nếu hiện tại thấp hơn).
                  </p>
                </div>

                {/* Badge + Variant */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                      Badge text
                    </label>
                    <input
                      type="text"
                      value={form.badge}
                      onChange={(e) => set("badge", e.target.value)}
                      placeholder="PHỔ BIẾN"
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/60 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                      Kiểu badge
                    </label>
                    <select
                      value={form.badgeVariant}
                      onChange={(e) => set("badgeVariant", e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500/60 transition-colors"
                    >
                      <option value="">Không có</option>
                      <option value="popular">popular (xám)</option>
                      <option value="best">best (cam nổi)</option>
                    </select>
                  </div>
                </div>

                {/* Order + Active */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                      Thứ tự hiển thị
                    </label>
                    <input
                      type="number"
                      value={form.order}
                      onChange={(e) => set("order", e.target.value)}
                      placeholder="0"
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/60 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                      Trạng thái
                    </label>
                    <select
                      value={form.isActive ? "true" : "false"}
                      onChange={(e) =>
                        set("isActive", e.target.value === "true")
                      }
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500/60 transition-colors"
                    >
                      <option value="true">Hoạt động</option>
                      <option value="false">Ẩn</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                    {error}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold transition-colors"
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Đang lưu...
                      </>
                    ) : editing ? (
                      "Cập nhật"
                    ) : (
                      "Tạo gói"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
