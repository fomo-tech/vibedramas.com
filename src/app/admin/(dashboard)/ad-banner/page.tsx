"use client";

import { useEffect, useState } from "react";
import {
  ExternalLink,
  Image,
  Link2,
  Plus,
  Save,
  Trash2,
  Eye,
  EyeOff,
  Timer,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useAlert } from "@/hooks/useAlert";

interface AdBanner {
  _id: string;
  imageUrl: string;
  linkUrl: string;
  altText: string;
  showAfterSeconds: number;
  rehideAfterSeconds: number;
  isActive: boolean;
  showToVip: boolean;
}

const EMPTY: Omit<AdBanner, "_id"> = {
  imageUrl: "",
  linkUrl: "",
  altText: "Quảng cáo",
  showAfterSeconds: 30,
  rehideAfterSeconds: 60,
  isActive: true,
  showToVip: false,
};

export default function AdBannerAdminPage() {
  const [banners, setBanners] = useState<AdBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { showConfirm } = useAlert();

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ad-banner");
      const data = await res.json();
      setBanners(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleEdit = (b: AdBanner) => {
    setEditingId(b._id);
    setForm({
      imageUrl: b.imageUrl,
      linkUrl: b.linkUrl,
      altText: b.altText,
      showAfterSeconds: b.showAfterSeconds,
      rehideAfterSeconds: b.rehideAfterSeconds,
      isActive: b.isActive,
      showToVip: b.showToVip,
    });
  };

  const handleNew = () => {
    setEditingId(null);
    setForm(EMPTY);
  };

  const handleSave = async () => {
    if (!form.imageUrl || !form.linkUrl) {
      toast.error("Vui lòng nhập URL hình ảnh và URL liên kết");
      return;
    }
    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/ad-banner/${editingId}`
        : "/api/admin/ad-banner";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success(editingId ? "Đã cập nhật banner" : "Đã tạo banner");
      handleNew();
      fetchBanners();
    } catch {
      toast.error("Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm({
      title: "Xoá banner này?",
      variant: "danger",
      onConfirm: async () => {
        try {
          await fetch(`/api/admin/ad-banner/${id}`, { method: "DELETE" });
          toast.success("Đã xoá");
          fetchBanners();
        } catch {
          toast.error("Có lỗi xảy ra");
        }
      },
    });
  };

  const handleToggle = async (b: AdBanner) => {
    try {
      await fetch(`/api/admin/ad-banner/${b._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...b, isActive: !b.isActive }),
      });
      fetchBanners();
    } catch {
      toast.error("Có lỗi xảy ra");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quảng cáo Feed</h1>
          <p className="text-gray-400 text-sm mt-1">
            Banner hiện lên sau khi người dùng xem video được một thời gian nhất
            định
          </p>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors"
        >
          <Plus size={16} /> Thêm mới
        </button>
      </div>

      {/* Form */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
        <h2 className="text-base font-bold text-white">
          {editingId ? "Chỉnh sửa banner" : "Tạo banner mới"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5 font-medium">
              <Image size={12} /> URL hình ảnh *
            </label>
            <input
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://example.com/banner.jpg"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5 font-medium">
              <Link2 size={12} /> URL liên kết *
            </label>
            <input
              value={form.linkUrl}
              onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
              placeholder="https://example.com/promo"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5 font-medium">
              <Timer size={12} /> Hiện sau (giây xem)
            </label>
            <input
              type="number"
              min={5}
              value={form.showAfterSeconds}
              onChange={(e) =>
                setForm({ ...form, showAfterSeconds: Number(e.target.value) })
              }
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-500 transition-colors"
            />
            <p className="text-xs text-gray-600 mt-1">Mặc định: 30 giây</p>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5 font-medium">
              <Timer size={12} /> Hiện lại sau khi tắt (giây)
            </label>
            <input
              type="number"
              min={10}
              value={form.rehideAfterSeconds}
              onChange={(e) =>
                setForm({ ...form, rehideAfterSeconds: Number(e.target.value) })
              }
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-500 transition-colors"
            />
            <p className="text-xs text-gray-600 mt-1">Mặc định: 60 giây</p>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">
              Mô tả (alt text)
            </label>
            <input
              value={form.altText}
              onChange={(e) => setForm({ ...form, altText: e.target.value })}
              placeholder="Quảng cáo"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 pt-5">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
              <span className="ml-3 text-sm font-medium text-gray-300">
                Kích hoạt
              </span>
            </label>
          </div>

          <div className="flex items-center gap-3 pt-5">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.showToVip}
                onChange={(e) =>
                  setForm({ ...form, showToVip: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
              <span className="ml-3 text-sm font-medium text-gray-300">
                Hiện cả VIP
              </span>
            </label>
            <p className="text-xs text-gray-600">
              Bật → VIP cũng thấy quảng cáo này
            </p>
          </div>
        </div>

        {/* Preview */}
        {form.imageUrl && (
          <div className="border border-gray-700 rounded-xl p-4 bg-gray-800/50">
            <p className="text-xs text-gray-400 mb-3 font-medium">Preview</p>
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.imageUrl}
                alt={form.altText}
                className="w-20 h-20 rounded-xl object-cover border border-gray-700"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="space-y-1">
                <p className="text-sm text-white font-medium">{form.altText}</p>
                <a
                  href={form.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-red-400 flex items-center gap-1 hover:underline"
                >
                  <ExternalLink size={11} /> {form.linkUrl}
                </a>
                <p className="text-xs text-gray-500">
                  Hiện sau {form.showAfterSeconds}s · Ẩn{" "}
                  {form.rehideAfterSeconds}s sau khi đóng
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors"
        >
          <Save size={15} />{" "}
          {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Tạo banner"}
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-white">
          Danh sách banner ({banners.length})
        </h2>
        {loading ? (
          <p className="text-gray-500 text-sm">Đang tải...</p>
        ) : banners.length === 0 ? (
          <p className="text-gray-500 text-sm">Chưa có banner nào</p>
        ) : (
          banners.map((b) => (
            <div
              key={b._id}
              className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${
                b.isActive
                  ? "bg-gray-900 border-gray-800"
                  : "bg-gray-950 border-gray-900 opacity-60"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.imageUrl}
                alt={b.altText}
                className="w-14 h-14 rounded-xl object-cover border border-gray-700 shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {b.altText}
                </p>
                <a
                  href={b.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-400 truncate flex items-center gap-1 hover:text-red-400 transition-colors"
                >
                  <ExternalLink size={10} /> {b.linkUrl}
                </a>
                <p className="text-xs text-gray-600 mt-0.5">
                  Hiện sau {b.showAfterSeconds}s · Ẩn {b.rehideAfterSeconds}s
                  sau đóng
                  {b.showToVip && (
                    <span className="ml-1.5 text-yellow-500 font-bold">
                      · Hiện cả VIP
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggle(b)}
                  className={`p-2 rounded-lg transition-colors ${
                    b.isActive
                      ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      : "bg-gray-800 text-gray-500 hover:bg-gray-700"
                  }`}
                  title={b.isActive ? "Đang bật" : "Đang tắt"}
                >
                  {b.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <button
                  onClick={() => handleEdit(b)}
                  className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                >
                  <Save size={15} />
                </button>
                <button
                  onClick={() => handleDelete(b._id)}
                  className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
