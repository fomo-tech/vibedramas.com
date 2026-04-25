"use client";

import React, { useState, useMemo } from "react";
import DramaFilter from "./filters/DramaFilter";
import AllDramasGrid from "./AllDramasGrid";

interface AllDramasClientProps {
  dramas: any[];
  pageTitle?: string;
  pageDescription?: string;
  initialFilters?: Partial<{
    category: string;
    country: string;
    status: string;
    searchQuery: string;
    sortBy: string;
  }>;
}

export default function AllDramasClient({
  dramas,
  pageTitle = "Tat Ca Phim",
  pageDescription,
  initialFilters,
}: AllDramasClientProps) {
  const [filters, setFilters] = useState({
    category: "",
    country: "",
    status: "",
    searchQuery: "",
    sortBy: "newest", // newest, popular, oldest
    ...initialFilters,
  });

  // Apply filters and search
  const filteredDramas = useMemo(() => {
    let result = [...dramas];

    // Search by name
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (drama) =>
          drama.name.toLowerCase().includes(query) ||
          drama.origin_name?.toLowerCase().includes(query),
      );
    }

    // Filter by category
    if (filters.category) {
      result = result.filter((drama) =>
        drama.category?.some((cat: any) => cat.slug === filters.category),
      );
    }

    // Filter by country
    if (filters.country) {
      result = result.filter((drama) =>
        drama.country?.some((c: any) => c.slug === filters.country),
      );
    }

    // Filter by status
    if (filters.status) {
      result = result.filter((drama) => drama.status === filters.status);
    }

    // Sort
    if (filters.sortBy === "popular") {
      result.sort((a, b) => (b.view || 0) - (a.view || 0));
    } else if (filters.sortBy === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    } else {
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    return result;
  }, [dramas, filters]);

  // Extract unique filter options from data
  const filterOptions = useMemo(() => {
    const categories = new Map();
    const countries = new Map();
    const statuses = new Set<string>();

    dramas.forEach((drama) => {
      drama.category?.forEach((cat: any) => {
        if (!categories.has(cat.slug)) {
          categories.set(cat.slug, cat.name);
        }
      });
      drama.country?.forEach((c: any) => {
        if (!countries.has(c.slug)) {
          countries.set(c.slug, c.name);
        }
      });
      if (drama.status) {
        statuses.add(drama.status);
      }
    });

    return {
      categories: Array.from(categories.entries()).map(([slug, name]) => ({
        slug,
        name,
      })),
      countries: Array.from(countries.entries()).map(([slug, name]) => ({
        slug,
        name,
      })),
      statuses: Array.from(statuses),
    };
  }, [dramas]);

  return (
    <div className="flex flex-col h-full pt-safe">
      {/* Page Title */}
      <div className="mx-auto w-full max-w-350 pt-3 lg:pt-6 xl:pt-8 px-3 lg:px-6 xl:px-8 pb-2 lg:pb-5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg lg:text-3xl xl:text-4xl font-black text-white tracking-tighter">
            {pageTitle}
          </h1>
          <span className="text-[10px] lg:text-sm font-bold text-vibe-pink/80 bg-vibe-pink/10 px-2.5 py-1 lg:px-3 lg:py-1.5 rounded-full whitespace-nowrap">
            {filteredDramas.length} phim
          </span>
        </div>
        {pageDescription && (
          <p className="mt-2 text-xs lg:text-sm text-white/45 line-clamp-2">
            {pageDescription}
          </p>
        )}
      </div>

      {/* Filter Bar — sticky */}
      <DramaFilter
        filters={filters}
        onFiltersChange={setFilters}
        filterOptions={filterOptions}
      />

      {/* Dramas Grid — scrollable */}
      <div className="flex-1 overflow-y-auto pb-20 lg:pb-8">
        <AllDramasGrid dramas={filteredDramas} />
      </div>
    </div>
  );
}
