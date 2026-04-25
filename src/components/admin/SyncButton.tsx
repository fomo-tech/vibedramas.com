"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAlert } from "@/hooks/useAlert";

export default function SyncButton() {
  const [status, setStatus] = useState<
    "idle" | "syncing" | "success" | "error"
  >("idle");
  const [count, setCount] = useState(0);
  const router = useRouter();
  const { showConfirm } = useAlert();

  const handleSync = () => {
    if (status === "syncing") return;
    showConfirm({
      title: "Sync dữ liệu?",
      message: "Sẽ sync 10 trang từ OPhim1. Quá trình này mất khoảng 1 phút.",
      confirmText: "Bắt đầu sync",
      variant: "primary",
      onConfirm: doSync,
    });
  };

  const doSync = async () => {
    setStatus("syncing");
    try {
      const res = await fetch("/api/admin/sync", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        setCount(data.count);
        setStatus("success");
        router.refresh();
        setTimeout(() => setStatus("idle"), 5000);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Sync failed:", error);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 5000);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={status === "syncing"}
      className={`flex items-center space-x-2 px-6 py-3 rounded-2xl transition-all font-bold text-sm uppercase tracking-widest border shadow-sm ${
        status === "syncing"
          ? "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
          : status === "success"
            ? "bg-green-500/10 text-green-500 border-green-500/20"
            : status === "error"
              ? "bg-red-500/10 text-red-500 border-red-500/20"
              : "bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
      }`}
    >
      {status === "syncing" ? (
        <>
          <RefreshCw size={18} className="animate-spin" />
          <span>Syncing...</span>
        </>
      ) : status === "success" ? (
        <>
          <CheckCircle size={18} />
          <span>Done ({count})</span>
        </>
      ) : status === "error" ? (
        <>
          <AlertCircle size={18} />
          <span>Failed</span>
        </>
      ) : (
        <>
          <RefreshCw size={18} />
          <span>Sync API</span>
        </>
      )}
    </button>
  );
}
