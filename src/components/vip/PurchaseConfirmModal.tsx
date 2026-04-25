"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Loader2, X, CheckCircle2, AlertTriangle } from "lucide-react";
import type { VipPackage } from "@/hooks/useVipPackages";
import CoinIcon from "@/components/ui/CoinIcon";

interface PurchaseConfirmModalProps {
  open: boolean;
  pkg: VipPackage | null;
  userCoins: number;
  loading: boolean;
  error: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function PurchaseConfirmModal({
  open,
  pkg,
  userCoins,
  loading,
  error,
  onConfirm,
  onClose,
}: PurchaseConfirmModalProps) {
  const router = useRouter();

  if (!pkg) return null;

  const pkgPrice = Number(pkg.price ?? 0);
  const safeUserCoins = Number(userCoins ?? 0);
  const hasEnough = safeUserCoins >= pkgPrice;
  const remaining = safeUserCoins - pkgPrice;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 24 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="fixed inset-0 z-100 flex items-end sm:items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-sm bg-zinc-950 rounded-3xl border border-white/10 overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
              {/* Header */}
              <div className="relative flex items-center justify-center pt-6 pb-4 px-6">
                <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-orange-500 to-rose-600 flex items-center justify-center shadow-[0_0_30px_rgba(255,69,0,0.4)]">
                  <Crown size={24} className="text-white" />
                </div>
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors"
                >
                  <X size={14} className="text-white/60" />
                </button>
              </div>

              <div className="px-6 pb-6 space-y-4">
                <div className="text-center">
                  <h3 className="text-white font-black text-lg">
                    Xác nhận mua và áp dụng ngay
                  </h3>
                  <p className="text-white/40 text-sm mt-1">
                    {pkg.name} · {pkg.days} ngày
                  </p>
                  <p className="text-orange-300/90 text-[11px] mt-2">
                    Mua gói mới sẽ thay thế gói hiện tại và tính lại thời hạn từ
                    thời điểm mua.
                  </p>
                </div>

                {/* Summary */}
                <div className="bg-white/5 border border-white/8 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Giá gói</span>
                    <span className="font-bold text-orange-400 flex items-center gap-1">
                      <CoinIcon size={15} />
                      {pkgPrice.toLocaleString("vi-VN")} xu
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Xu của bạn</span>
                    <span
                      className={`font-bold ${hasEnough ? "text-white" : "text-red-400"}`}
                    >
                      {safeUserCoins.toLocaleString("vi-VN")} xu
                    </span>
                  </div>
                  <div className="h-px bg-white/8" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Còn lại sau khi mua</span>
                    <span
                      className={`font-black ${hasEnough ? "text-green-400" : "text-red-400"}`}
                    >
                      {hasEnough
                        ? remaining.toLocaleString("vi-VN")
                        : "Không đủ xu"}{" "}
                      xu
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Cơ chế kiếm tiền</span>
                    <span className="font-bold text-yellow-400">
                      {pkg.coinsPerMinute > 1
                        ? `Bật +${pkg.coinsPerMinute} xu/phút`
                        : "Bật theo mặc định"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Cấp hộp quà áp dụng</span>
                    <span className="font-bold text-vibe-pink">
                      Bậc {pkg.giftRank ?? 1}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                    <AlertTriangle
                      size={14}
                      className="text-red-400 shrink-0"
                    />
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {!hasEnough && !error && (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <AlertTriangle
                        size={14}
                        className="text-orange-400 shrink-0"
                      />
                      <p className="text-orange-400 text-sm">
                        Bạn cần thêm{" "}
                        {(pkgPrice - safeUserCoins).toLocaleString("vi-VN")} xu
                        để mua gói này
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        router.push("/welfare");
                      }}
                      className="mt-2 w-full rounded-lg border border-orange-400/30 bg-orange-500/15 px-3 py-2 text-xs font-bold text-orange-300 hover:bg-orange-500/25 transition-colors"
                    >
                      Kiếm xu ngay
                    </button>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-2xl bg-white/8 hover:bg-white/12 text-white/60 font-bold text-sm transition-colors"
                  >
                    Huỷ
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={onConfirm}
                    disabled={!hasEnough || loading}
                    className="flex-1 py-3 rounded-2xl bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        Xác nhận mua
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
