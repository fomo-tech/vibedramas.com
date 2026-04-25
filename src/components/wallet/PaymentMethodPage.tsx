"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { CreditCard, Plus, Trash2 } from "lucide-react";
import PageHeader from "./shared/PageHeader";
import PaymentMethodCard, {
  type PaymentMethodItem,
} from "./shared/PaymentMethodCard";
import AddPaymentMethodSheet from "./shared/AddPaymentMethodSheet";
import ConfirmSheet from "@/components/shared/ConfirmSheet";

export default function PaymentMethodPage() {
  const [methods, setMethods] = useState<PaymentMethodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PaymentMethodItem | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const fetchMethods = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wallet/payment-methods");
      if (!res.ok) return;
      const data = await res.json();
      setMethods(data.items ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/wallet/payment-methods/${id}`, {
        method: "PATCH",
      });
      if (res.ok) {
        setMethods((prev) =>
          prev.map((m) => ({ ...m, isDefault: m.id === id })),
        );
      }
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/wallet/payment-methods/${deleteTarget.id}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setMethods((prev) => {
          const remaining = prev.filter((m) => m.id !== deleteTarget.id);
          // If deleted was default and there's another method, promote first
          if (deleteTarget.isDefault && remaining.length > 0) {
            remaining[0] = { ...remaining[0], isDefault: true };
          }
          return remaining;
        });
      }
    } catch {
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleAdded = (method: PaymentMethodItem) => {
    setMethods((prev) => {
      if (method.isDefault) {
        return [method, ...prev.map((m) => ({ ...m, isDefault: false }))];
      }
      return [method, ...prev];
    });
  };

  return (
    <div className="h-full bg-black overflow-y-auto pb-24 lg:pb-8">
      <div className="max-w-lg mx-auto">
        <PageHeader
          title="Phương thức thanh toán"
          right={
            <button
              onClick={() => setShowAdd(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,69,0,0.15)" }}
            >
              <Plus size={16} style={{ color: "#FF4500" }} />
            </button>
          }
        />

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-orange-500 animate-spin" />
          </div>
        ) : methods.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center px-8"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <CreditCard size={26} className="text-white/20" />
            </div>
            <p className="text-white/40 font-bold">Chưa có phương thức nào</p>
            <p className="text-white/20 text-sm mt-1">
              Thêm tài khoản ngân hàng hoặc ví điện tử để rút xu
            </p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowAdd(true)}
              className="mt-5 flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm text-white"
              style={{
                background: "linear-gradient(135deg, #FF4500 0%, #FF6B2B 100%)",
                boxShadow: "0 6px 20px rgba(255,69,0,0.3)",
              }}
            >
              <Plus size={15} />
              Thêm phương thức
            </motion.button>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 }}
              className="mx-4 mt-3 rounded-2xl overflow-hidden divide-y divide-white/5"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {methods.map((m, i) => (
                <PaymentMethodCard
                  key={m.id}
                  method={m}
                  index={i}
                  onSetDefault={handleSetDefault}
                  onDelete={(id) =>
                    setDeleteTarget(methods.find((x) => x.id === id) ?? null)
                  }
                />
              ))}
            </motion.div>

            {/* Add more button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.12 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowAdd(true)}
              className="mx-4 mt-3 w-[calc(100%-2rem)] py-4 rounded-2xl font-black text-sm border border-dashed border-white/12 text-white/40 hover:text-white/60 hover:border-white/20 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={15} />
              Thêm phương thức
            </motion.button>

            {/* Info note */}
            <p className="text-center text-white/20 text-xs mt-4 px-8 leading-relaxed">
              Thông tin thanh toán được bảo mật và chỉ dùng để xử lý yêu cầu rút
              xu
            </p>
          </>
        )}
      </div>

      {/* Add method sheet */}
      <AddPaymentMethodSheet
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={handleAdded}
      />

      {/* Delete confirm sheet */}
      <ConfirmSheet
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xóa phương thức?"
        description={
          deleteTarget
            ? `Xóa ${deleteTarget.bankName} — ${deleteTarget.accountNumber.slice(-4)} khỏi danh sách?`
            : undefined
        }
        confirmLabel="Xóa"
        variant="danger"
        loading={deleting}
        icon={Trash2}
      />
    </div>
  );
}
