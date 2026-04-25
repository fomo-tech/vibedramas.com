"use client";

import { useEffect, useRef, useState, RefObject } from "react";
import { useAuthStore } from "@/store/useAuthStore";

interface CoinToast {
  amount: number;
  id: number;
}

export function useWatchEarn(
  videoRef: RefObject<HTMLVideoElement | null>,
  episodeId: string,
) {
  const { user, addCoins } = useAuthStore();
  const [coinToast, setCoinToast] = useState<CoinToast | null>(null);

  const realSeconds = useRef(0);
  const lastTime = useRef<number | null>(null);
  const minuteIndex = useRef(0);
  const earning = useRef(false); // prevent concurrent requests
  const toastId = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    // Chỉ chạy nếu có user, có episodeId, có video element
    if (!video || !episodeId || !user?.id) return;

    const handleTimeUpdate = () => {
      const now = video.currentTime;

      if (lastTime.current !== null) {
        const delta = now - lastTime.current;
        // delta > 0  → đang play (không phải pause)
        // delta < 2  → không phải seek/tua nhanh
        if (delta > 0 && delta < 2) {
          realSeconds.current += delta;
        }
      }
      lastTime.current = now;

      // Đủ 60 giây thực → earn
      if (realSeconds.current >= 60 && !earning.current) {
        realSeconds.current = 0;
        const idx = minuteIndex.current++;
        earning.current = true;

        fetch("/api/coins/earn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            episodeId,
            minuteIndex: idx,
          }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.amount) {
              addCoins(data.amount);
              const id = ++toastId.current;
              setCoinToast({ amount: data.amount, id });
              setTimeout(() => {
                setCoinToast((prev) => (prev?.id === id ? null : prev));
              }, 2500);
            }
          })
          .catch(() => {
            // Lỗi mạng → hoàn lại giây đã đếm để thử lại phút sau
            minuteIndex.current--;
          })
          .finally(() => {
            earning.current = false;
          });
      }
    };

    // Reset khi tab bị ẩn (minimize, chuyển tab)
    const handleVisibility = () => {
      if (document.hidden) {
        lastTime.current = null;
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      document.removeEventListener("visibilitychange", handleVisibility);
      // Reset khi unmount (chuyển episode/thoát)
      realSeconds.current = 0;
      lastTime.current = null;
      minuteIndex.current = 0;
    };
  }, [videoRef, episodeId, user?.id, addCoins]);

  return { coinToast };
}
