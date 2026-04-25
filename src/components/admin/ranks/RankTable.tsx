"use client";

import { useState } from "react";
import { Pencil, Save, X } from "lucide-react";

export interface RankRow {
  _id: string;
  rank: number;
  name: string;
  coinsReward: number;
  watchSeconds: number;
  price: number;
  days: number;
  coinsPerMinute: number;
  isActive: boolean;
  order: number;
  badge?: string;
  badgeVariant?: "popular" | "best";
}

const RANK_COLORS = [
  "text-gray-400",
  "text-blue-400",
  "text-purple-400",
  "text-yellow-400",
  "text-cyan-400",
];

type EditableForm = Omit<RankRow, "_id" | "rank">;

interface RankTableProps {
  ranks: RankRow[];
  onSaved: () => void;
}

function toNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function RankTable({ ranks, onSaved }: RankTableProps) {
  const [editing, setEditing] = useState<RankRow | null>(null);
  const [form, setForm] = useState<EditableForm>({
    name: "",
    coinsReward: 10,
    watchSeconds: 60,
    price: 0,
    days: 30,
    coinsPerMinute: 1,
    isActive: true,
    order: 1,
    badge: "",
    badgeVariant: undefined,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function startEdit(row: RankRow) {
    setEditing(row);
    setForm({
      name: row.name,
      coinsReward: toNumber(row.coinsReward, 10),
      watchSeconds: toNumber(row.watchSeconds, 60),
      price: toNumber(row.price, 0),
      days: toNumber(row.days, 30),
      coinsPerMinute: toNumber(row.coinsPerMinute, 1),
      isActive: row.isActive !== false,
      order: toNumber(row.order, toNumber(row.rank, 1)),
      badge: row.badge ?? "",
      badgeVariant: row.badgeVariant,
    });
    setError("");
  }

  async function handleSave() {
    if (!editing) return;
    const payload = {
      rank: editing.rank,
      ...form,
      coinsReward: Math.max(1, toNumber(form.coinsReward, 1)),
      watchSeconds: Math.max(10, toNumber(form.watchSeconds, 60)),
      price: Math.max(0, toNumber(form.price, 0)),
      days: Math.max(1, toNumber(form.days, 30)),
      coinsPerMinute: Math.max(0, toNumber(form.coinsPerMinute, 0)),
    };

    if (!payload.name.trim()) {
      setError("Tên gói không được để trống");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/ranks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Lỗi");
        return;
      }
      setEditing(null);
      onSaved();
    } catch {
      setError("Không kết nối được server");
    } finally {
      setSaving(false);
    }
  }

  if (ranks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">Đang tải...</div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-900 text-gray-400 text-xs uppercase tracking-wider">
            <th className="px-4 py-3 text-left">Gói</th>
            <th className="px-4 py-3 text-left">Tên gói</th>
            <th className="px-4 py-3 text-center">Xu nhận/lần</th>
            <th className="px-4 py-3 text-center">Thời gian xem (s)</th>
            <th className="px-4 py-3 text-center">Giá mua (xu)</th>
            <th className="px-4 py-3 text-center">Thời hạn (ngày)</th>
            <th className="px-4 py-3 text-center">Xu/phút</th>
            <th className="px-4 py-3 text-center">Trạng thái</th>
            <th className="px-4 py-3 text-center">Hành động</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {ranks.map((row) => {
            const isEditing = editing?._id === row._id;
            const coinsReward = toNumber(row.coinsReward, 0);
            const watchSeconds = toNumber(row.watchSeconds, 0);
            const price = toNumber(row.price, 0);
            const days = toNumber(row.days, 0);
            const coinsPerMinute = toNumber(row.coinsPerMinute, 0);
            return (
              <tr
                key={row._id}
                className="bg-gray-950 hover:bg-gray-900/50 transition-colors"
              >
                {/* Rank number */}
                <td className="px-4 py-3">
                  <span
                    className={`font-black text-lg ${RANK_COLORS[row.rank - 1] ?? "text-white"}`}
                  >
                    Gói {row.rank}
                  </span>
                </td>

                {/* Name */}
                <td className="px-4 py-3">
                  {isEditing ? (
                    <input
                      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white w-full focus:border-orange-500 outline-none"
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                    />
                  ) : (
                    <span className="font-semibold text-white">{row.name}</span>
                  )}
                </td>

                {/* coinsReward */}
                <td className="px-4 py-3 text-center">
                  {isEditing ? (
                    <input
                      type="number"
                      min={1}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white w-24 text-center focus:border-orange-500 outline-none"
                      value={form.coinsReward}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          coinsReward: Number(e.target.value),
                        }))
                      }
                    />
                  ) : (
                    <span className="font-bold text-orange-400">
                      {coinsReward.toLocaleString("vi-VN")} xu
                    </span>
                  )}
                </td>

                {/* watchSeconds */}
                <td className="px-4 py-3 text-center">
                  {isEditing ? (
                    <input
                      type="number"
                      min={10}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white w-24 text-center focus:border-orange-500 outline-none"
                      value={form.watchSeconds}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          watchSeconds: Number(e.target.value),
                        }))
                      }
                    />
                  ) : (
                    <span className="text-gray-300">{watchSeconds}s</span>
                  )}
                </td>

                <td className="px-4 py-3 text-center">
                  {isEditing ? (
                    <input
                      type="number"
                      min={0}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white w-24 text-center focus:border-orange-500 outline-none"
                      value={form.price}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          price: Number(e.target.value),
                        }))
                      }
                    />
                  ) : (
                    <span className="text-amber-300">
                      {price.toLocaleString("vi-VN")} xu
                    </span>
                  )}
                </td>

                <td className="px-4 py-3 text-center">
                  {isEditing ? (
                    <input
                      type="number"
                      min={1}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white w-24 text-center focus:border-orange-500 outline-none"
                      value={form.days}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, days: Number(e.target.value) }))
                      }
                    />
                  ) : (
                    <span className="text-gray-300">{days} ngày</span>
                  )}
                </td>

                <td className="px-4 py-3 text-center">
                  {isEditing ? (
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white w-24 text-center focus:border-orange-500 outline-none"
                      value={form.coinsPerMinute}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          coinsPerMinute: Number(e.target.value),
                        }))
                      }
                    />
                  ) : (
                    <span className="text-gray-300">{coinsPerMinute}</span>
                  )}
                </td>

                <td className="px-4 py-3 text-center">
                  {isEditing ? (
                    <select
                      className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white focus:border-orange-500 outline-none"
                      value={form.isActive ? "true" : "false"}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          isActive: e.target.value === "true",
                        }))
                      }
                    >
                      <option value="true">Hoạt động</option>
                      <option value="false">Ẩn</option>
                    </select>
                  ) : (
                    <span
                      className={
                        row.isActive ? "text-green-400" : "text-gray-500"
                      }
                    >
                      {row.isActive ? "Hoạt động" : "Ẩn"}
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3 text-center">
                  {isEditing ? (
                    <div className="flex items-center justify-center gap-2">
                      {error && (
                        <span className="text-red-400 text-xs mr-1">
                          {error}
                        </span>
                      )}
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1 bg-orange-500 hover:bg-orange-400 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        <Save size={12} />
                        {saving ? "Đang lưu..." : "Lưu"}
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(row)}
                      className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
