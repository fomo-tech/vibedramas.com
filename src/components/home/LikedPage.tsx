"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Play, X, LogIn } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LikedDrama {
  _id: string;
  slug: string;
  name: string;
  origin_name: string;
  thumb_url: string;
  poster_url: string;
  episode_total: string;
  episode_current: string;
  category: { name: string; slug: string }[];
  likedAt: number;
}

// ─── Drama Card ───────────────────────────────────────────────────────────────

function LikedCard({
  item,
  index,
  onRemove,
}: {
  item: LikedDrama;
  index: number;
  onRemove: () => void;
}) {
  const img = item.thumb_url || item.poster_url || "";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className="relative group"
    >
      <Link href={`/short/${item.slug}`}>
        {/* Thumb */}
        <div className="relative w-full aspect-2/3 rounded-xl overflow-hidden bg-white/5 border border-white/6 group-hover:border-vibe-pink/40 transition-all">
          {img && (
            <Image
              src={img}
              alt={item.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 45vw, 200px"
            />
          )}
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-vibe-pink flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-[0_0_20px_rgba(255,69,0,0.5)]">
              <Play size={16} fill="white" className="text-white ml-0.5" />
            </div>
          </div>
          {/* Gradient */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/90 to-transparent" />

          {/* Episode badge */}
          {item.episode_current && (
            <div className="absolute bottom-2 left-2 text-[9px] font-black text-vibe-pink bg-black/70 px-1.5 py-0.5 rounded">
              {item.episode_current}
            </div>
          )}
        </div>

        {/* Name */}
        <p className="text-white/80 text-xs font-bold mt-2 leading-tight line-clamp-2 group-hover:text-vibe-pink transition-colors">
          {item.name}
        </p>
        {item.category?.[0] && (
          <p className="text-white/25 text-[10px] mt-0.5 truncate">
            {item.category[0].name}
          </p>
        )}
      </Link>

      {/* Unlike button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          onRemove();
        }}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"
      >
        <X size={12} />
      </button>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LikedPage() {
  const { user, openLoginModal } = useAuthStore();
  const isLoggedIn = !!user;
  const [liked, setLiked] = useState<LikedDrama[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLiked = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/liked");
      if (!res.ok) return;
      const data = await res.json();
      setLiked(data.liked ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setLiked([]);
      return;
    }
    fetchLiked();
  }, [isLoggedIn, fetchLiked]);

  const removeItem = useCallback(async (slug: string) => {
    setLiked((prev) => prev.filter((d) => d.slug !== slug));
    await fetch("/api/liked", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, action: "unlike" }),
    }).catch(() => {});
  }, []);

  // ── Not logged in ────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="h-full bg-black flex flex-col items-center justify-center pb-24 px-8 text-center">
        <div className="w-16 h-16 rounded-full bg-vibe-pink/10 flex items-center justify-center mb-4">
          <Heart size={28} className="text-vibe-pink" />
        </div>
        <p className="text-white font-black text-lg mb-1">
          Đăng nhập để xem yêu thích
        </p>
        <p className="text-white/30 text-sm mb-6">
          Lưu những bộ phim bạn yêu thích và xem lại bất cứ lúc nào
        </p>
        <button
          onClick={openLoginModal}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm text-white"
          style={{ background: "linear-gradient(135deg, #FF4500, #FF6B2B)" }}
        >
          <LogIn size={16} />
          Đăng Nhập Ngay
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-black overflow-y-auto pb-24 lg:pb-8">
      <div className="w-full max-w-lg mx-auto lg:max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 lg:px-6 pt-6 lg:pt-8 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-vibe-pink/10 flex items-center justify-center">
              <Heart size={16} className="text-vibe-pink" fill="currentColor" />
            </div>
            <h1 className="text-white font-black text-xl tracking-tight">
              Yêu thích
            </h1>
          </div>
          {liked.length > 0 && (
            <span className="text-white/25 text-xs">
              {liked.length} bộ phim
            </span>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-vibe-pink/30 border-t-vibe-pink animate-spin" />
          </div>
        ) : liked.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center px-8"
          >
            <div className="w-16 h-16 rounded-full bg-white/4 flex items-center justify-center mb-4">
              <Heart size={24} className="text-white/20" />
            </div>
            <p className="text-white/30 font-bold">Chưa có phim yêu thích</p>
            <p className="text-white/15 text-sm mt-1">
              Nhấn ♥ trên bất kỳ phim nào để lưu vào đây
            </p>
            <Link
              href="/"
              className="mt-4 text-vibe-pink text-sm font-bold hover:underline"
            >
              Khám phá phim ngay →
            </Link>
          </motion.div>
        ) : (
          <div className="px-4 lg:px-6">
            <AnimatePresence>
              <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
                {liked.map((item, i) => (
                  <LikedCard
                    key={item._id}
                    item={item}
                    index={i}
                    onRemove={() => removeItem(item.slug)}
                  />
                ))}
              </div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
