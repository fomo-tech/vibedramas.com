"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, Eye, PlayCircle, Star, ChevronRight } from "lucide-react";
import { stripHtml } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Episode {
  _id: string;
  name: string;
  filename: string;
  link_m3u8: string;
  link_embed: string;
}

interface RelatedDrama {
  _id: string;
  name: string;
  thumb_url: string;
  view: number;
  category: { name: string; slug: string }[];
}

export interface DetailDrama {
  _id: string;
  name: string;
  origin_name?: string;
  thumb_url: string;
  poster_url?: string;
  content?: string;
  view?: number;
  year?: number;
  episode_total?: string;
  episode_current?: string;
  status?: string;
  category?: { name: string; slug: string }[];
  country?: { name: string; slug: string }[];
  actor?: string[];
  episode1: { link_m3u8: string; name: string };
}

interface Props {
  drama: DetailDrama | null;
  currentEpLink?: string;
  onClose: () => void;
  onPlayEpisode: (ep: Episode) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtView(n?: number): string {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".0", "") + "K";
  return String(n);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DramaDetailSheet({
  drama,
  currentEpLink,
  onClose,
  onPlayEpisode,
}: Props) {
  const [tab, setTab] = useState<"intro" | "episodes">("intro");
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingEp, setLoadingEp] = useState(false);
  const [related, setRelated] = useState<RelatedDrama[]>([]);
  const dramaId = drama?._id;

  // Reset state when drama changes
  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      setTab("intro");
      setEpisodes([]);
      setRelated([]);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [dramaId]);

  // Fetch episodes when tab is active
  useEffect(() => {
    if (tab !== "episodes" || !dramaId || !drama || episodes.length > 0) return;
    const ctrl = new AbortController();
    const doFetch = async () => {
      setLoadingEp(true);
      try {
        const r = await fetch(`/api/dramas/${dramaId}/episodes`, {
          signal: ctrl.signal,
        });
        const d = await r.json();
        setEpisodes(Array.isArray(d) ? d : []);
      } catch (e) {
        if ((e as Error).name !== "AbortError") console.error(e);
      } finally {
        setLoadingEp(false);
      }
    };
    doFetch();
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, dramaId]);

  // Fetch related dramas
  useEffect(() => {
    if (!drama || !dramaId) return;
    const cat = drama.category?.[0]?.slug;
    const url = cat
      ? `/api/dramas?category=${cat}&limit=7`
      : `/api/dramas?limit=7`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        const list: RelatedDrama[] = Array.isArray(d) ? d : (d?.dramas ?? []);
        setRelated(list.filter((x) => x._id !== dramaId).slice(0, 6));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dramaId]);

  const description = drama ? stripHtml(drama.content || "").trim() : "";

  return (
    <AnimatePresence>
      {drama && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 lg:left-72 z-220 bg-black/70"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-0 left-0 right-0 z-221 transform-gpu flex flex-col bg-[#0f0f0f] rounded-t-3xl border-t border-white/10 shadow-[0_-12px_48px_rgba(0,0,0,0.6)] max-h-[88dvh] lg:left-[calc(9rem+50vw)] lg:right-auto lg:-translate-x-1/2 lg:w-[calc(90dvh*9/16)] lg:max-h-[85%]"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-start gap-3 px-4 pb-4 shrink-0">
              <div className="w-16 h-20 rounded-xl overflow-hidden shrink-0 bg-white/5 border border-white/5">
                <Image
                  src={drama.thumb_url || drama.poster_url || ""}
                  alt={drama.name}
                  width={64}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-white font-black text-base leading-tight line-clamp-2">
                  {drama.name}
                </h3>
                {drama.origin_name && (
                  <p className="text-white/35 text-xs mt-0.5 truncate">
                    {drama.origin_name}
                  </p>
                )}

                <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-1.5">
                  <div className="flex items-center gap-1">
                    <Eye size={10} className="text-white/40" />
                    <span className="text-white/55 text-xs">
                      {fmtView(drama.view)} lượt xem
                    </span>
                  </div>

                  {drama.episode_total && (
                    <span className="text-white/25 text-[10px]">
                      • {drama.episode_total} tập
                    </span>
                  )}
                </div>

                <button className="flex items-center gap-1 mt-1.5 group/rating">
                  <Star size={11} className="text-amber-400 fill-amber-400" />
                  <span className="text-amber-400 text-xs font-bold">4.8</span>
                  <span className="text-white/30 text-xs">
                    (4K) Điểm đánh giá
                  </span>
                  <ChevronRight
                    size={10}
                    className="text-white/30 group-hover/rating:text-white/55 transition-colors"
                  />
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 hover:bg-white/20 active:scale-95 transition-all"
              >
                <X size={16} className="text-white" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5 shrink-0 px-4">
              {(["intro", "episodes"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`relative pb-3 mr-6 text-sm font-bold transition-colors ${
                    tab === t
                      ? "text-white"
                      : "text-white/35 hover:text-white/60"
                  }`}
                >
                  {t === "intro" ? "Giới thiệu" : "Chọn tập"}
                  {tab === t && (
                    <motion.div
                      layoutId="detail-sheet-tab-bar"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-vibe-pink rounded-full"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {tab === "intro" ? (
                <IntroTab
                  description={description}
                  categories={drama.category}
                  related={related}
                />
              ) : (
                <EpisodesTab
                  episodes={episodes}
                  loading={loadingEp}
                  currentEpLink={currentEpLink}
                  onPlay={onPlayEpisode}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function IntroTab({
  description,
  categories,
  related,
}: {
  description: string;
  categories?: { name: string; slug: string }[];
  related: RelatedDrama[];
}) {
  return (
    <div className="p-4 space-y-5 pb-12">
      {description ? (
        <p className="text-white/65 text-sm leading-relaxed">{description}</p>
      ) : (
        <p className="text-white/30 text-sm italic">Chưa có mô tả.</p>
      )}

      {categories && categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <span
              key={c.slug}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-medium hover:bg-white/10 transition-colors cursor-pointer"
            >
              {c.name}
              <ChevronRight size={9} className="text-white/25" />
            </span>
          ))}
        </div>
      )}

      {related.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-white/35 text-xs font-medium whitespace-nowrap">
              Thêm nội dung tương tự
            </span>
            <div className="flex-1 h-px bg-white/8" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {related.map((r) => (
              <RelatedCard key={r._id} drama={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EpisodesTab({
  episodes,
  loading,
  currentEpLink,
  onPlay,
}: {
  episodes: Episode[];
  loading: boolean;
  currentEpLink?: string;
  onPlay: (ep: Episode) => void;
}) {
  return (
    <div className="p-4 pb-12">
      {loading ? (
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl bg-white/5 animate-pulse"
            />
          ))}
        </div>
      ) : episodes.length === 0 ? (
        <p className="text-white/40 text-center py-12 text-sm">
          Không có tập nào
        </p>
      ) : (
        <div className="grid grid-cols-5 gap-2">
          {episodes.map((ep) => {
            const isCur = currentEpLink === ep.link_m3u8;
            return (
              <button
                key={ep._id}
                onClick={() => onPlay(ep)}
                className={`relative aspect-square rounded-xl flex items-center justify-center text-sm font-black transition-all ${
                  isCur
                    ? "bg-vibe-pink text-white shadow-[0_0_12px_rgba(255,69,0,0.5)]"
                    : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                }`}
              >
                {isCur && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                    <PlayCircle size={10} className="text-vibe-pink" />
                  </div>
                )}
                {ep.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RelatedCard({ drama }: { drama: RelatedDrama }) {
  return (
    <div className="cursor-pointer group">
      <div className="relative aspect-2/3 rounded-xl overflow-hidden bg-white/5">
        {drama.thumb_url && (
          <Image
            src={drama.thumb_url}
            alt={drama.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="120px"
          />
        )}
        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-vibe-pink text-[7px] font-black text-white uppercase rounded">
          Hot
        </div>
        <div className="absolute bottom-0 inset-x-0 px-1.5 py-1.5 bg-linear-to-t from-black/80 to-transparent">
          <div className="flex items-center gap-1 text-white/70 text-[9px]">
            <PlayCircle size={8} />
            <span>{fmtView(drama.view)}</span>
          </div>
        </div>
      </div>
      <h4 className="text-white/75 text-[10px] font-semibold leading-tight line-clamp-2 mt-1.5 group-hover:text-white transition-colors">
        {drama.name}
      </h4>
      {drama.category?.[0] && (
        <p className="text-white/30 text-[9px] mt-0.5 truncate">
          {drama.category[0].name}
        </p>
      )}
    </div>
  );
}
