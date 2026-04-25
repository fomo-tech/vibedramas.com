"use client";

import { motion } from "framer-motion";
import { Check, Star, Trash2, MoreVertical } from "lucide-react";
import { useState } from "react";

export interface PaymentMethodItem {
  id: string;
  type: "bank" | "momo" | "zalopay";
  bankName: string;
  bankCode?: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
}

interface PaymentMethodCardProps {
  method: PaymentMethodItem;
  index?: number;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
}

function maskAccount(num: string) {
  if (num.length <= 4) return num;
  return "*".repeat(num.length - 4) + num.slice(-4);
}

const TYPE_LABEL: Record<string, string> = {
  bank: "Ngân hàng",
  momo: "MoMo",
};

const TYPE_COLOR: Record<string, string> = {
  bank: "#3b82f6",
  momo: "#e91e8c",
};

const TYPE_BG: Record<string, string> = {
  bank: "rgba(59,130,246,0.12)",
  momo: "rgba(233,30,140,0.12)",
};

function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className="text-[10px] font-black px-2 py-0.5 rounded-lg"
      style={{
        background: TYPE_BG[type] ?? "rgba(255,255,255,0.08)",
        color: TYPE_COLOR[type] ?? "#fff",
      }}
    >
      {TYPE_LABEL[type] ?? type}
    </span>
  );
}

export default function PaymentMethodCard({
  method,
  index = 0,
  onSetDefault,
  onDelete,
}: PaymentMethodCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="relative flex items-center gap-3 px-4 py-4"
      onClick={() => setMenuOpen(false)}
    >
      {/* Icon */}
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-black text-sm"
        style={{
          background: TYPE_BG[method.type] ?? "rgba(255,255,255,0.06)",
          color: TYPE_COLOR[method.type] ?? "#fff",
        }}
      >
        {method.bankCode
          ? method.bankCode.slice(0, 3)
          : method.bankName.slice(0, 2).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-white/90 text-sm font-bold truncate">
            {method.bankName}
          </span>
          <TypeBadge type={method.type} />
          {method.isDefault && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-orange-500/15 text-orange-400">
              Mặc định
            </span>
          )}
        </div>
        <p className="text-white/35 text-xs font-mono tracking-wider">
          {maskAccount(method.accountNumber)}
        </p>
        <p className="text-white/30 text-[11px] mt-0.5 truncate">
          {method.accountName}
        </p>
      </div>

      {/* Options button */}
      <div className="relative shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/25 hover:text-white/60 hover:bg-white/8 transition-all"
        >
          <MoreVertical size={16} />
        </button>

        {menuOpen && (
          <>
            {/* Invisible backdrop to close menu */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.14 }}
              className="absolute right-0 top-9 z-20 w-44 rounded-2xl overflow-hidden"
              style={{
                background: "#1a1a1a",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
              }}
            >
              {!method.isDefault && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onSetDefault(method.id);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-white/80 hover:bg-white/6 transition-colors"
                >
                  <Check size={15} className="text-green-400" />
                  Đặt làm mặc định
                </button>
              )}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(method.id);
                }}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-red-400 hover:bg-red-500/8 transition-colors"
              >
                <Trash2 size={15} />
                Xóa phương thức
              </button>
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
}
