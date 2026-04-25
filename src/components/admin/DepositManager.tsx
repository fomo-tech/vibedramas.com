"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  Check,
  X,
  Clock,
  Loader2,
  Filter,
  ChevronDown,
  QrCode,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import Image from "next/image";
import { useToast } from "@/hooks/useToast";
import { useAlert } from "@/hooks/useAlert";

interface DepositOrder {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  amount: number;
  orderCode: string;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  qrCodeUrl?: string;
  status: "pending" | "completed" | "expired" | "cancelled";
  sepayTransactionId?: string;
  createdAt: string;
  expiresAt: string;
  completedAt?: string;
}

const statusColors = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  expired: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusLabels = {
  pending: "Chờ thanh toán",
  completed: "Hoàn thành",
  expired: "Hết hạn",
  cancelled: "Đã huỷ",
};

export default function DepositManager() {
  const toast = useToast();
  const { showConfirm } = useAlert();

  const [deposits, setDeposits] = useState<DepositOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchDeposits();
  }, [statusFilter, page]);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "20" });
      if (statusFilter !== "all") params.append("status", statusFilter);
      const res = await fetch(`/api/admin/deposits?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDeposits(data.deposits || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      toast.error("Lỗi", "Không thể tải danh sách nạp tiền");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: "confirm" | "cancel") => {
    const doAction = async () => {
      setProcessing(id);
      try {
        const res = await fetch("/api/admin/deposits", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, action, adminNote: actionNote[id] }),
        });
        if (res.ok) {
          toast.success(
            action === "confirm" ? "Đã xác nhận" : "Đã huỷ",
            action === "confirm"
              ? "Xu đã được cộng vào tài khoản user"
              : "Deposit đã bị huỷ",
          );
          setActionNote((prev) => { const n = { ...prev }; delete n[id]; return n; });
          await fetchDeposits();
        } else {
          const err = await res.json();
          toast.error("Lỗi", err.error || "Có lỗi xảy ra");
        }
      } catch {
        toast.error("Lỗi", "Có lỗi xảy ra");
      } finally {
        setProcessing(null);
      }
    };

    if (action === "cancel") {
      showConfirm({
        title: "Huỷ deposit?",
        message: "Xác nhận huỷ yêu cầu nạp tiền này?",
        confirmText: "Huỷ deposit",
        variant: "danger",
        onConfirm: doAction,
      });
    } else {
      showConfirm({
        title: "Xác nhận nạp tiền?",
        message: "Xu sẽ được cộng ngay vào tài khoản user. Hành động này không thể hoàn tác.",
        confirmText: "Xác nhận & Cộng xu",
        variant: "primary",
        onConfirm: doAction,
      });
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-vibe-pink" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-green-500" />
          <div>
            <h2 className="text-2xl font-black text-white">Quản Lý Nạp Tiền</h2>
            <p className="text-sm text-gray-400">
              Xác nhận thủ công hoặc theo dõi giao dịch nạp tiền
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-5 h-5 text-gray-400" />
        {["all", "pending", "completed", "expired", "cancelled"].map((status) => (
          <button
            key={status}
            onClick={() => { setStatusFilter(status); setPage(1); }}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              statusFilter === status
                ? "bg-vibe-pink text-white shadow-[0_2px_12px_rgba(255,42,109,0.35)]"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {status === "all" ? "Tất cả" : statusLabels[status as keyof typeof statusLabels]}
          </button>
        ))}
      </div>

      {/* Deposits list */}
      <div className="space-y-3">
        {deposits.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-800/50 border border-gray-700 rounded-xl">
            Không có giao dịch nào
          </div>
        ) : (
          deposits.map((deposit) => (
            <div
              key={deposit._id}
              className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Left info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-white text-sm bg-gray-900/60 px-2 py-0.5 rounded">
                        {deposit.orderCode}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusColors[deposit.status]}`}>
                        {deposit.status === "pending" && <Clock className="w-3 h-3" />}
                        {deposit.status === "completed" && <Check className="w-3 h-3" />}
                        {(deposit.status === "expired" || deposit.status === "cancelled") && <X className="w-3 h-3" />}
                        {statusLabels[deposit.status]}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                      <div>
                        <span className="text-gray-400">User: </span>
                        <span className="text-white font-bold">{deposit.user.name}</span>
                        <span className="text-gray-500 text-xs ml-1">({deposit.user.email})</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Số tiền: </span>
                        <span className="text-green-400 font-black">{formatCurrency(deposit.amount)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Ngân hàng: </span>
                        <span className="text-white font-bold">{deposit.bankAccount.bankName}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">STK: </span>
                        <span className="text-white font-mono font-bold">{deposit.bankAccount.accountNumber}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{formatDistanceToNow(new Date(deposit.createdAt), { addSuffix: true, locale: vi })}</span>
                      {deposit.status === "pending" && (
                        <span className="text-yellow-400">
                          · Hết hạn {formatDistanceToNow(new Date(deposit.expiresAt), { addSuffix: true, locale: vi })}
                        </span>
                      )}
                      {deposit.sepayTransactionId && (
                        <span>TX: {deposit.sepayTransactionId}</span>
                      )}
                    </div>
                  </div>

                  {/* Right actions */}
                  {deposit.status === "pending" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setShowQR(showQR === deposit._id ? null : deposit._id)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/20 rounded-lg font-bold text-sm transition-all"
                      >
                        <QrCode className="w-4 h-4" />
                        QR
                      </button>
                      <button
                        onClick={() => handleAction(deposit._id, "confirm")}
                        disabled={processing === deposit._id}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-black text-sm transition-all disabled:opacity-50 shadow-[0_2px_12px_rgba(34,197,94,0.3)]"
                      >
                        {processing === deposit._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Xác nhận
                      </button>
                      <button
                        onClick={() => handleAction(deposit._id, "cancel")}
                        disabled={processing === deposit._id}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20 rounded-lg font-bold text-sm transition-all disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        Huỷ
                      </button>
                    </div>
                  )}
                </div>

                {/* Note input for pending */}
                {deposit.status === "pending" && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={actionNote[deposit._id] || ""}
                      onChange={(e) =>
                        setActionNote((prev) => ({ ...prev, [deposit._id]: e.target.value }))
                      }
                      placeholder="Ghi chú admin (tuỳ chọn)..."
                      className="w-full bg-gray-900/60 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-vibe-pink/50 outline-none transition-all"
                    />
                  </div>
                )}
              </div>

              {/* QR Code panel */}
              {showQR === deposit._id && deposit.qrCodeUrl && (
                <div className="border-t border-gray-700 bg-white flex items-center justify-center p-4">
                  <Image
                    src={deposit.qrCodeUrl}
                    alt="VietQR"
                    width={280}
                    height={280}
                    className="rounded"
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-all"
          >
            Trước
          </button>
          <div className="px-4 py-2 bg-gray-900 text-white rounded-lg font-bold">
            {page} / {totalPages}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-all"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
