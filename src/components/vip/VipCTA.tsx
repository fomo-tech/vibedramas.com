"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Loader2 } from "lucide-react";
import CoinIcon from "@/components/ui/CoinIcon";
import type { VipPackage } from "@/hooks/useVipPackages";

interface VipCTAProps {
  plan: VipPackage | null;
  onSubscribe: (planId: string) => Promise<void>;
  isOwned?: boolean;
  hidden?: boolean;
}

export default function VipCTA({
  plan,
  onSubscribe,
  hidden = false,
}: VipCTAProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading || !plan) return;
    setLoading(true);
    try {
      await onSubscribe(plan._id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {plan && !hidden && (
        <motion.div
          initial={{ y: 120, opacity: 0, filter: "blur(8px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: 120, opacity: 0, filter: "blur(8px)" }}
          transition={{
            type: "spring",
            damping: 26,
            stiffness: 360,
            mass: 0.72,
          }}
          className="fixed inset-x-0 bottom-0 z-1200 pointer-events-none lg:sticky lg:z-50"
        >
          <div className="pointer-events-auto rounded-t-3xl border border-white/12 border-b-0 bg-linear-to-b from-zinc-950 via-black to-black px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] shadow-[0_-20px_50px_rgba(0,0,0,0.6)] lg:rounded-none lg:border-0 lg:bg-linear-to-t lg:from-black lg:via-black/95 lg:to-transparent lg:pt-6 lg:pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] lg:shadow-none">
            <div className="lg:hidden flex justify-center pb-2">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <div className="space-y-3">
              <div className="lg:hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 flex items-center justify-between">
                <p className="text-white/85 text-xs font-black uppercase tracking-[0.14em] truncate pr-3">
                  {plan.name}
                </p>
                <p className="text-white text-sm font-black shrink-0">
                  {Number(plan.price ?? 0).toLocaleString("vi-VN")} xu
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.25 }}
                className="hidden lg:block rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <p className="text-white/80 text-xs font-bold uppercase tracking-[0.16em]">
                  Gói bậc đã chọn · Mua và áp dụng ngay
                </p>
                <p className="mt-1 text-white/45 text-[11px] leading-relaxed">
                  Áp dụng bậc hộp quà {plan.giftRank ?? 1}. Xem phim đủ thời
                  gian → mở hộp → nhận xu theo bậc. Mua gói mới sẽ thay thế gói
                  hiện tại, không cộng dồn thời hạn cũ.
                </p>
              </motion.div>

              <motion.button
                whileTap={{ scale: 0.975 }}
                onClick={handleClick}
                disabled={loading}
                className="w-full relative flex items-center justify-center gap-2.5 bg-linear-to-r from-vibe-pink to-orange-500 hover:brightness-110 text-white font-black text-base rounded-2xl py-4 shadow-[0_0_34px_rgba(255,69,0,0.4),0_8px_22px_rgba(0,0,0,0.45)] transition-all duration-200 disabled:opacity-50 overflow-hidden"
              >
                <motion.div
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{
                    repeat: Infinity,
                    duration: 3,
                    ease: "linear",
                    repeatDelay: 1,
                  }}
                  className="absolute inset-0 bg-linear-to-r from-transparent via-white/15 to-transparent skew-x-12 pointer-events-none"
                />
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Crown size={18} className="shrink-0" />
                    Mua gói này
                    <CoinIcon size={16} />
                    {Number(plan.price ?? 0).toLocaleString("vi-VN")} xu
                  </>
                )}
              </motion.button>
              <p className="hidden lg:block text-center text-white/30 text-[10px] leading-relaxed">
                Thanh toán bằng xu · Mua mới thay thế gói hiện tại · Không cộng
                dồn thời hạn
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
