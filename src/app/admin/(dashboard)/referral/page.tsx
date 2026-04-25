"use client";

import { useEffect, useState } from "react";
import { UserPlus, Save, RefreshCw, Plus, Trash2, Award } from "lucide-react";
import { useAlert } from "@/hooks/useAlert";

interface Milestone {
  id: string;
  label: string;
  min: number;
  rate: number;
  bonus: number;
  color: string;
}

interface ReferralConfig {
  milestones: Milestone[];
  rewardPerReferral: number;
  enableSystem: boolean;
}

export default function AdminReferralPage() {
  const { showConfirm } = useAlert();
  const [config, setConfig] = useState<ReferralConfig>({
    milestones: [],
    rewardPerReferral: 10,
    enableSystem: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function fetchConfig() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/referral");
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

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Không thể lưu cấu hình");
        return;
      }
      setSuccess("Đã lưu cấu hình thành công!");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Không thể kết nối server");
    } finally {
      setSaving(false);
    }
  }

  function updateMilestone(index: number, field: keyof Milestone, value: any) {
    setConfig((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m, i) =>
        i === index ? { ...m, [field]: value } : m,
      ),
    }));
  }

  function addMilestone() {
    setConfig((prev) => ({
      ...prev,
      milestones: [
        ...prev.milestones,
        {
          id: `milestone_${Date.now()}`,
          label: "Cấp mới",
          min: 0,
          rate: 5,
          bonus: 0,
          color: "#6b7280",
        },
      ],
    }));
  }

  function removeMilestone(index: number) {
    showConfirm({
      title: "Xóa cấp độ?",
      message: "Cấp độ này sẽ bị xoá.",
      confirmText: "Xóa",
      variant: "danger",
      onConfirm: () => {
        setConfig((prev) => ({
          ...prev,
          milestones: prev.milestones.filter((_, i) => i !== index),
        }));
      },
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Quản lý Giới thiệu bạn bè
            </h1>
            <p className="text-gray-400 text-sm">
              Cấu hình hệ thống referral và milestone
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchConfig}
            disabled={loading}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Tải lại</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Đang lưu..." : "Lưu"}</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* General Settings */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
          <Award className="w-5 h-5" />
          <span>Cài đặt chung</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Xu thưởng mỗi lần giới thiệu
            </label>
            <input
              type="number"
              value={config.rewardPerReferral}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  rewardPerReferral: Number(e.target.value),
                }))
              }
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={config.enableSystem}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  enableSystem: e.target.checked,
                }))
              }
              className="w-5 h-5 rounded border-gray-700 bg-gray-900"
            />
            <label className="text-sm text-gray-300">
              Bật hệ thống giới thiệu bạn bè
            </label>
          </div>
        </div>
      </div>

      {/* Add Milestone Button */}
      <button
        onClick={addMilestone}
        className="w-full py-3 border-2 border-dashed border-gray-700 hover:border-purple-500/50 rounded-xl text-gray-400 hover:text-purple-400 transition-colors flex items-center justify-center space-x-2"
      >
        <Plus className="w-5 h-5" />
        <span>Thêm cấp độ milestone</span>
      </button>

      {/* Milestones List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">
          Cấp độ Milestone ({config.milestones.length})
        </h2>
        {config.milestones.map((milestone, index) => (
          <div
            key={milestone.id}
            className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">
                Milestone #{index + 1}
              </h3>
              <button
                onClick={() => removeMilestone(index)}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* ID */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">ID</label>
                <input
                  type="text"
                  value={milestone.id}
                  onChange={(e) => updateMilestone(index, "id", e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              {/* Label */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Tên cấp độ
                </label>
                <input
                  type="text"
                  value={milestone.label}
                  onChange={(e) =>
                    updateMilestone(index, "label", e.target.value)
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              {/* Min */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Số người tối thiểu
                </label>
                <input
                  type="number"
                  value={milestone.min}
                  onChange={(e) =>
                    updateMilestone(index, "min", Number(e.target.value))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              {/* Rate */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Xu thưởng/người
                </label>
                <input
                  type="number"
                  value={milestone.rate}
                  onChange={(e) =>
                    updateMilestone(index, "rate", Number(e.target.value))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              {/* Bonus */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Bonus đạt cấp (xu)
                </label>
                <input
                  type="number"
                  value={milestone.bonus}
                  onChange={(e) =>
                    updateMilestone(index, "bonus", Number(e.target.value))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Màu sắc
                </label>
                <input
                  type="color"
                  value={milestone.color}
                  onChange={(e) =>
                    updateMilestone(index, "color", e.target.value)
                  }
                  className="w-full h-10 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
