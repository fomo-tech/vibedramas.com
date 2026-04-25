"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Gift,
  Link2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Video,
} from "lucide-react";
import { useAlert } from "@/hooks/useAlert";

interface WelfareTaskForm {
  id: string;
  title: string;
  subtitle: string;
  reward: number;
  actionLabel: string;
  icon: "login" | "notifications" | "watch_ad" | "facebook";
  actionType:
    | "login"
    | "notifications"
    | "watch_ad"
    | "follow_facebook"
    | "custom";
  enabled: boolean;
  dailyLimit: number;
  totalLimit: number;
  requiresImageProof: boolean;
  linkUrl?: string;
  order: number;
}

interface WelfareConfigResponse {
  headerTitle: string;
  headerSubtitle: string;
  rewardsTabLabel: string;
  memberTabLabel: string;
  dailyCheckInRewards: number[];
  tasks: WelfareTaskForm[];
}

const EMPTY_CONFIG: WelfareConfigResponse = {
  headerTitle: "Trung tâm phúc lợi",
  headerSubtitle: "Điểm danh mỗi ngày và làm nhiệm vụ để nhận thêm xu.",
  rewardsTabLabel: "Xu thưởng",
  memberTabLabel: "Điểm hội viên",
  dailyCheckInRewards: [10, 20, 20, 10, 10, 25, 40],
  tasks: [],
};

const TASK_META = {
  login: {
    label: "Đăng nhập",
    hint: "Nhiệm vụ một lần sau khi người dùng đã đăng nhập.",
    icon: Link2,
  },
  notifications: {
    label: "Thông báo",
    hint: "Chỉ claim khi trình duyệt trả quyền thông báo là granted.",
    icon: Bell,
  },
  watch_ad: {
    label: "Xem video",
    hint: "Có thể đặt giới hạn theo ngày, phù hợp cho nhiệm vụ lặp lại.",
    icon: Video,
  },
  follow_facebook: {
    label: "Facebook",
    hint: "Có thể gắn link fanpage hoặc landing page bất kỳ.",
    icon: Gift,
  },
  custom: {
    label: "Tùy chỉnh",
    hint: "Nhiệm vụ do admin tự đặt tên và điều kiện.",
    icon: Gift,
  },
} as const;

const ICON_OPTIONS: Array<WelfareTaskForm["icon"]> = [
  "login",
  "notifications",
  "watch_ad",
  "facebook",
];

const ACTION_OPTIONS: Array<WelfareTaskForm["actionType"]> = [
  "custom",
  "login",
  "notifications",
  "watch_ad",
  "follow_facebook",
];

export default function AdminWelfarePage() {
  const { showConfirm } = useAlert();
  const [config, setConfig] = useState<WelfareConfigResponse>(EMPTY_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  async function fetchConfig() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/welfare");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Không thể tải cấu hình");
        return;
      }
      setConfig(data);
    } catch {
      setError("Không thể kết nối server");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchConfig();
  }, []);

  function updateField<K extends keyof WelfareConfigResponse>(
    field: K,
    value: WelfareConfigResponse[K],
  ) {
    setConfig((prev) => ({ ...prev, [field]: value }));
  }

  function updateReward(index: number, value: string) {
    setConfig((prev) => ({
      ...prev,
      dailyCheckInRewards: prev.dailyCheckInRewards.map((item, itemIndex) =>
        itemIndex === index ? Math.max(0, Number(value) || 0) : item,
      ),
    }));
  }

  function updateTask(
    taskId: string,
    field: keyof WelfareTaskForm,
    value: string | number | boolean,
  ) {
    setConfig((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === taskId ? { ...task, [field]: value } : task,
      ),
    }));
  }

  function addTask() {
    setConfig((prev) => {
      const nextOrder =
        prev.tasks.reduce((max, task) => Math.max(max, task.order), 0) + 1;
      const nextId = `custom-${Date.now()}`;
      setEditingTaskId(nextId);

      return {
        ...prev,
        tasks: [
          ...prev.tasks,
          {
            id: nextId,
            title: "Nhiệm vụ mới",
            subtitle: "Mô tả nhiệm vụ",
            reward: 20,
            actionLabel: "Nhận xu",
            icon: "watch_ad",
            actionType: "custom",
            enabled: true,
            dailyLimit: 1,
            totalLimit: 0,
            requiresImageProof: false,
            order: nextOrder,
          },
        ],
      };
    });
  }

  function removeTask(taskId: string) {
    showConfirm({
      title: "Xóa nhiệm vụ?",
      message: "Nhiệm vụ này sẽ bị xoá khỏi hệ thống.",
      confirmText: "Xóa",
      variant: "danger",
      onConfirm: () => {
        setEditingTaskId((prev) => (prev === taskId ? null : prev));
        setConfig((prev) => ({
          ...prev,
          tasks: prev.tasks.filter((task) => task.id !== taskId),
        }));
      },
    });
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/welfare", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Không thể lưu cấu hình");
        return;
      }
      setConfig(data);
      setSuccess("Đã lưu cấu hình Trung tâm phúc lợi");
    } catch {
      setError("Không thể kết nối server");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Trung tâm phúc lợi</h1>
          <p className="mt-1 text-sm text-gray-400">
            Quản lý điểm danh và nhiệm vụ kiếm xu hiển thị ở app người dùng.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchConfig}
            disabled={loading || saving}
            className="rounded-xl bg-gray-800 p-2 text-gray-400 transition-colors hover:bg-gray-700"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-400 disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Đang lưu..." : "Lưu cấu hình"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-4 text-sm text-gray-300">
        Tab Xu thưởng lấy dữ liệu từ cấu hình tại đây. Tab Điểm hội viên vẫn
        hiển thị cấp độ và hộp quà hiện có của hệ thống VIP.
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {success}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-sm text-gray-500">
          Đang tải cấu hình phúc lợi...
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                Nội dung chung
              </p>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">
                    Tiêu đề
                  </label>
                  <input
                    value={config.headerTitle}
                    onChange={(event) =>
                      updateField("headerTitle", event.target.value)
                    }
                    className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-orange-500/60"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">
                    Mô tả ngắn
                  </label>
                  <textarea
                    value={config.headerSubtitle}
                    onChange={(event) =>
                      updateField("headerSubtitle", event.target.value)
                    }
                    rows={3}
                    className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-orange-500/60"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">
                      Tab 1
                    </label>
                    <input
                      value={config.rewardsTabLabel}
                      onChange={(event) =>
                        updateField("rewardsTabLabel", event.target.value)
                      }
                      className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-orange-500/60"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">
                      Tab 2
                    </label>
                    <input
                      value={config.memberTabLabel}
                      onChange={(event) =>
                        updateField("memberTabLabel", event.target.value)
                      }
                      className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-orange-500/60"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                Điểm danh 7 ngày
              </p>
              <div className="grid grid-cols-7 gap-2">
                {config.dailyCheckInRewards.map((reward, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-gray-800 bg-gray-950 p-3 text-center"
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                      Ngày {index + 1}
                    </p>
                    <input
                      type="number"
                      min={0}
                      value={reward}
                      onChange={(event) =>
                        updateReward(index, event.target.value)
                      }
                      className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-900 px-2 py-2 text-center text-sm font-black text-orange-400 outline-none transition-colors focus:border-orange-500/60"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-black text-white">
                Nhiệm vụ kiếm xu
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Chỉnh reward, nhãn nút và giới hạn claim cho từng nhiệm vụ.
              </p>
            </div>

            <button
              onClick={addTask}
              className="inline-flex items-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-300 transition-colors hover:bg-orange-500/20"
            >
              <Plus size={15} />
              Thêm nhiệm vụ
            </button>

            {config.tasks.map((task) => {
              const meta = TASK_META[task.actionType];
              const Icon = meta.icon;
              const isEditing = editingTaskId === task.id;

              return (
                <div
                  key={task.id}
                  className="rounded-2xl border border-gray-800 bg-gray-900 p-5"
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-white">{meta.label}</p>
                        <p className="mt-1 text-sm text-gray-400">
                          {meta.hint}
                        </p>
                      </div>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300">
                      <input
                        type="checkbox"
                        checked={task.enabled}
                        onChange={(event) =>
                          updateTask(task.id, "enabled", event.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-700 bg-gray-950 text-orange-500 focus:ring-orange-500/40"
                      />
                      Hiển thị
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setEditingTaskId((prev) =>
                            prev === task.id ? null : task.id,
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-white/6 px-2.5 py-1.5 text-xs font-bold text-gray-200 transition-colors hover:bg-white/10"
                      >
                        {isEditing ? "Ẩn chỉnh sửa" : "Sửa"}
                      </button>
                      <button
                        onClick={() => removeTask(task.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/20"
                      >
                        <Trash2 size={13} />
                        Xóa
                      </button>
                    </div>
                  </div>

                  {!isEditing ? (
                    <div className="rounded-xl border border-white/5 bg-gray-950/70 p-4 text-sm text-gray-300">
                      <p className="font-semibold text-white">{task.title}</p>
                      <p className="mt-1 text-gray-400">{task.subtitle}</p>
                      <p className="mt-3 text-xs uppercase tracking-wider text-gray-500">
                        {task.actionType} · +{task.reward} xu · giới hạn ngày{" "}
                        {task.dailyLimit}
                      </p>
                    </div>
                  ) : null}

                  <fieldset
                    disabled={!isEditing}
                    className={
                      isEditing ? "" : "pointer-events-none opacity-55"
                    }
                  >
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">
                          Tiêu đề
                        </label>
                        <input
                          value={task.title}
                          onChange={(event) =>
                            updateTask(task.id, "title", event.target.value)
                          }
                          className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-orange-500/60"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">
                          Subtitle
                        </label>
                        <input
                          value={task.subtitle}
                          onChange={(event) =>
                            updateTask(task.id, "subtitle", event.target.value)
                          }
                          className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-orange-500/60"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3 lg:col-span-2">
                        <div>
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">
                            Thưởng xu
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={task.reward}
                            onChange={(event) =>
                              updateTask(
                                task.id,
                                "reward",
                                Number(event.target.value) || 0,
                              )
                            }
                            className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-orange-500/60"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">
                            Nhãn nút
                          </label>
                          <input
                            value={task.actionLabel}
                            onChange={(event) =>
                              updateTask(
                                task.id,
                                "actionLabel",
                                event.target.value,
                              )
                            }
                            className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-orange-500/60"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">
                            Thứ tự
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={task.order}
                            onChange={(event) =>
                              updateTask(
                                task.id,
                                "order",
                                Number(event.target.value) || 1,
                              )
                            }
                            className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-orange-500/60"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">
                            Giới hạn ngày
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={task.dailyLimit}
                            onChange={(event) =>
                              updateTask(
                                task.id,
                                "dailyLimit",
                                Number(event.target.value) || 0,
                              )
                            }
                            className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-orange-500/60"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">
                            Giới hạn tổng
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={task.totalLimit}
                            onChange={(event) =>
                              updateTask(
                                task.id,
                                "totalLimit",
                                Number(event.target.value) || 0,
                              )
                            }
                            className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-orange-500/60"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">
                          Loại nhiệm vụ
                        </label>
                        <select
                          value={task.actionType}
                          onChange={(event) =>
                            updateTask(
                              task.id,
                              "actionType",
                              event.target.value,
                            )
                          }
                          className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-orange-500/60"
                        >
                          {ACTION_OPTIONS.map((action) => (
                            <option key={action} value={action}>
                              {action}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">
                          Icon
                        </label>
                        <select
                          value={task.icon}
                          onChange={(event) =>
                            updateTask(task.id, "icon", event.target.value)
                          }
                          className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-orange-500/60"
                        >
                          {ICON_OPTIONS.map((icon) => (
                            <option key={icon} value={icon}>
                              {icon}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">
                          Link ngoài (nếu có)
                        </label>
                        <input
                          value={task.linkUrl ?? ""}
                          onChange={(event) =>
                            updateTask(task.id, "linkUrl", event.target.value)
                          }
                          placeholder="https://..."
                          className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-orange-500/60"
                        />
                      </div>
                      <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300 lg:col-span-2">
                        <input
                          type="checkbox"
                          checked={task.requiresImageProof}
                          onChange={(event) =>
                            updateTask(
                              task.id,
                              "requiresImageProof",
                              event.target.checked,
                            )
                          }
                          className="h-4 w-4 rounded border-gray-700 bg-gray-950 text-orange-500 focus:ring-orange-500/40"
                        />
                        Bật upload ảnh minh chứng khi nhận thưởng
                      </label>
                    </div>
                  </fieldset>

                  {isEditing ? (
                    <p className="mt-3 text-xs text-orange-300/80">
                      Nhấn "Lưu cấu hình" phía trên để áp dụng thay đổi nhiệm
                      vụ.
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
