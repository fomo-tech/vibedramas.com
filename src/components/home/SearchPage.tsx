"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Search,
  X,
  TrendingUp,
  Clock,
  Flame,
  Play,
  Star,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Drama {
  _id: string;
  name: string;
  slug: string;
  origin_name: string;
  thumb_url: string;
  poster_url: string;
  episode_total: string;
  episode_current: string;
  category: { name: string; slug: string }[];
  year: number;
  quality: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TRENDING_TAGS = [
  "Hàn Quốc",
  "Trung Quốc",
  "Lãng mạn",
  "Hành động",
  "Cổ trang",
  "Hiện đại",
  "Thần tượng",
  "Hài hước",
  "Tâm lý",
  "Phiêu lưu",
];

const TRENDING_SEARCHES = [
  "Sóng gió hôn nhân",
  "Hoàng đế trở về",
  "Tình yêu ngọt ngào",
  "Bí mật gia tộc",
  "Anh hùng thời đại",
];

const ALL_DRAMAS_PREVIEW_LIMIT = 20;

// ─── ResultCard ───────────────────────────────────────────────────────────────

function ResultCard({ drama, index }: { drama: Drama; index: number }) {
  const img = drama.thumb_url || drama.poster_url || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: "easeOut" }}
    >
      <Link
        href={`/short/${drama.slug}`}
        className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 active:bg-white/8 transition-colors rounded-xl group"
      >
        {/* Thumb */}
        <div className="relative w-14 h-20 rounded-lg overflow-hidden bg-white/5 shrink-0 border border-white/8 group-hover:border-vibe-pink/30 transition-all">
          {img ? (
            <Image
              src={img}
              alt={drama.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="56px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Play size={16} className="text-white/20" />
            </div>
          )}
          {/* quality badge */}
          {drama.quality && (
            <div className="absolute bottom-0.5 left-0.5 bg-black/70 text-[8px] font-black text-vibe-pink px-1 rounded">
              {drama.quality}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight truncate group-hover:text-vibe-pink transition-colors">
            {drama.name}
          </p>
          {drama.origin_name && (
            <p className="text-white/35 text-xs mt-0.5 truncate">
              {drama.origin_name}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {drama.category?.[0] && (
              <span className="text-[10px] text-white/40 bg-white/5 px-1.5 py-0.5 rounded">
                {drama.category[0].name}
              </span>
            )}
            {drama.episode_current && (
              <span className="text-[10px] text-vibe-pink/80 font-bold">
                {drama.episode_current}
              </span>
            )}
          </div>
        </div>

        <ArrowLeft
          size={14}
          className="text-white/15 rotate-180 shrink-0 group-hover:text-vibe-pink/50 transition-colors"
        />
      </Link>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Drama[]>([]);
  const [allDramas, setAllDramas] = useState<Drama[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAll, setLoadingAll] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Autofocus on mount + Load all dramas
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    // Load recent searches
    try {
      const saved = localStorage.getItem("vibe_recent_searches");
      if (saved) setRecentSearches(JSON.parse(saved).slice(0, 5));
    } catch {}

    // Load all dramas
    fetchAllDramas();

    return () => clearTimeout(t);
  }, []);

  // Hydrate query from URL when opening /search?q=...
  useEffect(() => {
    const q = searchParams.get("q")?.trim() || "";
    if (!q) return;
    setQuery(q);
    doSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchAllDramas = async () => {
    setLoadingAll(true);
    try {
      const res = await fetch("/api/dramas?limit=100&sort=view");
      if (res.ok) {
        const data = await res.json();
        setAllDramas(data.dramas || []);
      }
    } catch (error) {
      console.error("Failed to fetch all dramas:", error);
    } finally {
      setLoadingAll(false);
    }
  };

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    const trimmed = value.trim();
    if (trimmed) {
      router.replace(`/search?q=${encodeURIComponent(trimmed)}`, {
        scroll: false,
      });
    } else {
      router.replace("/search", { scroll: false });
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 350);
  };

  const handleSelectSuggestion = (term: string) => {
    setQuery(term);
    router.replace(`/search?q=${encodeURIComponent(term)}`, { scroll: false });
    doSearch(term);
    saveRecent(term);
  };

  const saveRecent = (term: string) => {
    try {
      const prev = JSON.parse(
        localStorage.getItem("vibe_recent_searches") || "[]",
      ) as string[];
      const updated = [term, ...prev.filter((s) => s !== term)].slice(0, 8);
      localStorage.setItem("vibe_recent_searches", JSON.stringify(updated));
      setRecentSearches(updated.slice(0, 5));
    } catch {}
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.replace(`/search?q=${encodeURIComponent(query.trim())}`, {
        scroll: false,
      });
      doSearch(query);
      saveRecent(query.trim());
    }
  };

  const clearRecent = () => {
    localStorage.removeItem("vibe_recent_searches");
    setRecentSearches([]);
  };

  const showEmpty = !query;
  const showResults = query.length > 0;

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 28, stiffness: 200, mass: 0.8 }}
      className="h-full bg-black flex flex-col overflow-hidden"
    >
      {/* ── Top bar ── */}
      <div className="shrink-0 pt-safe flex items-center gap-3 px-4 pt-4 pb-3 border-b border-white/6">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-white/6 border border-white/8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all shrink-0"
        >
          <ArrowLeft size={18} />
        </motion.button>

        {/* Search input */}
        <form onSubmit={handleSubmit} className="flex-1 relative">
          <div className="flex items-center gap-2.5 bg-zinc-900/80 border border-white/8 hover:border-vibe-pink/30 focus-within:border-vibe-pink/50 rounded-xl px-3.5 py-2.5 transition-all">
            <Search size={15} className="text-white/30 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Tìm kiếm phim, diễn viên..."
              className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none"
              autoComplete="off"
            />
            <AnimatePresence>
              {query && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  onClick={() => {
                    setQuery("");
                    setResults([]);
                    inputRef.current?.focus();
                  }}
                  className="text-white/30 hover:text-white/60 transition-colors"
                >
                  <X size={14} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </form>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Empty state — show all dramas + trending + recent */}
          {showEmpty && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="px-4 pt-5 space-y-7 pb-24"
            >
              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-white/40" />
                      <span className="text-white/50 text-xs font-bold uppercase tracking-wider">
                        Tìm kiếm gần đây
                      </span>
                    </div>
                    <button
                      onClick={clearRecent}
                      className="text-white/25 text-xs hover:text-white/50 transition-colors"
                    >
                      Xóa
                    </button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => handleSelectSuggestion(term)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Clock size={13} className="text-white/20 shrink-0" />
                          <span className="text-white/70 text-sm group-hover:text-white transition-colors">
                            {term}
                          </span>
                        </div>
                        <ArrowLeft
                          size={12}
                          className="text-white/15 rotate-180 group-hover:text-vibe-pink/40 transition-colors"
                        />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Trending tags */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={14} className="text-vibe-pink" />
                  <span className="text-white/50 text-xs font-bold uppercase tracking-wider">
                    Thể loại phổ biến
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TRENDING_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleSelectSuggestion(tag)}
                      className="px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-white/8 hover:border-vibe-pink/40 hover:bg-vibe-pink/8 text-white/55 hover:text-vibe-pink text-sm font-semibold transition-all active:scale-95"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </section>

              {/* Trending searches */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Flame size={14} className="text-vibe-pink" />
                  <span className="text-white/50 text-xs font-bold uppercase tracking-wider">
                    Từ khóa hot
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TRENDING_SEARCHES.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleSelectSuggestion(term)}
                      className="px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-white/8 hover:border-vibe-pink/40 hover:bg-vibe-pink/8 text-white/55 hover:text-vibe-pink text-sm font-semibold transition-all active:scale-95"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </section>

              {/* All dramas list */}
              <section>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Flame size={14} className="text-vibe-pink" />
                    <span className="text-white/50 text-xs font-bold uppercase tracking-wider">
                      Tất cả phim ngắn
                    </span>
                  </div>
                  <Link
                    href="/all"
                    className="text-[11px] font-bold text-vibe-pink/85 hover:text-vibe-pink transition-colors"
                  >
                    Xem tất cả
                  </Link>
                </div>

                {loadingAll ? (
                  <div className="space-y-3">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 animate-pulse"
                      >
                        <div className="w-14 h-20 rounded-lg bg-white/5 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3.5 bg-white/5 rounded-md w-3/4" />
                          <div className="h-2.5 bg-white/4 rounded-md w-1/2" />
                          <div className="h-2 bg-white/3 rounded-md w-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    {allDramas
                      .slice(0, ALL_DRAMAS_PREVIEW_LIMIT)
                      .map((drama, i) => (
                        <ResultCard key={drama._id} drama={drama} index={i} />
                      ))}
                  </div>
                )}
              </section>
            </motion.div>
          )}

          {/* Results */}
          {showResults && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="pt-2 pb-24"
            >
              {/* Loading shimmer */}
              {isLoading && (
                <div className="px-4 space-y-3 pt-2">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 animate-pulse"
                    >
                      <div className="w-14 h-20 rounded-lg bg-white/5 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-white/5 rounded-md w-3/4" />
                        <div className="h-2.5 bg-white/4 rounded-md w-1/2" />
                        <div className="h-2 bg-white/3 rounded-md w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No results */}
              {!isLoading && results.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-20 text-center px-8"
                >
                  <div className="w-16 h-16 rounded-full bg-vibe-pink/10 flex items-center justify-center mb-4">
                    <Search size={26} className="text-vibe-pink/40" />
                  </div>
                  <p className="text-white/40 font-bold text-base">
                    Không tìm thấy kết quả
                  </p>
                  <p className="text-white/20 text-sm mt-1">
                    Thử từ khóa khác nhé
                  </p>
                </motion.div>
              )}

              {/* Result list */}
              {!isLoading && results.length > 0 && (
                <>
                  <p className="px-4 py-2 text-white/25 text-xs font-bold">
                    {results.length} kết quả cho &ldquo;{query}&rdquo;
                  </p>
                  <div>
                    {results.map((drama, i) => (
                      <ResultCard key={drama._id} drama={drama} index={i} />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
