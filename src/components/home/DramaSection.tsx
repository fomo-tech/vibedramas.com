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
        <div className="lg:hidden mx-4 mb-3 rounded-2xl overflow-hidden relative">
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,69,0,0.18) 0%, rgba(255,140,0,0.10) 100%)",
              border: "1px solid rgba(255,100,0,0.2)",
            }}
          >
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-2.5"
            >
              {Icon && <Icon size={16} className="text-orange-400 shrink-0" />}
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-tight">
                  {title}
                </h2>
                <p className="text-[10px] text-white/35 mt-0.5">
                  Top phim được xem nhiều nhất
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
        className={`flex items-center justify-between px-4 lg:px-6 mb-3 ${featured ? "hidden lg:flex" : ""}`}
      >
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-2.5"
        >
          {Icon && <Icon size={18} className="text-vibe-pink shrink-0" />}
          <h2 className="text-sm lg:text-xl font-black text-white uppercase tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <span className="text-[10px] lg:text-sm text-white/30 font-medium">
              {subtitle}
            </span>
          )}
        </motion.div>
        <Link
          href={seeMoreHref}
          className="flex items-center gap-1 text-vibe-pink text-[10px] lg:text-xs font-bold uppercase tracking-widest hover:gap-2 transition-all duration-200 group"
        >
          Xem thêm
          <ArrowRight
            size={11}
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </Link>
      </div>

      <div className="relative group/row">
        <button
          onClick={() => scroll("left")}
          className={`hidden lg:flex absolute left-0 top-0 bottom-4 z-10 w-12 items-center justify-center bg-linear-to-r from-black to-transparent transition-opacity ${
            atStart
              ? "opacity-0 pointer-events-none"
              : "opacity-0 group-hover/row:opacity-100"
          }`}
        >
          <div className="w-7 h-7 rounded-full bg-white/10 border border-white/15 flex items-center justify-center hover:bg-white/20 transition-all">
            <ChevronRight size={14} className="rotate-180 text-white" />
          </div>
        </button>

        <div
          ref={rowRef}
          onScroll={onScroll}
          className="flex gap-2.5 lg:gap-3 px-4 lg:px-6 overflow-x-auto scrollbar-hide touch-auto overscroll-x-contain"
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
          className="hidden lg:flex absolute right-0 top-0 bottom-4 z-10 w-16 items-center justify-center bg-linear-to-l from-black to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
        >
          <div className="w-7 h-7 rounded-full bg-white/10 border border-white/15 flex items-center justify-center hover:bg-white/20 transition-all">
            <ChevronRight size={14} className="text-white" />
          </div>
        </button>
      </div>
    </section>
  );
}
