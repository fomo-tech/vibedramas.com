"use client";

import { useState, useEffect } from "react";
import { Landmark, Edit2, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/useToast";

interface BankAccount {
  _id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  bankBranch?: string;
  isActive: boolean;
  createdAt: string;
}

export default function BankAccountManager() {
  const toast = useToast();
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
    bankBranch: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAccount();
  }, []);

  const fetchAccount = async () => {
    try {
      const res = await fetch("/api/admin/bank-accounts");
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setAccount(data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching bank account:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = account
        ? `/api/admin/bank-accounts?id=${account._id}`
        : "/api/admin/bank-accounts";
      const method = account ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchAccount();
        setShowForm(false);
        setFormData({
          bankName: "",
          accountNumber: "",
          accountName: "",
          bankBranch: "",
        });
      } else {
        const error = await res.json();
        toast.error("Lỗi", error.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error saving bank account:", error);
      toast.error("Lỗi", "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    if (account) {
      setFormData({
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        bankBranch: account.bankBranch || "",
      });
      setShowForm(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-vibe-pink" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Landmark className="w-8 h-8 text-blue-500" />
          <div>
            <h2 className="text-2xl font-black text-white">Cấu Hình Sepay</h2>
            <p className="text-sm text-gray-400">
              Tài khoản ngân hàng nhận tiền nạp tự động
            </p>
          </div>
        </div>
      </div>

      {/* Current Account */}
      {account && !showForm && (
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Landmark className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-black text-white text-xl">
                  {account.bankName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-green-400 font-bold">
                    Đang hoạt động
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg font-bold transition-all"
            >
              <Edit2 className="w-4 h-4" />
              Chỉnh sửa
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-black/20 rounded-xl p-4">
            <div>
              <label className="text-xs text-gray-500 uppercase mb-1 block">
                Số tài khoản
              </label>
              <p className="text-white font-mono font-black text-lg">
                {account.accountNumber}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase mb-1 block">
                Chủ tài khoản
              </label>
              <p className="text-white font-bold">{account.accountName}</p>
            </div>
            {account.bankBranch && (
              <div>
                <label className="text-xs text-gray-500 uppercase mb-1 block">
                  Chi nhánh
                </label>
                <p className="text-gray-300">{account.bankBranch}</p>
              </div>
            )}
          </div>

          <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <p className="text-sm text-yellow-300">
              <strong>Lưu ý:</strong> Tài khoản này sẽ nhận tất cả giao dịch nạp
              tiền từ người dùng. Đảm bảo tích hợp Sepay webhook để tự động cộng
              xu.
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!account && !showForm && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
            <Landmark className="w-10 h-10 text-blue-400" />
          </div>
          <h3 className="text-xl font-black text-white mb-2">
            Chưa cấu hình Sepay
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Thêm tài khoản ngân hàng để nhận tiền nạp tự động từ người dùng
            thông qua hệ thống Sepay
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-vibe-pink hover:bg-vibe-pink/90 text-white rounded-xl font-black transition-all"
          >
            Thêm Tài Khoản Ngân Hàng
          </button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">
            {account ? "Chỉnh sửa tài khoản" : "Thêm tài khoản Sepay"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">
                  Ngân hàng *
                </label>
                <select
                  value={formData.bankName}
                  onChange={(e) =>
                    setFormData({ ...formData, bankName: e.target.value })
                  }
                  required
                  className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-vibe-pink outline-none"
                >
                  <option value="">Chọn ngân hàng</option>
                  <option value="Vietcombank">Vietcombank (VCB)</option>
                  <option value="Techcombank">Techcombank (TCB)</option>
                  <option value="VietinBank">VietinBank (CTG)</option>
                  <option value="BIDV">BIDV</option>
                  <option value="Agribank">Agribank</option>
                  <option value="MBBank">MB Bank (MB)</option>
                  <option value="TPBank">TPBank</option>
                  <option value="Sacombank">Sacombank (STB)</option>
                  <option value="VPBank">VPBank</option>
                  <option value="ACB">ACB</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">
                  Số tài khoản *
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, accountNumber: e.target.value })
                  }
                  required
                  className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-vibe-pink outline-none font-mono"
                  placeholder="1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">
                  Tên chủ tài khoản *
                </label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      accountName: e.target.value.toUpperCase(),
                    })
                  }
                  required
                  className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-vibe-pink outline-none uppercase"
                  placeholder="NGUYEN VAN A"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">
                  Chi nhánh (tùy chọn)
                </label>
                <input
                  type="text"
                  value={formData.bankBranch}
                  onChange={(e) =>
                    setFormData({ ...formData, bankBranch: e.target.value })
                  }
                  className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-vibe-pink outline-none"
                  placeholder="Hà Nội"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({
                    bankName: "",
                    accountNumber: "",
                    accountName: "",
                    bankBranch: "",
                  });
                }}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-all"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-3 bg-vibe-pink hover:bg-vibe-pink/90 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>{account ? "Cập nhật" : "Thêm tài khoản"}</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
