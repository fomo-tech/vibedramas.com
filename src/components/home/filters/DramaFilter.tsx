"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  Flame,
  Clock,
  Star,
  Search,
  X,
  ChevronDown,
  Check,
  ArrowUpDown,
  CircleDot,
  Layers,
  Globe,
  SlidersHorizontal,
} from "lucide-react";

interface DramaFilterProps {
  filters: {
    category: string;
    country: string;
    status: string;
    searchQuery: string;
    sortBy: string;
  };
  onFiltersChange: (filters: DramaFilterProps["filters"]) => void;
  filterOptions: {
    categories: { slug: string; name: string }[];
    countries: { slug: string; name: string }[];
    statuses: string[];
  };
}

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất", icon: Star },
  { value: "popular", label: "Hot", icon: Flame },
  { value: "oldest", label: "Cổ điển", icon: Clock },
];

const dropdownVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 28,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.96,
    transition: { duration: 0.15, ease: "easeIn" as const },
  },
};

function FilterDropdown({
  label,
  value,
  options,
  onSelect,
  onClear,
  icon: Icon,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (v: string) => void;
  onClear: () => void;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  }>({ top: 0, left: 0, width: 180, maxHeight: 320 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const handleOpen = () => {
    setOpen((v) => !v);
  };

  const updateMenuPosition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const menuWidth = Math.max(rect.width, 168);
    const spaceBelow = viewportH - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const placeAbove = spaceBelow < 180 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(
      140,
      Math.min(320, placeAbove ? spaceAbove : spaceBelow),
    );
    const menuHeight = menuRef.current?.offsetHeight || maxHeight;
    const top = placeAbove
      ? Math.max(8, rect.top - menuHeight - 8)
      : rect.bottom + 8;
    const unclampedLeft = rect.left;
    const left = Math.max(
      8,
      Math.min(unclampedLeft, viewportW - menuWidth - 8),
    );

    setMenuStyle({ top, left, width: menuWidth, maxHeight });
  }, []);

  useEffect(() => {
    if (!open) return;
    updateMenuPosition();

    const onScrollOrResize = () => updateMenuPosition();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);

    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        btnRef.current &&
        !btnRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        close();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, close, updateMenuPosition]);

  const activeLabel = options.find((o) => o.value === value)?.label;

  return (
    <div className="relative shrink-0">
      <motion.button
        ref={btnRef}
        whileTap={{ scale: 0.96 }}
        onClick={handleOpen}
        className={`flex items-center gap-1.5 lg:gap-2 rounded-xl border text-xs font-bold transition-all duration-200 ${
          value
            ? "bg-vibe-pink/12 border-vibe-pink/35 text-white"
            : open
              ? "bg-white/8 border-white/15 text-white"
              : "bg-white/5 border-white/8 text-white/50 hover:text-white hover:bg-white/8 hover:border-white/15"
        } ${Icon ? "p-2 lg:px-3.5 lg:py-2" : "px-3.5 py-2"}`}
      >
        {Icon && (
          <Icon
            size={14}
            className={value ? "text-vibe-pink" : "text-white/50"}
          />
        )}
        {/* Text label: hidden on mobile when icon exists */}
        {activeLabel ? (
          <span
            className={`text-vibe-pink font-black ${Icon ? "hidden lg:inline" : ""}`}
          >
            {activeLabel}
          </span>
        ) : (
          <span className={Icon ? "hidden lg:inline" : ""}>{label}</span>
        )}
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="hidden lg:block"
        >
          <ChevronDown size={12} className="text-white/40" />
        </motion.div>
        {/* Active dot indicator on mobile */}
        {value && Icon && (
          <span className="lg:hidden absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-vibe-pink shadow-[0_0_6px_rgba(223,36,255,0.6)]" />
        )}
        {value && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="hidden lg:block ml-0.5 text-white/40 hover:text-vibe-pink transition-colors"
          >
            <X size={10} />
          </motion.span>
        )}
      </motion.button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={menuRef}
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{
                  top: menuStyle.top,
                  left: menuStyle.left,
                  width: menuStyle.width,
                  maxHeight: menuStyle.maxHeight,
                }}
                className="fixed overflow-y-auto bg-[#111] border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] z-200 py-1.5 scrollbar-hide"
              >
                {options.map((opt, i) => {
                  const isActive = value === opt.value;
                  return (
                    <motion.button
                      key={opt.value}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.15 }}
                      onClick={() => {
                        onSelect(opt.value);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold transition-all duration-150 ${
                        isActive
                          ? "text-white bg-vibe-pink/12"
                          : "text-white/50 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isActive && (
                        <Check size={12} className="text-vibe-pink shrink-0" />
                      )}
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}

export default function DramaFilter({
  filters,
  onFiltersChange,
  filterOptions,
}: DramaFilterProps) {
  const activeCount = [
    filters.category,
    filters.country,
    filters.status,
  ].filter(Boolean).length;

  const update = (patch: Partial<typeof filters>) =>
    onFiltersChange({ ...filters, ...patch });

  const reset = () =>
    onFiltersChange({
      category: "",
      country: "",
      status: "",
      searchQuery: filters.searchQuery,
      sortBy: filters.sortBy,
    });

  const statusOptions = filterOptions.statuses.map((s) => ({
    value: s,
    label: s === "completed" ? "Hoàn thành" : "Đang chiếu",
  }));

  return (
    <div className="w-full bg-black/75 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40 pt-safe">
      <div className="mx-auto flex w-full max-w-350 items-center gap-1.5 lg:gap-2 px-3 lg:px-6 xl:px-8 py-2.5 lg:py-3 overflow-x-auto scrollbar-hide">
        {/* Search */}
        <div className="relative group shrink-0">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 group-focus-within:text-vibe-pink transition-colors duration-300 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Tìm phim..."
            value={filters.searchQuery}
            onChange={(e) => update({ searchQuery: e.target.value })}
            className="w-28 lg:w-44 xl:w-52 pl-8 pr-7 py-2 bg-white/5 group-focus-within:bg-white/8 border border-white/8 group-focus-within:border-vibe-pink/25 rounded-xl text-white placeholder-white/25 text-xs font-medium focus:outline-none transition-all duration-300 focus:w-40 lg:focus:w-48 xl:focus:w-64"
          />
          <AnimatePresence>
            {filters.searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.15 }}
                onClick={() => update({ searchQuery: "" })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
              >
                <X size={11} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <div className="w-px h-5 bg-white/8 shrink-0" />

        {/* Sort dropdown */}
        <FilterDropdown
          label="Sắp xếp"
          value={filters.sortBy === "newest" ? "" : filters.sortBy}
          options={SORT_OPTIONS.map((s) => ({
            value: s.value,
            label: s.label,
          }))}
          onSelect={(v) => update({ sortBy: v })}
          onClear={() => update({ sortBy: "newest" })}
          icon={ArrowUpDown}
        />

        {/* Status dropdown */}
        {statusOptions.length > 0 && (
          <FilterDropdown
            label="Trạng thái"
            value={filters.status}
            options={statusOptions}
            onSelect={(v) => update({ status: v === filters.status ? "" : v })}
            onClear={() => update({ status: "" })}
            icon={CircleDot}
          />
        )}

        {/* Category dropdown */}
        {filterOptions.categories.length > 0 && (
          <FilterDropdown
            label="Thể loại"
            value={filters.category}
            options={filterOptions.categories.map((c) => ({
              value: c.slug,
              label: c.name,
            }))}
            onSelect={(v) =>
              update({ category: v === filters.category ? "" : v })
            }
            onClear={() => update({ category: "" })}
            icon={Layers}
          />
        )}

        {/* Country dropdown */}
        {filterOptions.countries.length > 0 && (
          <FilterDropdown
            label="Quốc gia"
            value={filters.country}
            options={filterOptions.countries.map((c) => ({
              value: c.slug,
              label: c.name,
            }))}
            onSelect={(v) =>
              update({ country: v === filters.country ? "" : v })
            }
            onClear={() => update({ country: "" })}
            icon={Globe}
          />
        )}

        {/* Reset badge */}
        <AnimatePresence>
          {activeCount > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.6, x: 8 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.6, x: 8 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              whileTap={{ scale: 0.9 }}
              onClick={reset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-vibe-pink/10 border border-vibe-pink/25 text-vibe-pink text-[10px] font-black uppercase tracking-widest shrink-0 hover:bg-vibe-pink/20 transition-colors"
            >
              <X size={10} />
              <span>{activeCount}</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
