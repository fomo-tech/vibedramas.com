"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  Check,
  X,
  Loader2,
  Filter,
  QrCode,
  Copy,
  CheckCheck,
  ArrowDownCircle,
  AlertTriangle,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import Image from "next/image";
import { useToast } from "@/hooks/useToast";
import { useAlert } from "@/hooks/useAlert";

interface WithdrawRequest {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  amount: number;
  paymentMethod: string;
  paymentDetails: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  };
  status: "pending" | "processing" | "completed" | "rejected";
  adminNote?: string;
  userNote?: string;
  processedBy?: {
    name: string;
    email: string;
  };
  createdAt: string;
  processedAt?: string;
}

const statusColors = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusLabels = {
  pending: "Chờ duyệt",
  processing: "Đang xử lý",
  completed: "Đã chuyển",
  rejected: "Từ chối",
};

const BANK_CODE_MAP: Record<string, string> = {
  Vietcombank: "VCB",
  Techcombank: "TCB",
  VietinBank: "CTG",
  BIDV: "BIDV",
  Agribank: "ACB",
  MBBank: "MB",
  TPBank: "TPB",
  Sacombank: "STB",
  VPBank: "VPB",
  ACB: "ACB",
};

export default function WithdrawalManager() {
  const toast = useToast();
  const { showConfirm } = useAlert();

  const [withdrawals, setWithdrawals] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    id: string | null;
    reason: string;
  }>({ open: false, id: null, reason: "" });

  useEffect(() => {
    fetchWithdrawals();
  }, [statusFilter, page]);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (statusFilter !== "all") params.append("status", statusFilter);
      const res = await fetch(`/api/admin/withdrawals?${params}`);
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data.withdrawals || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      toast.error("Lỗi", "Không thể tải danh sách rút tiền");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (id: string, action: "approve" | "reject") => {
    const note = adminNotes[id] || "";

    if (action === "reject") {
      setRejectModal({ open: true, id, reason: note });
    } else {
      showConfirm({
        title: "Xác nhận đã chuyển tiền?",
        message: "Xác nhận bạn đã chuyển khoản thành công cho user.",
        confirmText: "Xác nhận đã chuyển",
        variant: "primary",
        onConfirm: () => doAction(id, action, note),
      });
    }
  };

  const submitReject = () => {
    if (!rejectModal.id) return;
    if (!rejectModal.reason.trim()) {
      toast.error("Thiếu lý do", "Vui lòng nhập lý do từ chối");
      return;
    }
    const { id, reason } = rejectModal;
    setRejectModal({ open: false, id: null, reason: "" });
    doAction(id, "reject", reason);
  };

  const doAction = async (
    id: string,
    action: "approve" | "reject",
    note: string,
  ) => {
    setProcessing(id);
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, adminNote: note }),
      });
      if (res.ok) {
        toast.success(
          action === "approve" ? "Đã xác nhận" : "Đã từ chối",
          action === "approve"
            ? "Yêu cầu rút tiền đã được duyệt"
            : "Tiền đã được hoàn lại cho user",
        );
        setAdminNotes((prev) => {
          const n = { ...prev };
          delete n[id];
          return n;
        });
        await fetchWithdrawals();
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

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  const generateQRUrl = (w: WithdrawRequest): string => {
    const bankCode =
      BANK_CODE_MAP[w.paymentDetails.bankName || ""] ||
      w.paymentDetails.bankName ||
      "";
    const desc = `Rut tien ${w.user.name}`;
    return `https://img.vietqr.io/image/${bankCode}-${w.paymentDetails.accountNumber}-compact.png?amount=${w.amount}&addInfo=${encodeURIComponent(desc)}`;
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-vibe-pink" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-vibe-pink rounded-xl flex items-center justify-center shadow-[0_4px_16px_rgba(255,115,0,0.3)]">
          <ArrowDownCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">Quản Lý Rút Tiền</h2>
          <p className="text-sm text-gray-400">
            Duyệt yêu cầu rút tiền và chuyển khoản cho user
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-5 h-5 text-gray-400" />
        {["all", "pending", "processing", "completed", "rejected"].map(
          (status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                statusFilter === status
                  ? "bg-vibe-pink text-white shadow-[0_2px_12px_rgba(255,42,109,0.35)]"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {status === "all"
                ? "Tất cả"
                : statusLabels[status as keyof typeof statusLabels]}
            </button>
          ),
        )}
      </div>

      {/* List */}
      <div className="space-y-4">
        {withdrawals.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-800/50 border border-gray-700 rounded-xl">
            Không có yêu cầu rút tiền nào
          </div>
        ) : (
          withdrawals.map((w) => (
            <div
              key={w._id}
              className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden"
            >
              <div className="p-4 space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-white">
                        {w.user.name}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {w.user.email}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusColors[w.status]}`}
                      >
                        {statusLabels[w.status]}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(w.createdAt), {
                        addSuffix: true,
                        locale: vi,
                      })}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-black text-orange-400">
                      {formatCurrency(w.amount)}
                    </div>
                  </div>
                </div>

                {/* Bank info */}
                <div className="bg-gray-900/60 rounded-xl p-3 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-gray-500 text-xs mb-0.5">
                      Ngân hàng
                    </div>
                    <div className="text-white font-bold">
                      {w.paymentDetails.bankName}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-0.5">
                      Số tài khoản
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-white font-mono font-bold">
                        {w.paymentDetails.accountNumber}
                      </span>
                      <button
                        onClick={() =>
                          copyText(
                            w.paymentDetails.accountNumber || "",
                            `stk-${w._id}`,
                          )
                        }
                        className="text-gray-500 hover:text-vibe-pink transition-colors"
                      >
                        {copied === `stk-${w._id}` ? (
                          <CheckCheck size={13} className="text-green-400" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-0.5">
                      Chủ tài khoản
                    </div>
                    <div className="text-white font-bold">
                      {w.paymentDetails.accountName}
                    </div>
                  </div>
                </div>

                {/* User note */}
                {w.userNote && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2.5 text-sm">
                    <span className="text-yellow-400 font-bold text-xs">
                      Ghi chú user:{" "}
                    </span>
                    <span className="text-white/80">{w.userNote}</span>
                  </div>
                )}

                {/* Admin note (processed) */}
                {w.adminNote && w.status !== "pending" && (
                  <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-2.5 text-sm">
                    <span className="text-gray-400 font-bold text-xs">
                      Admin:{" "}
                    </span>
                    <span className="text-white/80">{w.adminNote}</span>
                  </div>
                )}

                {/* Pending actions */}
                {w.status === "pending" && (
                  <div className="space-y-2.5 pt-1">
                    <input
                      type="text"
                      value={adminNotes[w._id] || ""}
                      onChange={(e) =>
                        setAdminNotes((prev) => ({
                          ...prev,
                          [w._id]: e.target.value,
                        }))
                      }
                      placeholder="Ghi chú (tuỳ chọn)..."
                      className="w-full bg-gray-900/60 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-vibe-pink/50 outline-none transition-all"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setShowQR(showQR === w._id ? null : w._id)
                        }
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/20 rounded-lg font-bold text-sm transition-all"
                      >
                        <QrCode className="w-4 h-4" />
                        QR chuyển khoản
                      </button>
                      <button
                        onClick={() => handleAction(w._id, "approve")}
                        disabled={processing === w._id}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-black text-sm transition-all disabled:opacity-50 shadow-[0_2px_12px_rgba(34,197,94,0.3)]"
                      >
                        {processing === w._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Đã chuyển tiền
                      </button>
                      <button
                        onClick={() => handleAction(w._id, "reject")}
                        disabled={processing === w._id}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        Từ chối
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* QR panel */}
              {showQR === w._id && (
                <div className="border-t border-gray-700 bg-white flex items-center justify-center p-4">
                  <Image
                    src={generateQRUrl(w)}
                    alt="VietQR"
                    width={300}
                    height={300}
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

      {/* Reject reason modal */}
      <AnimatePresence>
        {rejectModal.open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() =>
                setRejectModal({ open: false, id: null, reason: "" })
              }
              className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9998]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 24 }}
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-sm px-4"
            >
              <div className="bg-gray-950/98 backdrop-blur-3xl border border-white/8 rounded-3xl shadow-2xl overflow-hidden">
                <div className="h-0.5 w-full bg-gradient-to-r from-red-500 to-rose-500" />
                <div className="p-6 pb-0">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-red-500/15 ring-1 ring-red-500/30 w-14 h-14 rounded-2xl flex items-center justify-center mb-4">
                      <AlertTriangle size={26} className="text-red-400" />
                    </div>
                    <h3 className="text-white font-black text-xl mb-1">
                      Từ chối yêu cầu?
                    </h3>
                    <p className="text-white/50 text-sm">
                      Tiền sẽ được hoàn lại vào tài khoản user.
                    </p>
                  </div>
                  <div className="mt-4">
                    <label className="block text-xs font-bold text-gray-400 mb-2">
                      Lý do từ chối <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      autoFocus
                      rows={3}
                      value={rejectModal.reason}
                      onChange={(e) =>
                        setRejectModal((p) => ({
                          ...p,
                          reason: e.target.value,
                        }))
                      }
                      placeholder="VD: Thông tin tài khoản không khớp, yêu cầu vượt hạn mức..."
                      className="w-full bg-gray-900/80 border border-gray-700 focus:border-red-500/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition-all resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.ctrlKey) submitReject();
                      }}
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Ctrl+Enter để xác nhận
                    </p>
                  </div>
                </div>
                <div className="p-6 pt-4 flex gap-3">
                  <button
                    onClick={() =>
                      setRejectModal({ open: false, id: null, reason: "" })
                    }
                    className="flex-1 bg-white/5 hover:bg-white/8 border border-white/8 text-white/70 hover:text-white font-bold py-3.5 rounded-2xl transition-all text-sm"
                  >
                    Huỷ
                  </button>
                  <button
                    onClick={submitReject}
                    className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-black py-3.5 rounded-2xl transition-all text-sm shadow-[0_4px_20px_rgba(239,68,68,0.3)]"
                  >
                    Từ chối & Hoàn tiền
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
