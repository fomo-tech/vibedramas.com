"use client";

import React, { useState, useEffect, startTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Play, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HistoryItem {
  _id: string;
  slug: string;
  name: string;
  origin_name: string;
  thumb_url: string;
  poster_url: string;
  episode: string;
  watchedAt: number; // timestamp
  progress?: number; // 0-100
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Vừa xem";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ngày trước`;
  return new Date(ts).toLocaleDateString("vi-VN");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setMounted(true);
      try {
        const raw = localStorage.getItem("vibe_watch_history");
        if (raw) setHistory(JSON.parse(raw));
      } catch {}
    });
  }, []);

  const removeItem = (id: string) => {
    const updated = history.filter((h) => h._id !== id);
    setHistory(updated);
    localStorage.setItem("vibe_watch_history", JSON.stringify(updated));
  };

  const clearAll = () => {
    setHistory([]);
    localStorage.removeItem("vibe_watch_history");
  };

  if (!mounted) return null;

  return (
    <div className="h-full bg-black overflow-y-auto pb-24 lg:pb-8">
      <div className="w-full max-w-lg mx-auto lg:max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 lg:px-6 pt-6 lg:pt-8 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-vibe-pink/10 flex items-center justify-center">
              <Clock size={16} className="text-vibe-pink" />
            </div>
            <h1 className="text-white font-black text-xl tracking-tight">
              Lịch sử xem
            </h1>
          </div>
          {history.length > 0 && (
            <button
              onClick={clearAll}
              className="text-white/25 text-xs hover:text-white/50 transition-colors flex items-center gap-1"
            >
              <Trash2 size={12} />
              Xóa tất cả
            </button>
          )}
        </div>

        {/* Content */}
        {history.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center px-8"
          >
            <div className="w-16 h-16 rounded-full bg-white/4 flex items-center justify-center mb-4">
              <Clock size={24} className="text-white/20" />
            </div>
            <p className="text-white/30 font-bold">Chưa có lịch sử xem</p>
            <p className="text-white/15 text-sm mt-1">
              Hãy xem phim và quay lại đây nhé!
            </p>
            <Link
              href="/"
              className="mt-4 text-vibe-pink text-sm font-bold hover:underline"
            >
              Khám phá phim ngay →
            </Link>
          </motion.div>
        ) : (
          <div className="px-4 lg:px-6 space-y-1">
            <AnimatePresence>
              {history.map((item, i) => {
                const img = item.thumb_url || item.poster_url || "";
                return (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12, height: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    className="flex items-center gap-3 py-2 group"
                  >
                    <Link
                      href={`/short/${item.slug}?ep=${encodeURIComponent(item.episode)}`}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      {/* Thumb */}
                      <div className="relative w-16 h-24 rounded-xl overflow-hidden bg-white/5 shrink-0 border border-white/6 group-hover:border-vibe-pink/30 transition-all">
                        {img && (
                          <Image
                            src={img}
                            alt={item.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="64px"
                          />
                        )}
                        {/* Progress bar on thumb */}
                        {item.progress !== undefined && item.progress > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
                            <div
                              className="h-full bg-vibe-pink"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        )}
                        {/* Play overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                          <Play
                            size={20}
                            className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            fill="white"
                          />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm leading-tight truncate group-hover:text-vibe-pink transition-colors">
                          {item.name}
                        </p>
                        {item.origin_name && (
                          <p className="text-white/30 text-xs mt-0.5 truncate">
                            {item.origin_name}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-vibe-pink/80 font-bold bg-vibe-pink/10 px-1.5 py-0.5 rounded">
                            Tập {item.episode}
                          </span>
                          <span className="text-white/20 text-[10px]">
                            {timeAgo(item.watchedAt)}
                          </span>
                        </div>
                      </div>
                    </Link>

                    {/* Delete */}
                    <button
                      onClick={() => removeItem(item._id)}
                      className="w-7 h-7 rounded-full bg-white/4 hover:bg-red-500/20 flex items-center justify-center text-white/15 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
