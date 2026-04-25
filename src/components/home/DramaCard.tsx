"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";

interface DramaCardProps {
  drama: any;
  index: number;
  rank?: number;
  fluid?: boolean;
}

export default function DramaCard({
  drama,
  index,
  rank,
  fluid,
}: DramaCardProps) {
  const img = drama.thumb_url || drama.poster_url || "";

  return (
    <Link href={`/short/${drama.slug}`} draggable={false}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: (index % 8) * 0.04 }}
        viewport={{ once: true }}
        draggable={false}
        className={`shrink-0 flex flex-col group cursor-pointer relative ${
          fluid
            ? "w-full"
            : rank
              ? "w-40 lg:w-56 pl-12 lg:pl-16"
              : "w-27.5 lg:w-44"
        } select-none touch-auto`}
      >
        {/* Rank number — outside overflow-hidden, Netflix style */}
        {rank && (
          <div
            className="absolute left-2 lg:left-3 bottom-7 lg:bottom-9 z-30 select-none pointer-events-none"
            style={{
              fontSize: rank <= 3 ? "5.2rem" : "4.4rem",
              fontWeight: 900,
              lineHeight: 0.9,
              fontStyle: "italic",
              background:
                rank === 1
                  ? "linear-gradient(160deg, #FFE566 0%, #FF8C00 55%, #FF4500 100%)"
                  : rank === 2
                    ? "linear-gradient(160deg, #F0F0F0 0%, #B0B0B0 55%, #666 100%)"
                    : rank === 3
                      ? "linear-gradient(160deg, #E8A045 0%, #C0702A 55%, #8B4513 100%)"
                      : "linear-gradient(160deg, #888 0%, #444 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter:
                rank === 1
                  ? "drop-shadow(0 0 12px rgba(255,200,0,0.6))"
                  : rank === 2
                    ? "drop-shadow(0 0 8px rgba(200,200,200,0.4))"
                    : rank === 3
                      ? "drop-shadow(0 0 8px rgba(180,100,0,0.5))"
                      : "none",
              paintOrder: "stroke fill",
            }}
          >
            {rank}
          </div>
        )}

        {/* Thumbnail */}
        <div className="relative w-full aspect-2/3 rounded-xl overflow-hidden bg-white/5 border border-white/5 group-hover:border-white/20 transition-all duration-300">
          {img ? (
            <Image
              src={img}
              alt={drama.name || "Drama"}
              fill
              draggable={false}
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 1024px) 220px, 352px"
              priority={index < 6}
            />
          ) : (
            <div className="absolute inset-0 bg-white/5 flex items-center justify-center">
              <Play size={20} className="text-white/20" />
            </div>
          )}

          {/* Category badge */}
          {drama.category?.[0] && !rank && (
            <div className="absolute top-1.5 left-1.5 max-w-[55%] px-1.5 py-0.5 bg-vibe-pink text-[7px] font-black text-white uppercase tracking-wide rounded truncate">
              {drama.category[0].name}
            </div>
          )}

          {/* Status pill - bottom right */}
          <div
            className={`absolute bottom-1.5 right-1.5 px-1.5 py-0.5 text-[7px] font-black uppercase rounded ${
              drama.status === "completed"
                ? "bg-emerald-500/90 text-white"
                : "bg-amber-500/90 text-black"
            }`}
          >
            {drama.status === "completed" ? "Full" : "Mới"}
          </div>

          {/* Play overlay on hover */}
          <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
            <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <Play size={14} fill="white" className="text-white ml-0.5" />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-1.5 px-0.5">
          <h3 className="text-[10px] lg:text-sm font-bold text-white leading-tight line-clamp-2 group-hover:text-vibe-pink transition-colors duration-200">
            {drama.name}
          </h3>
        </div>
      </motion.div>
    </Link>
  );
}
