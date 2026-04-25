"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface PageHeaderProps {
  title: string;
  right?: React.ReactNode;
}

export default function PageHeader({ title, right }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div
      className="flex items-center justify-between px-5 py-4 sticky top-0 z-10 backdrop-blur-2xl border-b border-white/6 pt-safe"
      style={{ background: "rgba(0,0,0,0.80)" }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center"
        >
          <ArrowLeft size={16} className="text-white/70" />
        </button>
        <h1 className="text-base font-black text-white tracking-tight">
          {title}
        </h1>
      </div>
      <div>{right ?? null}</div>
    </div>
  );
}
