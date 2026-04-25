"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center select-none">
      {/* Decorative glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-red-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Warning icon */}
      <div className="mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="72"
          height="72"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-red-400 mx-auto drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>

      <h1 className="text-white font-black text-2xl lg:text-4xl mb-3">
        Đã có lỗi xảy ra
      </h1>
      <p className="text-white/50 text-sm lg:text-base max-w-xs mb-2">
        Ứng dụng gặp sự cố không mong muốn. Vui lòng thử lại.
      </p>

      {error.digest && (
        <p className="text-white/20 text-[11px] font-mono mb-8">
          #{error.digest}
        </p>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-vibe-pink hover:bg-vibe-pink/90 text-white font-bold px-8 py-3 rounded-full transition-all active:scale-95 shadow-[0_0_20px_rgba(255,69,0,0.4)]"
        >
          Thử lại
        </button>
        <a
          href="/"
          className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-3 rounded-full transition-all active:scale-95 border border-white/10"
        >
          Về trang chủ
        </a>
      </div>
    </div>
  );
}
