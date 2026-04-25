"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Plus,
  GripVertical,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { useAlert } from "@/hooks/useAlert";

interface Drama {
  _id: string;
  name: string;
  origin_name?: string;
  thumb_url?: string;
  poster_url?: string;
}

interface HeroSlide {
  _id: string;
  drama: Drama;
  order: number;
  isActive: boolean;
}

export default function HeroSlideManager() {
  const { showConfirm } = useAlert();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Drama[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const res = await fetch("/api/admin/hero-slides");
      if (res.ok) {
        const data = await res.json();
        setSlides(data);
      }
    } catch (error) {
      console.error("Error fetching hero slides:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchDramas = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.dramas || []);
      }
    } catch (error) {
      console.error("Error searching dramas:", error);
    } finally {
      setSearching(false);
    }
  };

  const addSlide = async (dramaId: string) => {
    try {
      const res = await fetch("/api/admin/hero-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dramaId }),
      });

      if (res.ok) {
        await fetchSlides();
        setShowSearch(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error adding slide:", error);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch("/api/admin/hero-slides", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !isActive }),
      });

      if (res.ok) {
        await fetchSlides();
      }
    } catch (error) {
      console.error("Error toggling slide:", error);
    }
  };

  const deleteSlide = (id: string) => {
    showConfirm({
      title: "Xóa slide này?",
      message: "Slide sẽ bị xóa khỏi hero slider.",
      confirmText: "Xóa",
      variant: "danger",
      onConfirm: () => doDeleteSlide(id),
    });
  };

  const doDeleteSlide = async (id: string) => {
    try {
      const res = await fetch("/api/admin/hero-slides", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        await fetchSlides();
      }
    } catch (error) {
      console.error("Error deleting slide:", error);
    }
  };

  const moveSlide = async (id: string, direction: "up" | "down") => {
    const index = slides.findIndex((s) => s._id === id);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === slides.length - 1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const newSlides = [...slides];
    [newSlides[index], newSlides[newIndex]] = [
      newSlides[newIndex],
      newSlides[index],
    ];

    // Update orders
    const updates = newSlides.map((slide, idx) => ({
      id: slide._id,
      order: idx,
    }));

    try {
      await Promise.all(
        updates.map((update) =>
          fetch("/api/admin/hero-slides", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(update),
          }),
        ),
      );
      await fetchSlides();
    } catch (error) {
      console.error("Error reordering slides:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-vibe-pink" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-vibe-pink" />
          <div>
            <h2 className="text-2xl font-black text-white">Hero Slider</h2>
            <p className="text-sm text-gray-400">
              Quản lý phim hiển thị trên banner trang chủ
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="flex items-center gap-2 bg-vibe-pink hover:bg-vibe-pink/90 text-white px-4 py-2 rounded-lg font-bold transition-all"
        >
          <Plus className="w-4 h-4" />
          Thêm Phim
        </button>
      </div>

      {/* Search Panel */}
      {showSearch && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchDramas(e.target.value);
            }}
            placeholder="Tìm kiếm phim..."
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-vibe-pink outline-none"
          />
          {searching && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-vibe-pink" />
            </div>
          )}
          <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
            {searchResults.map((drama) => (
              <button
                key={drama._id}
                onClick={() => addSlide(drama._id)}
                className="flex items-center gap-3 p-2 bg-gray-900 hover:bg-gray-800 rounded-lg transition-all text-left"
              >
                <Image
                  src={
                    drama.thumb_url || drama.poster_url || "/placeholder.jpg"
                  }
                  alt={drama.name}
                  width={60}
                  height={80}
                  className="rounded object-cover"
                />
                <div>
                  <p className="font-bold text-white text-sm">{drama.name}</p>
                  {drama.origin_name && (
                    <p className="text-xs text-gray-400">{drama.origin_name}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Slides List */}
      <div className="space-y-2">
        {slides.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Chưa có phim nào trong hero slider
          </div>
        ) : (
          slides.map((slide, index) => (
            <div
              key={slide._id}
              className={`flex items-center gap-3 bg-gray-800/50 border rounded-xl p-3 ${
                slide.isActive
                  ? "border-vibe-pink/30"
                  : "border-gray-700 opacity-60"
              }`}
            >
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveSlide(slide._id, "up")}
                  disabled={index === 0}
                  className="p-1 hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <GripVertical className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={() => moveSlide(slide._id, "down")}
                  disabled={index === slides.length - 1}
                  className="p-1 hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <GripVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="flex items-center gap-4 flex-1">
                <div className="text-2xl font-black text-gray-600 w-8 text-center">
                  {index + 1}
                </div>
                <Image
                  src={
                    slide.drama.poster_url ||
                    slide.drama.thumb_url ||
                    "/placeholder.jpg"
                  }
                  alt={slide.drama.name}
                  width={80}
                  height={120}
                  className="rounded object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-black text-white">{slide.drama.name}</h3>
                  {slide.drama.origin_name && (
                    <p className="text-sm text-gray-400">
                      {slide.drama.origin_name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(slide._id, slide.isActive)}
                  className={`p-2 rounded-lg transition-all ${
                    slide.isActive
                      ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  }`}
                >
                  {slide.isActive ? (
                    <Eye className="w-5 h-5" />
                  ) : (
                    <EyeOff className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => deleteSlide(slide._id)}
                  className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
