"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OfflinePage() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setTimeout(() => router.push("/"), 800);
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [router]);

  const retry = () => {
    setChecking(true);
    setTimeout(() => {
      if (navigator.onLine) {
        router.push("/");
      } else {
        setChecking(false);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center select-none">
      {/* Decorative glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-vibe-pink/10 rounded-full blur-[120px]" />
      </div>

      {/* Pulsing no-wifi icon */}
      <div className="mb-8 animate-pulse">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-vibe-pink mx-auto drop-shadow-[0_0_24px_rgba(255,69,0,0.5)]"
        >
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <circle cx="12" cy="20" r="1.5" fill="currentColor" />
        </svg>
      </div>

      <h1 className="text-white font-black text-2xl lg:text-4xl mb-3">
        Mất kết nối mạng
      </h1>
      <p className="text-white/50 text-sm lg:text-base max-w-xs mb-10 leading-relaxed">
        Kiểm tra Wi-Fi hoặc dữ liệu di động của bạn, rồi thử lại.
      </p>

      {isOnline ? (
        <div className="flex items-center gap-2 text-green-400 font-bold animate-pulse">
          <span className="w-2 h-2 bg-green-400 rounded-full inline-block" />
          Đã có kết nối. Đang chuyển hướng...
        </div>
      ) : (
        <button
          onClick={retry}
          disabled={checking}
          className="inline-flex items-center gap-2 bg-vibe-pink hover:bg-vibe-pink/90 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-full transition-all active:scale-95 shadow-[0_0_20px_rgba(255,69,0,0.4)]"
        >
          {checking ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Đang kiểm tra...
            </>
          ) : (
            "Thử lại"
          )}
        </button>
      )}
    </div>
  );
}
