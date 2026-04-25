"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Compass, Flame, Sparkles } from "lucide-react";

type CategoryItem = {
  slug: string;
  name: string;
  count: number;
};

interface CategoryShowcaseProps {
  dramas: any[];
}

function toCategoryList(dramas: any[]): CategoryItem[] {
  const categoryMap = new Map<string, CategoryItem>();

  dramas.forEach((drama) => {
    const categories = Array.isArray(drama?.category) ? drama.category : [];
    categories.forEach((cat: any) => {
      const slug = String(cat?.slug || "").trim();
      const name = String(cat?.name || "").trim();
      if (!slug || !name) return;

      const existing = categoryMap.get(slug);
      if (!existing) {
        categoryMap.set(slug, { slug, name, count: 1 });
        return;
      }
      existing.count += 1;
      categoryMap.set(slug, existing);
    });
  });

  return Array.from(categoryMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export default function CategoryShowcase({ dramas }: CategoryShowcaseProps) {
  const categories = toCategoryList(dramas);

  if (categories.length === 0) return null;

  return (
    <section className="relative px-4 lg:px-6">
      <div
        className="rounded-3xl p-4 lg:p-5 border border-orange-400/20"
        style={{
          background:
            "radial-gradient(120% 180% at 0% 0%, rgba(255,87,34,0.18) 0%, rgba(255,87,34,0.06) 45%, rgba(0,0,0,0.35) 100%)",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] lg:text-xs uppercase tracking-[0.2em] text-orange-300/70 font-black">
              Explore nhanh
            </p>
            <h3 className="mt-1 text-white text-base lg:text-xl font-black tracking-tight flex items-center gap-2">
              <Compass size={16} className="text-orange-300" />
              Danh Muc Noi Bat
            </h3>
          </div>
          <div className="hidden lg:flex items-center gap-1 text-orange-200/70 text-xs font-bold">
            <Flame size={14} />
            Xu huong hom nay
          </div>
        </div>

        <div className="mt-4 flex gap-2.5 overflow-x-auto scrollbar-hide touch-pan-x">
          {categories.map((cat, index) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.03, duration: 0.28 }}
              className="shrink-0"
            >
              <Link
                href={`/category/${cat.slug}`}
                className="group relative block rounded-2xl border border-white/10 bg-black/35 hover:bg-black/55 transition-all px-3 py-2 min-w-30.5"
              >
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-linear-to-br from-orange-400/18 via-transparent to-red-500/18" />
                <div className="relative flex items-center justify-between gap-2">
                  <p className="text-white/90 text-xs font-bold line-clamp-1">
                    {cat.name}
                  </p>
                  {index < 3 ? (
                    <Sparkles size={12} className="text-orange-300 shrink-0" />
                  ) : null}
                </div>
                <p className="relative mt-1 text-[10px] text-white/45 font-semibold">
                  {cat.count} phim
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
