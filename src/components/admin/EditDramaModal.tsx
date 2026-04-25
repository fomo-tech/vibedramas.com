"use client";

import { useState, useEffect } from "react";
import {
  updateDramaAction,
  getEpisodesAction,
  createEpisodeAction,
  updateEpisodeAction,
  deleteEpisodeAction,
} from "@/actions/adminActions";
import { useRouter } from "next/navigation";
import { X, Plus, Trash2, Edit2, Check, Film } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useAlert } from "@/hooks/useAlert";

interface EditDramaModalProps {
  drama: any;
  onClose: () => void;
}

type Tab = "meta" | "media" | "episodes";

interface EpisodeForm {
  name: string;
  slug: string;
  server_name: string;
  link_embed: string;
  link_m3u8: string;
  filename: string;
}

const EMPTY_EP: EpisodeForm = {
  name: "",
  slug: "",
  server_name: "VidStream",
  link_embed: "",
  link_m3u8: "",
  filename: "",
};

const INPUT =
  "w-full bg-gray-950 border border-gray-800 focus:border-red-500 rounded-xl px-3 py-2 text-white outline-none transition-colors text-sm";
const TEXTAREA =
  "w-full bg-gray-950 border border-gray-800 focus:border-red-500 rounded-xl px-3 py-2 text-white outline-none transition-colors text-sm resize-none";

function Field({
  label,
  span2,
  children,
}: {
  label: string;
  span2?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1 ${span2 ? "col-span-2" : ""}`}>
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function EditDramaModal({
  drama,
  onClose,
}: EditDramaModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("meta");
  const [meta, setMeta] = useState({
    name: drama.name ?? "",
    origin_name: drama.origin_name ?? "",
    slug: drama.slug ?? "",
    content: drama.content ?? "",
    type: drama.type ?? "series",
    status: drama.status ?? "ongoing",
    year: drama.year ?? new Date().getFullYear(),
    quality: drama.quality ?? "HD",
    lang: drama.lang ?? "Vietsub",
    time: drama.time ?? "",
    episode_current: drama.episode_current ?? "",
    episode_total: drama.episode_total ?? "",
    trailer_url: drama.trailer_url ?? "",
    actor: (drama.actor ?? []).join(", "),
    director: (drama.director ?? []).join(", "),
    isTrending: drama.isTrending ?? false,
    trendingRank: drama.trendingRank ?? "",
  });
  const [media, setMedia] = useState({
    thumb_url: drama.thumb_url ?? "",
    poster_url: drama.poster_url ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [epLoading, setEpLoading] = useState(false);
  const [editingEp, setEditingEp] = useState<{
    id: string;
    form: EpisodeForm;
  } | null>(null);
  const [newEp, setNewEp] = useState<EpisodeForm | null>(null);
  const router = useRouter();
  const toast = useToast();
  const { showConfirm } = useAlert();

  useEffect(() => {
    if (activeTab !== "episodes") return;
    setEpLoading(true);
    getEpisodesAction(drama._id.toString()).then((res) => {
      if (res.success) setEpisodes(res.data ?? []);
      setEpLoading(false);
    });
  }, [activeTab, drama._id]);

  const handleSaveMeta = async () => {
    setIsSaving(true);
    const payload = {
      ...meta,
      ...media,
      year: Number(meta.year),
      trendingRank:
        meta.trendingRank !== "" ? Number(meta.trendingRank) : undefined,
      actor: meta.actor
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean),
      director: meta.director
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean),
    };
    const res = await updateDramaAction(drama._id.toString(), payload);
    if (res.success) {
      router.refresh();
      onClose();
    } else {
      toast.error("Lỗi", res.error || "Không thể lưu thay đổi");
      setIsSaving(false);
    }
  };

  const handleDeleteEp = (epId: string) => {
    showConfirm({
      title: "Xóa tập phim?",
      message: "Tập phim này sẽ bị xoá vĩnh viễn.",
      confirmText: "Xoá tập",
      variant: "danger",
      onConfirm: async () => {
        await deleteEpisodeAction(epId);
        setEpisodes((prev) => prev.filter((e) => e._id !== epId));
      },
    });
  };

  const handleSaveNewEp = async () => {
    if (!newEp?.name) return;
    const epSlug =
      newEp.slug ||
      newEp.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
    const res = await createEpisodeAction(drama._id.toString(), {
      ...newEp,
      slug: epSlug,
    });
    if (res.success) {
      setEpisodes((prev) => [...prev, res.data]);
      setNewEp(null);
    } else {
      alert(`Lỗi: ${res.error}`);
    }
  };

  const handleSaveEditEp = async () => {
    if (!editingEp) return;
    const res = await updateEpisodeAction(editingEp.id, editingEp.form);
    if (res.success) {
      setEpisodes((prev) =>
        prev.map((e) => (e._id === editingEp.id ? res.data : e)),
      );
      setEditingEp(null);
    } else {
      alert(`Lỗi: ${res.error}`);
    }
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "meta", label: "Thông tin" },
    { key: "media", label: "Ảnh & Media" },
    {
      key: "episodes",
      label: `Tập phim${episodes.length > 0 ? ` (${episodes.length})` : ""}`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-lg font-black text-white">Chỉnh sửa Drama</h2>
            <p className="text-gray-500 text-xs mt-0.5 truncate max-w-sm">
              {drama.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 shrink-0 px-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-3 text-sm font-bold transition-colors border-b-2 -mb-px ${activeTab === t.key ? "border-red-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">
          {/* Meta Tab */}
          {activeTab === "meta" && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tên phim *" span2>
                <input
                  className={INPUT}
                  value={meta.name}
                  onChange={(e) =>
                    setMeta((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </Field>
              <Field label="Tên gốc" span2>
                <input
                  className={INPUT}
                  value={meta.origin_name}
                  onChange={(e) =>
                    setMeta((p) => ({ ...p, origin_name: e.target.value }))
                  }
                />
              </Field>
              <Field label="Slug (URL)" span2>
                <input
                  className={INPUT}
                  value={meta.slug}
                  onChange={(e) =>
                    setMeta((p) => ({ ...p, slug: e.target.value }))
                  }
                />
              </Field>
              <Field label="Mô tả" span2>
                <textarea
                  rows={4}
                  className={TEXTAREA}
                  value={meta.content}
                  onChange={(e) =>
                    setMeta((p) => ({ ...p, content: e.target.value }))
                  }
                />
              </Field>
              <Field label="Loại phim">
                <select
                  className={INPUT}
                  value={meta.type}
                  onChange={(e) =>
                    setMeta((p) => ({ ...p, type: e.target.value }))
                  }
                >
                  <option value="series">Series</option>
                  <option value="single">Phim lẻ</option>
                  <option value="hoathinh">Hoạt hình</option>
                  <option value="tvshows">TV Shows</option>
                </select>
              </Field>
              <Field label="Trạng thái">
                <select
                  className={INPUT}
                  value={meta.status}
                  onChange={(e) =>
                    setMeta((p) => ({ ...p, status: e.target.value }))
                  }
                >
                  <option value="ongoing">Đang chiếu</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="trailer">Trailer</option>
                </select>
              </Field>
              <Field label="Năm phát hành">
                <input
                  type="number"
                  className={INPUT}
                  value={meta.year}
                  onChange={(e) =>
                    setMeta((p) => ({ ...p, year: e.target.value }))
                  }
                />
              </Field>
              <Field label="Chất lượng">
                <input
                  className={INPUT}
                  value={meta.quality}
                  onChange={(e) =>
                    setMeta((p) => ({ ...p, quality: e.target.value }))
                  }
                  placeholder="HD, FHD, 4K..."
                />
              </Field>
              <Field label="Ngôn ngữ">
                <input
                  className={INPUT}
                  value={meta.lang}
                  onChange={(e) =>
                    setMeta((p) => ({ ...p, lang: e.target.value }))
                  }
                  placeholder="Vietsub, Thuyết minh..."
                />
              </Field>
              <Field label="Thời lượng">
                <input
                  className={INPUT}
                  value={meta.time}
                  onChange={(e) =>
                    setMeta((p) => ({ ...p, time: e.target.value }))
                  }
                  placeholder="45 phút/tập"
                />
              </Field>
              <Field label="Tập hiện tại">
                <input
                  className={INPUT}
                  value={meta.episode_current}
                  onChange={(e) =>
                    setMeta((p) => ({ ...p, episode_current: e.target.value }))
                  }
                  placeholder="Hoàn tất, Tập 12..."
                />
              </Field>
              <Field label="Tổng số tập">
                <input
                  className={INPUT}
                  value={meta.episode_total}
                  onChange={(e) =>
                    setMeta((p) => ({ ...p, episode_total: e.target.value }))
                  }
                  placeholder="12, 24..."
                />
              </Field>
              <Field label="Diễn viên (phân cách bằng dấu phẩy)" span2>
                <input
                  className={INPUT}
                  value={meta.actor}
                  onChange={(e) =>
                    setMeta((p) => ({ ...p, actor: e.target.value }))
                  }
                  placeholder="Diễn viên A, Diễn viên B..."
                />
              </Field>
              <Field label="Đạo diễn (phân cách bằng dấu phẩy)" span2>
                <input
                  className={INPUT}
                  value={meta.director}
                  onChange={(e) =>
                    setMeta((p) => ({ ...p, director: e.target.value }))
                  }
                  placeholder="Đạo diễn A..."
                />
              </Field>
              <Field label="Trailer URL" span2>
                <input
                  className={INPUT}
                  value={meta.trailer_url}
                  onChange={(e) =>
                    setMeta((p) => ({ ...p, trailer_url: e.target.value }))
                  }
                  placeholder="https://youtube.com/..."
                />
              </Field>
              <div className="col-span-2 flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={meta.isTrending}
                    onChange={(e) =>
                      setMeta((p) => ({ ...p, isTrending: e.target.checked }))
                    }
                    className="w-4 h-4 rounded accent-red-500"
                  />
                  <span className="text-sm text-gray-300 font-bold">
                    Đánh dấu Đang Thịnh Hành
                  </span>
                </label>
                {meta.isTrending && (
                  <input
                    type="number"
                    className={`${INPUT} w-32`}
                    value={meta.trendingRank}
                    onChange={(e) =>
                      setMeta((p) => ({ ...p, trendingRank: e.target.value }))
                    }
                    placeholder="Thứ tự (1, 2...)"
                    min="1"
                  />
                )}
              </div>
            </div>
          )}

          {/* Media Tab */}
          {activeTab === "media" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Thumbnail URL
                </label>
                <input
                  className={INPUT}
                  value={media.thumb_url}
                  onChange={(e) =>
                    setMedia((p) => ({ ...p, thumb_url: e.target.value }))
                  }
                  placeholder="https://..."
                />
                {media.thumb_url && (
                  <img
                    src={media.thumb_url}
                    alt="thumb"
                    className="mt-2 h-32 rounded-xl object-cover border border-gray-800"
                  />
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Poster URL
                </label>
                <input
                  className={INPUT}
                  value={media.poster_url}
                  onChange={(e) =>
                    setMedia((p) => ({ ...p, poster_url: e.target.value }))
                  }
                  placeholder="https://..."
                />
                {media.poster_url && (
                  <img
                    src={media.poster_url}
                    alt="poster"
                    className="mt-2 h-48 rounded-xl object-cover border border-gray-800"
                  />
                )}
              </div>
            </div>
          )}

          {/* Episodes Tab */}
          {activeTab === "episodes" && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-400">{episodes.length} tập</p>
                {!newEp && (
                  <button
                    onClick={() => setNewEp({ ...EMPTY_EP })}
                    className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-black px-3 py-2 rounded-xl transition-colors"
                  >
                    <Plus size={14} />
                    Thêm tập
                  </button>
                )}
              </div>

              {newEp && (
                <div className="border border-red-500/40 rounded-2xl p-4 bg-red-500/5 space-y-3">
                  <p className="text-xs font-black text-red-400 uppercase tracking-wider">
                    Tập mới
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-bold">
                        Tên tập *
                      </label>
                      <input
                        className={INPUT}
                        value={newEp.name}
                        onChange={(e) =>
                          setNewEp((p) => p && { ...p, name: e.target.value })
                        }
                        placeholder="Tập 1, Tập 2..."
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-bold">
                        Server
                      </label>
                      <input
                        className={INPUT}
                        value={newEp.server_name}
                        onChange={(e) =>
                          setNewEp(
                            (p) => p && { ...p, server_name: e.target.value },
                          )
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] text-gray-500 uppercase font-bold">
                        Link Embed
                      </label>
                      <input
                        className={INPUT}
                        value={newEp.link_embed}
                        onChange={(e) =>
                          setNewEp(
                            (p) => p && { ...p, link_embed: e.target.value },
                          )
                        }
                        placeholder="https://..."
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] text-gray-500 uppercase font-bold">
                        Link M3U8
                      </label>
                      <input
                        className={INPUT}
                        value={newEp.link_m3u8}
                        onChange={(e) =>
                          setNewEp(
                            (p) => p && { ...p, link_m3u8: e.target.value },
                          )
                        }
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveNewEp}
                      className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-black px-3 py-2 rounded-xl"
                    >
                      <Check size={14} />
                      Lưu
                    </button>
                    <button
                      onClick={() => setNewEp(null)}
                      className="text-gray-500 hover:text-white text-xs font-bold px-3 py-2 rounded-xl border border-gray-700"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}

              {epLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
                </div>
              ) : episodes.length === 0 && !newEp ? (
                <div className="text-center py-10 text-gray-600 italic text-sm">
                  Chưa có tập nào. Thêm tập mới bên trên.
                </div>
              ) : (
                <div className="space-y-2">
                  {episodes.map((ep) => {
                    const isEditing = editingEp?.id === ep._id;
                    return (
                      <div
                        key={ep._id}
                        className="border border-gray-800 rounded-2xl p-3 bg-gray-950/60"
                      >
                        {isEditing && editingEp ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold">
                                  Tên tập
                                </label>
                                <input
                                  className={INPUT}
                                  value={editingEp.form.name}
                                  onChange={(e) =>
                                    setEditingEp((p) =>
                                      p
                                        ? {
                                            ...p,
                                            form: {
                                              ...p.form,
                                              name: e.target.value,
                                            },
                                          }
                                        : null,
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold">
                                  Server
                                </label>
                                <input
                                  className={INPUT}
                                  value={editingEp.form.server_name}
                                  onChange={(e) =>
                                    setEditingEp((p) =>
                                      p
                                        ? {
                                            ...p,
                                            form: {
                                              ...p.form,
                                              server_name: e.target.value,
                                            },
                                          }
                                        : null,
                                    )
                                  }
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="text-[10px] text-gray-500 uppercase font-bold">
                                  Link Embed
                                </label>
                                <input
                                  className={INPUT}
                                  value={editingEp.form.link_embed}
                                  onChange={(e) =>
                                    setEditingEp((p) =>
                                      p
                                        ? {
                                            ...p,
                                            form: {
                                              ...p.form,
                                              link_embed: e.target.value,
                                            },
                                          }
                                        : null,
                                    )
                                  }
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="text-[10px] text-gray-500 uppercase font-bold">
                                  Link M3U8
                                </label>
                                <input
                                  className={INPUT}
                                  value={editingEp.form.link_m3u8}
                                  onChange={(e) =>
                                    setEditingEp((p) =>
                                      p
                                        ? {
                                            ...p,
                                            form: {
                                              ...p.form,
                                              link_m3u8: e.target.value,
                                            },
                                          }
                                        : null,
                                    )
                                  }
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveEditEp}
                                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-black px-3 py-1.5 rounded-xl"
                              >
                                <Check size={13} />
                                Lưu
                              </button>
                              <button
                                onClick={() => setEditingEp(null)}
                                className="text-gray-500 hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-700"
                              >
                                Hủy
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Film
                              size={16}
                              className="text-gray-600 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white truncate">
                                {ep.name}
                              </p>
                              <p className="text-xs text-gray-600 truncate">
                                {ep.server_name}
                                {ep.link_m3u8 ? " · M3U8" : ""}
                                {ep.link_embed ? " · Embed" : ""}
                              </p>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              <button
                                onClick={() =>
                                  setEditingEp({
                                    id: ep._id,
                                    form: {
                                      name: ep.name ?? "",
                                      slug: ep.slug ?? "",
                                      server_name: ep.server_name ?? "",
                                      link_embed: ep.link_embed ?? "",
                                      link_m3u8: ep.link_m3u8 ?? "",
                                      filename: ep.filename ?? "",
                                    },
                                  })
                                }
                                className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-white transition-colors"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteEp(ep._id)}
                                className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab !== "episodes" && (
          <div className="px-6 py-4 border-t border-gray-800 flex gap-3 shrink-0">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-800 text-gray-400 font-bold hover:bg-gray-800 transition-colors text-sm"
            >
              Hủy
            </button>
            <button
              onClick={handleSaveMeta}
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black transition-all disabled:opacity-50 text-sm"
            >
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
