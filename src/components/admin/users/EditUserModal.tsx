"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";

export interface EditableAdminUser {
  _id: string;
  username: string;
  email: string;
  role: string;
  avatar?: string;
  coins: number;
  bonusCoins: number;
  vipStatus: boolean;
  vipExpiry?: string;
  vipPackageName?: string;
  vipCoinsPerMinute?: number;
  giftLevel: number;
  referralCode?: string;
  referralCount: number;
}

interface EditUserModalProps {
  open: boolean;
  user: EditableAdminUser | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  username: string;
  email: string;
  role: "user" | "admin";
  avatar: string;
  coins: string;
  bonusCoins: string;
  vipStatus: boolean;
  vipExpiry: string;
  vipPackageName: string;
  vipCoinsPerMinute: string;
  giftLevel: string;
  referralCode: string;
  referralCount: string;
}

const EMPTY_FORM: FormState = {
  username: "",
  email: "",
  role: "user",
  avatar: "",
  coins: "0",
  bonusCoins: "0",
  vipStatus: false,
  vipExpiry: "",
  vipPackageName: "",
  vipCoinsPerMinute: "0",
  giftLevel: "1",
  referralCode: "",
  referralCount: "0",
};

function toDateTimeLocal(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
}

export default function EditUserModal({
  open,
  user,
  onClose,
  onSaved,
}: EditUserModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !user) return;
    setForm({
      username: user.username ?? "",
      email: user.email ?? "",
      role: user.role === "admin" ? "admin" : "user",
      avatar: user.avatar ?? "",
      coins: String(user.coins ?? 0),
      bonusCoins: String(user.bonusCoins ?? 0),
      vipStatus: Boolean(user.vipStatus),
      vipExpiry: toDateTimeLocal(user.vipExpiry),
      vipPackageName: user.vipPackageName ?? "",
      vipCoinsPerMinute: String(user.vipCoinsPerMinute ?? 0),
      giftLevel: String(user.giftLevel ?? 1),
      referralCode: user.referralCode ?? "",
      referralCount: String(user.referralCount ?? 0),
    });
    setError("");
  }, [open, user]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          role: form.role,
          avatar: form.avatar,
          coins: Number(form.coins),
          bonusCoins: Number(form.bonusCoins),
          vipStatus: form.vipStatus,
          vipExpiry: form.vipExpiry || null,
          vipPackageName: form.vipPackageName,
          vipCoinsPerMinute: Number(form.vipCoinsPerMinute),
          giftLevel: Number(form.giftLevel),
          referralCode: form.referralCode,
          referralCount: Number(form.referralCount),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error ?? "Không thể cập nhật user");
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError("Không thể kết nối tới máy chủ");
    } finally {
      setLoading(false);
    }
  }

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-gray-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-black text-white">Chỉnh sửa user</h2>
            <p className="mt-1 text-sm text-white/45">
              Cập nhật hồ sơ, số dư, trạng thái VIP và thông tin cấp độ.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/6 text-white/65 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="max-h-[calc(100vh-5rem)] overflow-y-auto px-5 py-5 sm:px-6"
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-widest text-white/45">
                    Username
                  </span>
                  <input
                    value={form.username}
                    onChange={(event) =>
                      updateField("username", event.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none transition-colors focus:border-red-500/60"
                    required
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-widest text-white/45">
                    Vai trò
                  </span>
                  <select
                    value={form.role}
                    onChange={(event) =>
                      updateField(
                        "role",
                        event.target.value as "user" | "admin",
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none transition-colors focus:border-red-500/60"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-white/45">
                    Email
                  </span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none transition-colors focus:border-red-500/60"
                    required
                  />
                </label>
                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-white/45">
                    Avatar URL
                  </span>
                  <input
                    value={form.avatar}
                    onChange={(event) =>
                      updateField("avatar", event.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none transition-colors focus:border-red-500/60"
                    placeholder="https://..."
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-white/45">
                  Số dư và giới thiệu
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-xs text-white/45">Số dư xu</span>
                    <input
                      type="number"
                      min="0"
                      value={form.coins}
                      onChange={(event) =>
                        updateField("coins", event.target.value)
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none transition-colors focus:border-red-500/60"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs text-white/45">Xu thưởng</span>
                    <input
                      type="number"
                      min="0"
                      value={form.bonusCoins}
                      onChange={(event) =>
                        updateField("bonusCoins", event.target.value)
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none transition-colors focus:border-red-500/60"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs text-white/45">Mã giới thiệu</span>
                    <input
                      value={form.referralCode}
                      onChange={(event) =>
                        updateField(
                          "referralCode",
                          event.target.value.toUpperCase(),
                        )
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm uppercase text-white outline-none transition-colors focus:border-red-500/60"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs text-white/45">
                      Số lượt giới thiệu
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={form.referralCount}
                      onChange={(event) =>
                        updateField("referralCount", event.target.value)
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none transition-colors focus:border-red-500/60"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-white/45">
                      Cấu hình VIP
                    </p>
                    <p className="mt-1 text-sm text-white/40">
                      VIP dùng để bật kiếm tiền khi xem. Cấp hộp quà hiện lấy
                      theo trường Cấp hiện tại ở phần bên dưới.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-2 text-sm font-semibold text-white">
                    <input
                      type="checkbox"
                      checked={form.vipStatus}
                      onChange={(event) =>
                        updateField("vipStatus", event.target.checked)
                      }
                      className="h-4 w-4 rounded border-white/20 bg-black/40"
                    />
                    VIP hoạt động
                  </label>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5 sm:col-span-2">
                    <span className="text-xs text-white/45">Tên gói bậc</span>
                    <input
                      value={form.vipPackageName}
                      onChange={(event) =>
                        updateField("vipPackageName", event.target.value)
                      }
                      disabled={!form.vipStatus}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none transition-colors focus:border-red-500/60 disabled:cursor-not-allowed disabled:opacity-45"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs text-white/45">
                      Kiếm xu/phút (1 = mặc định)
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={form.vipCoinsPerMinute}
                      onChange={(event) =>
                        updateField("vipCoinsPerMinute", event.target.value)
                      }
                      disabled={!form.vipStatus}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none transition-colors focus:border-red-500/60 disabled:cursor-not-allowed disabled:opacity-45"
                    />
                  </label>
                  <label className="space-y-1.5 sm:col-span-2">
                    <span className="text-xs text-white/45">Hạn VIP</span>
                    <input
                      type="datetime-local"
                      value={form.vipExpiry}
                      onChange={(event) =>
                        updateField("vipExpiry", event.target.value)
                      }
                      disabled={!form.vipStatus}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none transition-colors focus:border-red-500/60 disabled:cursor-not-allowed disabled:opacity-45"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-white/45">
                  Cấp độ hộp quà
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-1">
                  <label className="space-y-1.5">
                    <span className="text-xs text-white/45">Cấp hiện tại</span>
                    <input
                      type="number"
                      min="1"
                      value={form.giftLevel}
                      onChange={(event) =>
                        updateField("giftLevel", event.target.value)
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none transition-colors focus:border-red-500/60"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-white/8 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
