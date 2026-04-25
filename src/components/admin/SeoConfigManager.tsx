"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Trash2, Edit2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useAlert } from "@/hooks/useAlert";

interface SeoConfig {
  _id: string;
  page: string;
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  canonicalUrl?: string;
}

export default function SeoConfigManager() {
  const toast = useToast();
  const { showConfirm } = useAlert();
  const [configs, setConfigs] = useState<SeoConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    page: "",
    title: "",
    description: "",
    keywords: "",
    ogImage: "",
    canonicalUrl: "",
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await fetch("/api/admin/seo-configs");
      if (res.ok) {
        const data = await res.json();
        setConfigs(data);
      }
    } catch (error) {
      console.error("Error fetching SEO configs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId
        ? `/api/admin/seo-configs?id=${editingId}`
        : "/api/admin/seo-configs";
      const method = editingId ? "PUT" : "POST";

      const payload = {
        ...formData,
        keywords: formData.keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchConfigs();
        setShowForm(false);
        setEditingId(null);
        setFormData({
          page: "",
          title: "",
          description: "",
          keywords: "",
          ogImage: "",
          canonicalUrl: "",
        });
      } else {
        const error = await res.json();
        toast.error("Lỗi", error.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error saving SEO config:", error);
      toast.error("Lỗi", "Có lỗi xảy ra");
    }
  };

  const handleEdit = (config: SeoConfig) => {
    setEditingId(config._id);
    setFormData({
      page: config.page,
      title: config.title,
      description: config.description,
      keywords: config.keywords.join(", "),
      ogImage: config.ogImage || "",
      canonicalUrl: config.canonicalUrl || "",
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    showConfirm({
      title: "Xóa cấu hình SEO?",
      message: "Xác nhận xoá cấu hình SEO này?",
      confirmText: "Xoá",
      variant: "danger",
      onConfirm: () => doDelete(id),
    });
  };

  const doDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/seo-configs?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchConfigs();
      }
    } catch (error) {
      console.error("Error deleting SEO config:", error);
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
          <Search className="w-8 h-8 text-purple-500" />
          <div>
            <h2 className="text-2xl font-black text-white">Cấu Hình SEO</h2>
            <p className="text-sm text-gray-400">
              Quản lý metadata SEO cho từng trang
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              page: "",
              title: "",
              description: "",
              keywords: "",
              ogImage: "",
              canonicalUrl: "",
            });
          }}
          className="flex items-center gap-2 bg-vibe-pink hover:bg-vibe-pink/90 text-white px-4 py-2 rounded-lg font-bold transition-all"
        >
          <Plus className="w-4 h-4" />
          Thêm Config
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            {editingId ? "Chỉnh sửa cấu hình" : "Thêm cấu hình mới"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">
                Trang (slug) *
              </label>
              <input
                type="text"
                value={formData.page}
                onChange={(e) =>
                  setFormData({ ...formData, page: e.target.value })
                }
                required
                disabled={!!editingId}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-vibe-pink outline-none disabled:opacity-50"
                placeholder="home, about, contact, ..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Nhập slug của trang (ví dụ: home, about, contact). Không thay
                đổi được sau khi tạo.
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-vibe-pink outline-none"
                placeholder="VibeDrama - Xem phim bộ ngắn miễn phí"
                maxLength={60}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.title.length}/60 ký tự (tối ưu: 50-60)
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-vibe-pink outline-none"
                placeholder="Mô tả trang..."
                rows={3}
                maxLength={160}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/160 ký tự (tối ưu: 120-160)
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">
                Keywords (phân cách bằng dấu phẩy)
              </label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) =>
                  setFormData({ ...formData, keywords: e.target.value })
                }
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-vibe-pink outline-none"
                placeholder="phim ngắn, drama, vibe drama, ..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">
                OG Image URL (tùy chọn)
              </label>
              <input
                type="url"
                value={formData.ogImage}
                onChange={(e) =>
                  setFormData({ ...formData, ogImage: e.target.value })
                }
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-vibe-pink outline-none"
                placeholder="https://example.com/og-image.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">
                Canonical URL (tùy chọn)
              </label>
              <input
                type="url"
                value={formData.canonicalUrl}
                onChange={(e) =>
                  setFormData({ ...formData, canonicalUrl: e.target.value })
                }
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-vibe-pink outline-none"
                placeholder="https://vibedrama.com/about"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-all"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-vibe-pink hover:bg-vibe-pink/90 text-white rounded-lg font-bold transition-all"
              >
                {editingId ? "Cập nhật" : "Thêm"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Configs List */}
      <div className="space-y-3">
        {configs.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-800/50 border border-gray-700 rounded-xl">
            Chưa có cấu hình SEO nào. Hệ thống sẽ dùng SEO mặc định.
          </div>
        ) : (
          configs.map((config) => (
            <div
              key={config._id}
              className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-purple-500/30 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full border border-purple-500/30">
                      {config.page}
                    </span>
                  </div>
                  <h3 className="font-black text-white text-lg mb-1">
                    {config.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-2">
                    {config.description}
                  </p>
                  {config.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {config.keywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                  {config.ogImage && (
                    <p className="text-xs text-gray-500">
                      OG Image:{" "}
                      <span className="text-blue-400">{config.ogImage}</span>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(config)}
                    className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-all"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(config._id)}
                    className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
