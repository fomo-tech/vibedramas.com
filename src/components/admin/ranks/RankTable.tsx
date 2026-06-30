"use client";

import { useState } from "react";
import { Pencil, Save, X } from "lucide-react";

export interface RankRow {
  _id: string;
  rank: number;
  name: string;
  coinsReward: number;
  expReward: number;
  requiredExp: number;
  watchSeconds: number;
  isActive: boolean;
  order: number;
  badge?: string;
  badgeVariant?: "popular" | "best";
}

type EditableForm = Pick<
  RankRow,
  "name" | "coinsReward" | "expReward" | "requiredExp" | "watchSeconds"
>;

interface RankTableProps {
  ranks: RankRow[];
  onSaved: () => void;
}

function numeric(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function RankTable({ ranks, onSaved }: RankTableProps) {
  const [editing, setEditing] = useState<RankRow | null>(null);
  const [form, setForm] = useState<EditableForm>({
    name: "",
    coinsReward: 10,
    expReward: 10,
    requiredExp: 0,
    watchSeconds: 60,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function startEdit(row: RankRow) {
    setEditing(row);
    setForm({
      name: row.name,
      coinsReward: numeric(row.coinsReward, 10),
      expReward: numeric(row.expReward, 10),
      requiredExp: numeric(row.requiredExp, 0),
      watchSeconds: numeric(row.watchSeconds, 60),
    });
    setError("");
  }

  async function save() {
    if (!editing) return;
    if (!form.name.trim()) {
      setError("Tên level không được để trống");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/ranks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editing,
          ...form,
          name: form.name.trim(),
          coinsReward: Math.max(1, numeric(form.coinsReward, 1)),
          expReward: Math.max(1, numeric(form.expReward, 1)),
          requiredExp: Math.max(0, Math.floor(numeric(form.requiredExp, 0))),
          watchSeconds: Math.max(10, numeric(form.watchSeconds, 60)),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Không thể lưu level");
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
    return <div className="py-12 text-center text-sm text-gray-500">Chưa có dữ liệu level</div>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr className="bg-gray-900 text-xs uppercase text-gray-400">
            <th className="px-4 py-3 text-left">Level</th>
            <th className="px-4 py-3 text-left">Tên</th>
            <th className="px-4 py-3 text-center">Mốc EXP</th>
            <th className="px-4 py-3 text-center">EXP / hộp</th>
            <th className="px-4 py-3 text-center">Xu / hộp</th>
            <th className="px-4 py-3 text-center">Giây / hộp</th>
            <th className="px-4 py-3 text-center">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {ranks.map((row) => {
            const active = editing?._id === row._id;
            return (
              <tr key={row._id} className="bg-gray-950 hover:bg-gray-900/60">
                <td className="px-4 py-3 font-black text-white">Level {row.rank}</td>
                <Cell active={active} value={form.name} display={row.name} onChange={(value) => setForm((old) => ({ ...old, name: value }))} />
                <NumberCell active={active} value={form.requiredExp} display={`${numeric(row.requiredExp, 0).toLocaleString("vi-VN")} EXP`} onChange={(value) => setForm((old) => ({ ...old, requiredExp: value }))} />
                <NumberCell active={active} value={form.expReward} display={`+${numeric(row.expReward, 10)} EXP`} onChange={(value) => setForm((old) => ({ ...old, expReward: value }))} />
                <NumberCell active={active} value={form.coinsReward} display={`+${numeric(row.coinsReward, 0)} xu`} onChange={(value) => setForm((old) => ({ ...old, coinsReward: value }))} />
                <NumberCell active={active} value={form.watchSeconds} display={`${numeric(row.watchSeconds, 60)}s`} onChange={(value) => setForm((old) => ({ ...old, watchSeconds: value }))} />
                <td className="px-4 py-3 text-center">
                  {active ? (
                    <div className="flex justify-center gap-2">
                      <button type="button" onClick={save} disabled={saving} className="rounded-lg bg-emerald-500/15 p-2 text-emerald-400 hover:bg-emerald-500/25" aria-label="Lưu"><Save size={16} /></button>
                      <button type="button" onClick={() => setEditing(null)} className="rounded-lg bg-gray-800 p-2 text-gray-400 hover:text-white" aria-label="Hủy"><X size={16} /></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => startEdit(row)} className="rounded-lg bg-gray-800 p-2 text-gray-400 hover:text-white" aria-label={`Sửa level ${row.rank}`}><Pencil size={16} /></button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {error && <p className="border-t border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
    </div>
  );
}

function Cell({ active, value, display, onChange }: { active: boolean; value: string; display: string; onChange: (value: string) => void }) {
  return (
    <td className="px-4 py-3">
      {active ? <input value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none focus:border-orange-500" /> : <span className="font-semibold text-white">{display}</span>}
    </td>
  );
}

function NumberCell({ active, value, display, onChange }: { active: boolean; value: number; display: string; onChange: (value: number) => void }) {
  return (
    <td className="px-4 py-3 text-center">
      {active ? <input type="number" min={0} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-24 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-center text-white outline-none focus:border-orange-500" /> : <span className="text-gray-300">{display}</span>}
    </td>
  );
}
