"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export interface TransactionItem {
  id: string;
  type: string;
  direction?: "credit" | "debit";
  amount: number;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface TransactionRowProps {
  item: TransactionItem;
  index?: number;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

export default function TransactionRow({
  item,
  index = 0,
  icon: Icon,
  iconColor,
  iconBg,
}: TransactionRowProps) {
  const isDebit = item.direction === "debit";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className="flex items-center gap-3 px-4 py-3.5"
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: iconBg }}
      >
        <Icon size={18} style={{ color: iconColor }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white/90 text-sm font-semibold leading-tight truncate">
          {item.description}
        </p>
        {typeof item.metadata?.note === "string" && item.metadata.note && (
          <p className="text-white/30 text-[11px] mt-0.5 truncate">
            {item.metadata.note}
          </p>
        )}
        <p className="text-white/25 text-[11px] mt-0.5">
          {timeAgo(item.createdAt)}
        </p>
      </div>

      {/* Amount */}
      <div className="shrink-0 text-right">
        <span
          className="font-black text-sm"
          style={{ color: isDebit ? "#f87171" : "#4ade80" }}
        >
          {isDebit ? "-" : "+"}
          {item.amount.toLocaleString("vi-VN")}
        </span>
        <span className="text-white/30 text-[10px] ml-0.5">xu</span>
      </div>
    </motion.div>
  );
}
