"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, Smartphone } from "lucide-react";
import { useWindowSize } from "@/hooks/useWindowSize";
import type { PaymentMethodItem } from "./PaymentMethodCard";

// ─── Bank list ────────────────────────────────────────────────────────────────

const BANKS = [
  { code: "VCB", name: "Vietcombank" },
  { code: "TCB", name: "Techcombank" },
  { code: "MB", name: "MB Bank" },
  { code: "VPB", name: "VPBank" },
  { code: "BIDV", name: "BIDV" },
  { code: "AGR", name: "Agribank" },
  { code: "CTG", name: "VietinBank" },
  { code: "ACB", name: "ACB" },
  { code: "STB", name: "Sacombank" },
  { code: "HDB", name: "HDBank" },
  { code: "TPB", name: "TPBank" },
  { code: "OCB", name: "OCB" },
  { code: "MSB", name: "MSB" },
  { code: "SCB", name: "SCB" },
  { code: "SHB", name: "SHB" },
  { code: "EIB", name: "Eximbank" },
  { code: "LPB", name: "LienVietPostBank" },
  { code: "NAB", name: "Nam A Bank" },
  { code: "PGB", name: "PG Bank" },
  { code: "VIB", name: "VIB" },
];

const METHOD_TYPES = [
  { value: "bank", label: "Ngân hàng", icon: Building2 },
  { value: "momo", label: "MoMo", icon: Smartphone },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddPaymentMethodSheetProps {
  open: boolean;
  onClose: () => void;
  onAdded: (method: PaymentMethodItem) => void;
}

// ─── Input field ─────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-white/40 text-[11px] font-bold uppercase tracking-widest mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-white text-sm font-semibold placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 focus:bg-white/8 transition-all"
      />
    </div>
  );
}

// ─── Inner form ───────────────────────────────────────────────────────────────

function Inner({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (m: PaymentMethodItem) => void;
}) {
  const [methodType, setMethodType] = useState<"bank" | "momo">("bank");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedBank = BANKS.find((b) => b.code === bankCode);

  const bankName = methodType === "bank" ? (selectedBank?.name ?? "") : "MoMo";

  const handleSubmit = async () => {
    setError("");
    if (methodType === "bank" && !bankCode) {
      setError("Vui lòng chọn ngân hàng");
      return;
    }
    if (!accountNumber.trim()) {
      setError(
        methodType === "bank"
          ? "Vui lòng nhập số tài khoản"
          : "Vui lòng nhập số điện thoại",
      );
      return;
    }
    if (!accountName.trim()) {
      setError("Vui lòng nhập tên chủ tài khoản");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/wallet/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: methodType,
          bankName,
          bankCode: methodType === "bank" ? bankCode : undefined,
          accountNumber: accountNumber.replace(/\s/g, ""),
          accountName: accountName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Đã có lỗi xảy ra");
        return;
      }
      onAdded(data);
      onClose();
    } catch {
      setError("Không thể kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#111] border border-white/8 rounded-t-3xl lg:rounded-3xl overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-orange-500/40 to-transparent" />
      <div className="lg:hidden flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-white/15" />
      </div>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/8 hover:bg-white/14 flex items-center justify-center text-white/40 hover:text-white transition-all"
      >
        <X size={15} />
      </button>

      <div className="px-5 pt-5 pb-8 lg:pt-6">
        <h2 className="text-white font-black text-xl tracking-tight text-center mb-6">
          Thêm phương thức
        </h2>

        {/* Type tabs */}
        <div className="flex gap-2 mb-6 bg-white/4 rounded-2xl p-1">
          {METHOD_TYPES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => {
                setMethodType(value);
                setError("");
              }}
              className="flex-1 py-2.5 rounded-xl text-sm font-black transition-all"
              style={{
                background:
                  methodType === value
                    ? "linear-gradient(135deg,#FF4500,#FF6B2B)"
                    : "transparent",
                color: methodType === value ? "#fff" : "rgba(255,255,255,0.35)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {/* Bank selector */}
          {methodType === "bank" && (
            <div>
              <label className="block text-white/40 text-[11px] font-bold uppercase tracking-widest mb-1.5">
                Ngân hàng
              </label>
              <select
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-orange-500/50 transition-all appearance-none"
                style={{ color: bankCode ? "#fff" : "rgba(255,255,255,0.2)" }}
              >
                <option value="" disabled className="bg-[#111] text-white/40">
                  Chọn ngân hàng
                </option>
                {BANKS.map((b) => (
                  <option
                    key={b.code}
                    value={b.code}
                    className="bg-[#111] text-white"
                  >
                    {b.code} — {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Field
            label={methodType === "bank" ? "Số tài khoản" : "Số điện thoại"}
            value={accountNumber}
            onChange={setAccountNumber}
            placeholder={
              methodType === "bank" ? "Nhập số tài khoản" : "0912 345 678"
            }
            type={methodType === "bank" ? "text" : "tel"}
          />

          <Field
            label="Tên chủ tài khoản"
            value={accountName}
            onChange={setAccountName}
            placeholder="NGUYEN VAN A"
          />
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-xs font-semibold mt-3 text-center"
          >
            {error}
          </motion.p>
        )}

        <motion.button
          onClick={handleSubmit}
          disabled={loading}
          whileTap={loading ? {} : { scale: 0.97 }}
          className="w-full mt-6 py-4 rounded-2xl font-black text-white text-base transition-all disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #FF4500 0%, #FF6B2B 100%)",
            boxShadow: "0 8px 24px rgba(255,69,0,0.3)",
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Đang thêm...
            </span>
          ) : (
            "Thêm phương thức"
          )}
        </motion.button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AddPaymentMethodSheet({
  open,
  onClose,
  onAdded,
}: AddPaymentMethodSheetProps) {
  const { width } = useWindowSize();
  const isDesktop = (width ?? 0) >= 1024;

  if (isDesktop) {
    return (
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="bd"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-400 bg-black/70 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 z-401 flex items-center justify-center pointer-events-none px-4"
            >
              <div className="pointer-events-auto w-full max-w-sm relative">
                <Inner onClose={onClose} onAdded={onAdded} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="bd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-400 bg-black/60"
            onClick={onClose}
          />
          <motion.div
            key="drawer"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-0 left-0 right-0 z-401 relative"
          >
            <Inner onClose={onClose} onAdded={onAdded} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
