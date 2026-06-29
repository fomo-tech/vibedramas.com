"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, ArrowRight, LucideIcon } from "lucide-react";
import Link from "next/link";
import DramaCard from "./DramaCard";

interface DramaSectionProps {
  title: string;
  icon?: LucideIcon;
  subtitle?: string;
  dramas: any[];
  rank?: boolean;
  seeMoreHref?: string;
  featured?: boolean;
}

export default function DramaSection({
  title,
  icon: Icon,
  subtitle,
  dramas,
  rank = false,
  seeMoreHref = "/all",
  featured = false,
}: DramaSectionProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const onScroll = () => {
    const el = rowRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 8);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
  };

  const scroll = (dir: "left" | "right") => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({
      left: dir === "right" ? 320 : -320,
      behavior: "smooth",
    });
  };

  return (
    <section className={`relative ${featured ? "lg:pt-0 pt-0" : ""}`}>
      {/* Featured trending header — mobile only */}
      {featured && (
        <div className="lg:hidden mx-4 mb-3 rounded-[1.35rem] overflow-hidden relative border border-orange-400/20 bg-white/[0.035] shadow-[0_16px_44px_rgba(0,0,0,0.32)]">
          <div className="absolute inset-0 bg-linear-to-br from-orange-500/18 via-vibe-pink/8 to-transparent pointer-events-none" />
          <div className="relative px-4 py-3 flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-2.5"
            >
              {Icon && (
                <span className="grid size-8 place-items-center rounded-xl bg-orange-400/15 border border-orange-300/20 shadow-[0_0_20px_rgba(255,100,0,0.14)]">
                  <Icon size={16} className="text-orange-300 shrink-0" />
                </span>
              )}
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-tight">
                  {title}
                </h2>
                <p className="text-[10px] text-white/35 mt-0.5">
                  {subtitle || "Top phim được xem nhiều nhất"}
                </p>
              </div>
            </motion.div>
            <Link
              href={seeMoreHref}
              className="flex items-center gap-1 text-orange-400 text-[10px] font-bold uppercase tracking-widest"
            >
              Xem thêm
              <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      )}

      {/* Default header — desktop always, mobile only when not featured */}
      <div
        className={`px-4 lg:px-6 mb-3.5 lg:mb-4 ${featured ? "hidden lg:block" : ""}`}
      >
        <div className="relative overflow-hidden rounded-2xl lg:rounded-[1.4rem] border border-white/[0.07] bg-white/[0.035] px-3.5 py-3 lg:px-4 lg:py-3.5 shadow-[0_18px_54px_rgba(0,0,0,0.26)]">
          <div className="absolute inset-y-0 left-0 w-1/2 bg-linear-to-r from-vibe-pink/12 via-orange-500/8 to-transparent pointer-events-none" />
          <div className="absolute -top-10 right-10 size-24 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

          <div className="relative flex items-center justify-between gap-3">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex min-w-0 items-center gap-3"
            >
              {Icon && (
                <span className="grid size-9 lg:size-10 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-vibe-pink/22 to-orange-500/16 border border-white/10 shadow-[0_0_28px_rgba(255,69,0,0.12)]">
                  <Icon size={18} className="text-orange-300 shrink-0" />
                </span>
              )}
              <div className="min-w-0">
                <h2 className="text-[15px] lg:text-xl font-black text-white uppercase tracking-tight truncate">
                  {title}
                </h2>
                {subtitle && (
                  <p className="mt-0.5 text-[10px] lg:text-xs text-white/38 font-medium line-clamp-1">
                    {subtitle}
                  </p>
                )}
              </div>
            </motion.div>

            <Link
              href={seeMoreHref}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1.5 text-vibe-pink text-[10px] lg:text-xs font-black uppercase tracking-widest hover:border-vibe-pink/35 hover:bg-vibe-pink/10 transition-all duration-200 group"
            >
              Xem thêm
              <ArrowRight
                size={12}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
          </div>
        </div>
      </div>

      <div className="relative group/row">
        <button
          onClick={() => scroll("left")}
          className={`hidden lg:flex absolute left-0 top-0 bottom-4 z-10 w-14 items-center justify-center bg-linear-to-r from-black via-black/80 to-transparent transition-opacity ${
            atStart
              ? "opacity-0 pointer-events-none"
              : "opacity-0 group-hover/row:opacity-100"
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-black/70 backdrop-blur-md border border-white/15 flex items-center justify-center hover:bg-white/15 transition-all shadow-[0_8px_26px_rgba(0,0,0,0.35)]">
            <ChevronRight size={14} className="rotate-180 text-white" />
          </div>
        </button>

        <div
          ref={rowRef}
          onScroll={onScroll}
          className="flex gap-2.5 lg:gap-3.5 px-4 lg:px-6 overflow-x-auto scrollbar-hide touch-auto overscroll-x-contain"
        >
          {dramas.map((drama, index) => (
            <DramaCard
              key={drama._id}
              drama={drama}
              index={index}
              rank={rank ? index + 1 : undefined}
            />
          ))}
          <div className="shrink-0 w-1" />
        </div>

        <button
          onClick={() => scroll("right")}
          className="hidden lg:flex absolute right-0 top-0 bottom-4 z-10 w-16 items-center justify-center bg-linear-to-l from-black via-black/80 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full bg-black/70 backdrop-blur-md border border-white/15 flex items-center justify-center hover:bg-white/15 transition-all shadow-[0_8px_26px_rgba(0,0,0,0.35)]">
            <ChevronRight size={14} className="text-white" />
          </div>
        </button>
      </div>
    </section>
  );
}
