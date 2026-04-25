"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import DramaCard from "./DramaCard";

interface AllDramasGridProps {
  dramas: any[];
}

const PAGE_SIZE = 24;

export default function AllDramasGrid({ dramas }: AllDramasGridProps) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(dramas.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const paginated = dramas.slice(start, start + PAGE_SIZE);

  const goTo = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (
        let i = Math.max(2, page - 1);
        i <= Math.min(totalPages - 1, page + 1);
        i++
      ) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="mx-auto w-full max-w-350 px-3 py-2 lg:p-6 xl:p-8">
      {dramas.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-96 flex flex-col items-center justify-center text-center"
        >
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="text-2xl font-bold text-white mb-2">
            Không tìm thấy phim nào
          </h3>
          <p className="text-white/50">
            Thử thay đổi các bộ lọc để xem thêm phim
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 lg:gap-3.5 xl:gap-4"
            >
              {paginated.map((drama, index) => (
                <DramaCard key={drama._id} drama={drama} index={index} fluid />
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 lg:gap-1.5 pt-4 pb-4">
              <button
                onClick={() => goTo(page - 1)}
                disabled={page === 1}
                className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>

              {getPageNumbers().map((p, i) =>
                p === "..." ? (
                  <span
                    key={`dots-${i}`}
                    className="w-7 h-8 lg:w-9 lg:h-9 flex items-center justify-center text-white/30 text-xs lg:text-sm"
                  >
                    ···
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goTo(p as number)}
                    className={`w-8 h-8 lg:w-9 lg:h-9 rounded-xl text-xs lg:text-sm font-black transition-all ${
                      page === p
                        ? "bg-vibe-pink text-white shadow-[0_0_15px_rgba(223,36,255,0.4)]"
                        : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}

              <button
                onClick={() => goTo(page + 1)}
                disabled={page === totalPages}
                className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
