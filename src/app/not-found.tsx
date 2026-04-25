import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center select-none">
      {/* Decorative glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-vibe-pink/10 rounded-full blur-[120px]" />
      </div>

      {/* 404 number */}
      <p className="text-[120px] lg:text-[180px] font-black leading-none text-vibe-pink/20 select-none pointer-events-none">
        404
      </p>

      {/* Film-strip icon */}
      <div className="relative -mt-6 mb-8">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-vibe-pink mx-auto drop-shadow-[0_0_20px_rgba(255,69,0,0.6)]"
        >
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
          <line x1="7" y1="2" x2="7" y2="22" />
          <line x1="17" y1="2" x2="17" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="2" y1="7" x2="7" y2="7" />
          <line x1="2" y1="17" x2="7" y2="17" />
          <line x1="17" y1="17" x2="22" y2="17" />
          <line x1="17" y1="7" x2="22" y2="7" />
        </svg>
      </div>

      <h1 className="text-white font-black text-2xl lg:text-4xl mb-3">
        Trang không tồn tại
      </h1>
      <p className="text-white/50 text-sm lg:text-base max-w-xs mb-10">
        Nội dung bạn tìm kiếm đã bị xóa, đổi tên hoặc tạm thời không khả dụng.
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-vibe-pink hover:bg-vibe-pink/90 text-white font-bold px-8 py-3 rounded-full transition-all active:scale-95 shadow-[0_0_20px_rgba(255,69,0,0.4)]"
      >
        Về trang chủ
      </Link>
    </div>
  );
}
