"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, RefreshCw, Trash2, Pencil, Flame } from "lucide-react";
import { useAlert } from "@/hooks/useAlert";
import { useToast } from "@/hooks/useToast";

interface TopupPackage {
  _id: string;
  label: string;
  amount: number;
  coins: number;
  bonus: number;
  hot: boolean;
  isActive: boolean;
  order: number;
}

const EMPTY: Omit<TopupPackage, "_id"> = {
  label: "",
  amount: 0,
  coins: 0,
  bonus: 0,
  hot: false,
  isActive: true,
  order: 0,
};

function fmt(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

export default function AdminTopupPackagesPage() {
  const { showConfirm } = useAlert();
  const toast = useToast();
  const [packages, setPackages] = useState<TopupPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TopupPackage | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/topup-packages");
      const data = await res.json();
      setPackages(Array.isArray(data) ? data : []);
    } catch {
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = (pkg: TopupPackage) => {
    setEditing(pkg);
    setForm({
      label: pkg.label,
      amount: pkg.amount,
      coins: pkg.coins,
      bonus: pkg.bonus,
      hot: pkg.hot,
      isActive: pkg.isActive,
      order: pkg.order,
    });
    setModalOpen(true);
  };

  const handleDelete = (id: string, label: string) => {
    showConfirm({
      title: `Xóa gói "${label}"?`,
      message: "Gói nạp này sẽ bị xóa vĩnh viễn.",
      confirmText: "Xóa",
      variant: "danger",
      onConfirm: async () => {
        await fetch(`/api/admin/topup-packages/${id}`, { method: "DELETE" });
        toast.success("Đã xóa", `Gói ${label} đã được xóa`);
        fetchPackages();
      },
    });
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    await fetch(`/api/admin/topup-packages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    fetchPackages();
  };

  const handleSave = async () => {
    if (!form.label || !form.amount || !form.coins) {
      toast.error("Thiếu thông tin", "Vui lòng điền nhãn, số tiền và số xu");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const res = await fetch(`/api/admin/topup-packages/${editing._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Failed");
        toast.success("Đã cập nhật", `Gói ${form.label} đã được cập nhật`);
      } else {
        const res = await fetch("/api/admin/topup-packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Failed");
        toast.success("Đã tạo", `Gói ${form.label} đã được tạo`);
      }
      setModalOpen(false);
      fetchPackages();
    } catch {
      toast.error("Lỗi", "Không thể lưu gói nạp");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Gói nạp xu</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Cấu hình các mệnh giá nạp xu cho người dùng. Người dùng chỉ có thể
            chọn từ các gói này.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start lg:self-auto">
          <button
            onClick={fetchPackages}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-bold transition-colors"
          >
            <Plus size={16} />
            Thêm gói
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl bg-gray-800"
            />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg font-bold">Chưa có gói nào</p>
          <p className="text-sm mt-1">
            Thêm gói nạp xu để người dùng có thể chọn
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-900 border-b border-gray-800">
              <tr>
                <th className="text-left px-4 py-3 text-gray-400 font-bold">
                  Nhãn
                </th>
                <th className="text-right px-4 py-3 text-gray-400 font-bold">
                  Giá (xu)
                </th>
                <th className="text-right px-4 py-3 text-gray-400 font-bold">
                  Nhận (xu)
                </th>
                <th className="text-center px-4 py-3 text-gray-400 font-bold">
                  Bonus
                </th>
                <th className="text-center px-4 py-3 text-gray-400 font-bold">
                  HOT
                </th>
                <th className="text-center px-4 py-3 text-gray-400 font-bold">
                  Hiển thị
                </th>
                <th className="text-center px-4 py-3 text-gray-400 font-bold">
                  Thứ tự
                </th>
                <th className="text-center px-4 py-3 text-gray-400 font-bold">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {packages.map((pkg) => (
                <tr
                  key={pkg._id}
                  className="bg-gray-900/50 hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-4 py-3 font-bold text-white">
                    {pkg.label}
                  </td>
                  <td className="px-4 py-3 text-right text-white">
                    {fmt(pkg.amount)}
                  </td>
                  <td className="px-4 py-3 text-right text-yellow-400 font-bold">
                    {fmt(pkg.coins)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {pkg.bonus > 0 ? (
                      <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">
                        +{pkg.bonus}%
                      </span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {pkg.hot ? (
                      <Flame size={16} className="inline text-orange-400" />
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleActive(pkg._id, pkg.isActive)}
                      className={`px-2 py-0.5 rounded-full text-xs font-bold transition-colors ${
                        pkg.isActive
                          ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                          : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                      }`}
                    >
                      {pkg.isActive ? "Bật" : "Tắt"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400">
                    {pkg.order}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(pkg)}
                        className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(pkg._id, pkg.label)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-black text-white">
              {editing ? "Sửa gói nạp" : "Thêm gói nạp"}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Nhãn hiển thị *
                </label>
                <input
                  value={form.label}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, label: e.target.value }))
                  }
                  placeholder="vd: 50K, 100K..."
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-red-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Giá (xu) *
                  </label>
                  <input
                    type="number"
                    value={form.amount || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, amount: Number(e.target.value) }))
                    }
                    placeholder="50000"
                    className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Số xu *
                  </label>
                  <input
                    type="number"
                    value={form.coins || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, coins: Number(e.target.value) }))
                    }
                    placeholder="50000"
                    className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-red-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Bonus %
                  </label>
                  <input
                    type="number"
                    value={form.bonus || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, bonus: Number(e.target.value) }))
                    }
                    placeholder="0"
                    className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Thứ tự
                  </label>
                  <input
                    type="number"
                    value={form.order || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, order: Number(e.target.value) }))
                    }
                    placeholder="0"
                    className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-red-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.hot}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, hot: e.target.checked }))
                    }
                    className="w-4 h-4 accent-orange-500"
                  />
                  <span className="text-sm text-gray-300">HOT badge</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, isActive: e.target.checked }))
                    }
                    className="w-4 h-4 accent-green-500"
                  />
                  <span className="text-sm text-gray-300">Hiển thị</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-bold transition-colors"
              >
                {saving ? "Đang lưu..." : editing ? "Cập nhật" : "Tạo gói"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
