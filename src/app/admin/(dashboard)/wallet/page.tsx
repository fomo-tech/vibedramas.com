"use client";

import { useEffect, useState } from "react";
import {
  Wallet,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  DollarSign,
} from "lucide-react";
import { useAlert } from "@/hooks/useAlert";

interface CoinPackage {
  id: string;
  label: string;
  price: number;
  coins: number;
  bonus: number;
  popular?: boolean;
}

export default function AdminWalletPage() {
  const { showConfirm } = useAlert();
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [minWithdrawAmount, setMinWithdrawAmount] = useState(50000);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function fetchConfig() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/wallet");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Không thể tải cấu hình");
        return;
      }
      setPackages(data.packages || []);
      setMinWithdrawAmount(Number(data.minWithdrawAmount) || 50000);
    } catch {
      setError("Không thể kết nối server");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchConfig();
  }, []);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packages, minWithdrawAmount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Không thể lưu cấu hình");
        return;
      }
      setSuccess("Đã lưu cấu hình thành công!");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Không thể kết nối server");
    } finally {
      setSaving(false);
    }
  }

  function updatePackage(index: number, field: keyof CoinPackage, value: any) {
    setPackages((prev) =>
      prev.map((pkg, i) => (i === index ? { ...pkg, [field]: value } : pkg)),
    );
  }

  function addPackage() {
    setPackages((prev) => [
      ...prev,
      {
        id: `coin_${Date.now()}`,
        label: "Gói mới",
        price: 50000,
        coins: 50,
        bonus: 0,
        popular: false,
      },
    ]);
  }

  function removePackage(index: number) {
    showConfirm({
      title: "Xóa gói?",
      message: "Gói này sẽ bị xoá khỏi danh sách.",
      confirmText: "Xóa",
      variant: "danger",
      onConfirm: () =>
        setPackages((prev) => prev.filter((_, i) => i !== index)),
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Quản lý Nạp Rút</h1>
            <p className="text-gray-400 text-sm">
              Cấu hình các gói xu cho người dùng (1 xu = 1 VNĐ)
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchConfig}
            disabled={loading}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Tải lại</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Đang lưu..." : "Lưu"}</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Add Package Button */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-2">
        <label className="block text-sm text-gray-300 font-medium">
          Số xu rút tối thiểu
        </label>
        <input
          type="number"
          min={1}
          value={minWithdrawAmount}
          onChange={(e) => setMinWithdrawAmount(Number(e.target.value || 0))}
          className="w-full md:w-80 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
        />
        <p className="text-xs text-gray-500">
          Giá trị áp dụng cho tất cả API rút tiền.
        </p>
      </div>

      {/* Add Package Button */}
      <button
        onClick={addPackage}
        className="w-full py-3 border-2 border-dashed border-gray-700 hover:border-green-500/50 rounded-xl text-gray-400 hover:text-green-400 transition-colors flex items-center justify-center space-x-2"
      >
        <Plus className="w-5 h-5" />
        <span>Thêm gói nạp xu</span>
      </button>

      {/* Packages List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {packages.map((pkg, index) => (
          <div
            key={pkg.id}
            className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Gói #{index + 1}</h3>
              <button
                onClick={() => removePackage(index)}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* ID */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">ID</label>
                <input
                  type="text"
                  value={pkg.id}
                  onChange={(e) => updatePackage(index, "id", e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              {/* Label */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Tên gói
                </label>
                <input
                  type="text"
                  value={pkg.label}
                  onChange={(e) =>
                    updatePackage(index, "label", e.target.value)
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Giá (xu)
                </label>
                <input
                  type="number"
                  value={pkg.price}
                  onChange={(e) =>
                    updatePackage(index, "price", Number(e.target.value))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              {/* Coins */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Số xu nhận được
                </label>
                <input
                  type="number"
                  value={pkg.coins}
                  onChange={(e) =>
                    updatePackage(index, "coins", Number(e.target.value))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              {/* Bonus */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Bonus (%)
                </label>
                <input
                  type="number"
                  value={pkg.bonus}
                  onChange={(e) =>
                    updatePackage(index, "bonus", Number(e.target.value))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              {/* Popular */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={pkg.popular || false}
                  onChange={(e) =>
                    updatePackage(index, "popular", e.target.checked)
                  }
                  className="w-4 h-4 rounded border-gray-700 bg-gray-900"
                />
                <label className="text-sm text-gray-300">
                  Đánh dấu "Phổ biến"
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
