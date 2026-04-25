"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Coins,
  Crown,
  Gift,
  Shield,
  Tv,
  User,
  Wallet,
} from "lucide-react";
import EditUserModal from "@/components/admin/users/EditUserModal";

type DetailUser = {
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
  lastLoginIp?: string;
  lastLoginUserAgent?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
};

type Summary = {
  soDuXu: number;
  xuThuong: number;
  tongNap: number;
  tongRutMoKhoa: number;
  tongTangXu: number;
  tongNhanXu: number;
  tongKiemTuXem: number;
  tongKiemTuHopQua: number;
  tongKiemTuGioiThieu: number;
  tongPhucLoi: number;
  tongCongXu: number;
  tongTruXu: number;
  tongLanMuaVip: number;
  tongLanMoHopQua: number;
  tongLanXemGanDay: number;
  tongGiaoDich: number;
  tongLuotNhanPhucLoi: number;
  tongLuotGioiThieu: number;
};

type TransactionItem = {
  _id: string;
  type: string;
  amount: number;
  direction: "credit" | "debit";
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

type VipLogItem = {
  _id: string;
  packageName: string;
  days: number;
  coinsPaid: number;
  coinsPerMinute: number;
  giftRank: number;
  vipFrom: string;
  vipTo: string;
  createdAt: string;
};

type GiftLogItem = {
  _id: string;
  giftLevel: number;
  rank: number;
  coinsEarned: number;
  expEarned: number;
  leveledUp: boolean;
  createdAt: string;
};

type WelfareClaimItem = {
  _id: string;
  actionType: string;
  taskId: string;
  reward: number;
  createdAt: string;
};

type ReferralLogItem = {
  _id: string;
  referrerId: string;
  refereeId: string;
  coinsAwarded: number;
  bonusAwarded: number;
  milestone?: string;
  createdAt: string;
};

type CoinLogItem = {
  _id: string;
  amount: number;
  episodeId: string;
  minuteIndex: number;
  createdAt: string;
};

type WatchHistoryItem = {
  _id: string;
  name?: string;
  origin_name?: string;
  episode?: string;
  watchedAt: string;
};

type DetailResponse = {
  user: DetailUser;
  summary: Summary;
  pagination: {
    transactions: PaginationInfo;
    vipLogs: PaginationInfo;
    giftLogs: PaginationInfo;
    welfareClaims: PaginationInfo;
    referralLogs: PaginationInfo;
    coinLogs: PaginationInfo;
    watchHistory: PaginationInfo;
  };
  activities: {
    transactions: TransactionItem[];
    vipLogs: VipLogItem[];
    giftLogs: GiftLogItem[];
    welfareClaims: WelfareClaimItem[];
    referralLogs: ReferralLogItem[];
    coinLogs: CoinLogItem[];
    watchHistory: WatchHistoryItem[];
  };
};

type PaginationInfo = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function formatNumber(value?: number | null) {
  return Number(value ?? 0).toLocaleString("vi-VN");
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN");
}

function normalizeDetailResponse(
  input: Partial<DetailResponse> | null | undefined,
): DetailResponse | null {
  if (!input?.user) return null;

  return {
    user: {
      _id: String(input.user._id ?? ""),
      username: String(input.user.username ?? ""),
      email: String(input.user.email ?? ""),
      role: String(input.user.role ?? "user"),
      avatar: input.user.avatar,
      coins: Number(input.user.coins ?? 0),
      bonusCoins: Number(input.user.bonusCoins ?? 0),
      vipStatus: Boolean(input.user.vipStatus),
      vipExpiry: input.user.vipExpiry,
      vipPackageName: input.user.vipPackageName,
      vipCoinsPerMinute: Number(input.user.vipCoinsPerMinute ?? 0),
      giftLevel: Number(input.user.giftLevel ?? 0),
      referralCode: input.user.referralCode,
      referralCount: Number(input.user.referralCount ?? 0),
      lastLoginIp: input.user.lastLoginIp,
      lastLoginUserAgent: input.user.lastLoginUserAgent,
      lastLoginAt: input.user.lastLoginAt,
      createdAt: String(input.user.createdAt ?? ""),
      updatedAt: String(input.user.updatedAt ?? ""),
    },
    summary: {
      soDuXu: Number(input.summary?.soDuXu ?? 0),
      xuThuong: Number(input.summary?.xuThuong ?? 0),
      tongNap: Number(input.summary?.tongNap ?? 0),
      tongRutMoKhoa: Number(input.summary?.tongRutMoKhoa ?? 0),
      tongTangXu: Number(input.summary?.tongTangXu ?? 0),
      tongNhanXu: Number(input.summary?.tongNhanXu ?? 0),
      tongKiemTuXem: Number(input.summary?.tongKiemTuXem ?? 0),
      tongKiemTuHopQua: Number(input.summary?.tongKiemTuHopQua ?? 0),
      tongKiemTuGioiThieu: Number(input.summary?.tongKiemTuGioiThieu ?? 0),
      tongPhucLoi: Number(input.summary?.tongPhucLoi ?? 0),
      tongCongXu: Number(input.summary?.tongCongXu ?? 0),
      tongTruXu: Number(input.summary?.tongTruXu ?? 0),
      tongLanMuaVip: Number(input.summary?.tongLanMuaVip ?? 0),
      tongLanMoHopQua: Number(input.summary?.tongLanMoHopQua ?? 0),
      tongLanXemGanDay: Number(input.summary?.tongLanXemGanDay ?? 0),
      tongGiaoDich: Number(input.summary?.tongGiaoDich ?? 0),
      tongLuotNhanPhucLoi: Number(input.summary?.tongLuotNhanPhucLoi ?? 0),
      tongLuotGioiThieu: Number(input.summary?.tongLuotGioiThieu ?? 0),
    },
    pagination: {
      transactions: {
        total: Number(input.pagination?.transactions?.total ?? 0),
        page: Number(input.pagination?.transactions?.page ?? 1),
        limit: Number(input.pagination?.transactions?.limit ?? 20),
        totalPages: Number(input.pagination?.transactions?.totalPages ?? 1),
      },
      vipLogs: {
        total: Number(input.pagination?.vipLogs?.total ?? 0),
        page: Number(input.pagination?.vipLogs?.page ?? 1),
        limit: Number(input.pagination?.vipLogs?.limit ?? 10),
        totalPages: Number(input.pagination?.vipLogs?.totalPages ?? 1),
      },
      giftLogs: {
        total: Number(input.pagination?.giftLogs?.total ?? 0),
        page: Number(input.pagination?.giftLogs?.page ?? 1),
        limit: Number(input.pagination?.giftLogs?.limit ?? 10),
        totalPages: Number(input.pagination?.giftLogs?.totalPages ?? 1),
      },
      welfareClaims: {
        total: Number(input.pagination?.welfareClaims?.total ?? 0),
        page: Number(input.pagination?.welfareClaims?.page ?? 1),
        limit: Number(input.pagination?.welfareClaims?.limit ?? 10),
        totalPages: Number(input.pagination?.welfareClaims?.totalPages ?? 1),
      },
      referralLogs: {
        total: Number(input.pagination?.referralLogs?.total ?? 0),
        page: Number(input.pagination?.referralLogs?.page ?? 1),
        limit: Number(input.pagination?.referralLogs?.limit ?? 10),
        totalPages: Number(input.pagination?.referralLogs?.totalPages ?? 1),
      },
      coinLogs: {
        total: Number(input.pagination?.coinLogs?.total ?? 0),
        page: Number(input.pagination?.coinLogs?.page ?? 1),
        limit: Number(input.pagination?.coinLogs?.limit ?? 10),
        totalPages: Number(input.pagination?.coinLogs?.totalPages ?? 1),
      },
      watchHistory: {
        total: Number(input.pagination?.watchHistory?.total ?? 0),
        page: Number(input.pagination?.watchHistory?.page ?? 1),
        limit: Number(input.pagination?.watchHistory?.limit ?? 10),
        totalPages: Number(input.pagination?.watchHistory?.totalPages ?? 1),
      },
    },
    activities: {
      transactions: Array.isArray(input.activities?.transactions)
        ? input.activities.transactions.map((item) => ({
            _id: String(item._id ?? ""),
            type: String(item.type ?? ""),
            amount: Number(item.amount ?? 0),
            direction: item.direction === "debit" ? "debit" : "credit",
            description: String(item.description ?? ""),
            metadata: item.metadata,
            createdAt: String(item.createdAt ?? ""),
          }))
        : [],
      vipLogs: Array.isArray(input.activities?.vipLogs)
        ? input.activities.vipLogs.map((item) => ({
            _id: String(item._id ?? ""),
            packageName: String(item.packageName ?? ""),
            days: Number(item.days ?? 0),
            coinsPaid: Number(item.coinsPaid ?? 0),
            coinsPerMinute: Number(item.coinsPerMinute ?? 0),
            giftRank: Number(item.giftRank ?? 1),
            vipFrom: String(item.vipFrom ?? ""),
            vipTo: String(item.vipTo ?? ""),
            createdAt: String(item.createdAt ?? ""),
          }))
        : [],
      giftLogs: Array.isArray(input.activities?.giftLogs)
        ? input.activities.giftLogs.map((item) => ({
            _id: String(item._id ?? ""),
            giftLevel: Number(item.giftLevel ?? 0),
            rank: Number(item.rank ?? 0),
            coinsEarned: Number(item.coinsEarned ?? 0),
            expEarned: Number(item.expEarned ?? 0),
            leveledUp: Boolean(item.leveledUp),
            createdAt: String(item.createdAt ?? ""),
          }))
        : [],
      welfareClaims: Array.isArray(input.activities?.welfareClaims)
        ? input.activities.welfareClaims.map((item) => ({
            _id: String(item._id ?? ""),
            actionType: String(item.actionType ?? ""),
            taskId: String(item.taskId ?? ""),
            reward: Number(item.reward ?? 0),
            createdAt: String(item.createdAt ?? ""),
          }))
        : [],
      referralLogs: Array.isArray(input.activities?.referralLogs)
        ? input.activities.referralLogs.map((item) => ({
            _id: String(item._id ?? ""),
            referrerId: String(item.referrerId ?? ""),
            refereeId: String(item.refereeId ?? ""),
            coinsAwarded: Number(item.coinsAwarded ?? 0),
            bonusAwarded: Number(item.bonusAwarded ?? 0),
            milestone: item.milestone,
            createdAt: String(item.createdAt ?? ""),
          }))
        : [],
      coinLogs: Array.isArray(input.activities?.coinLogs)
        ? input.activities.coinLogs.map((item) => ({
            _id: String(item._id ?? ""),
            amount: Number(item.amount ?? 0),
            episodeId: String(item.episodeId ?? ""),
            minuteIndex: Number(item.minuteIndex ?? 0),
            createdAt: String(item.createdAt ?? ""),
          }))
        : [],
      watchHistory: Array.isArray(input.activities?.watchHistory)
        ? input.activities.watchHistory.map((item) => ({
            _id: String(item._id ?? ""),
            name: item.name,
            origin_name: item.origin_name,
            episode: item.episode,
            watchedAt: String(item.watchedAt ?? ""),
          }))
        : [],
    },
  };
}

function PaginationControls({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-4 text-sm">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="inline-flex items-center gap-2 rounded-lg bg-black/30 px-3 py-2 text-white/75 transition-colors hover:bg-black/45 disabled:opacity-40"
      >
        <ChevronLeft size={16} />
        Trang trước
      </button>
      <span className="text-white/45">
        Trang {page} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="inline-flex items-center gap-2 rounded-lg bg-black/30 px-3 py-2 text-white/75 transition-colors hover:bg-black/45 disabled:opacity-40"
      >
        Trang sau
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent = "text-white",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-gray-900 px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-black tracking-tight ${accent}`}>
        {value}
      </p>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/8 bg-gray-900/80 p-5">
      <h2 className="text-lg font-black text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [editOpen, setEditOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activityPages, setActivityPages] = useState({
    transactions: 1,
    vipLogs: 1,
    giftLogs: 1,
    welfareClaims: 1,
    referralLogs: 1,
    coinLogs: 1,
    watchHistory: 1,
  });

  useEffect(() => {
    params.then((resolved) => setUserId(resolved.userId));
  }, [params]);

  useEffect(() => {
    if (!userId) return;

    async function loadDetail() {
      setLoading(true);
      setError(null);
      try {
        const search = new URLSearchParams({
          transactionsPage: String(activityPages.transactions),
          vipLogsPage: String(activityPages.vipLogs),
          giftLogsPage: String(activityPages.giftLogs),
          welfareClaimsPage: String(activityPages.welfareClaims),
          referralLogsPage: String(activityPages.referralLogs),
          coinLogsPage: String(activityPages.coinLogs),
          watchHistoryPage: String(activityPages.watchHistory),
        });
        const res = await fetch(
          `/api/admin/users/${userId}?${search.toString()}`,
        );
        const json = await res.json();
        if (!res.ok) {
          setError(json?.error ?? "Không thể tải chi tiết người dùng");
          setData(null);
          return;
        }
        setData(normalizeDetailResponse(json));
      } catch {
        setError("Không thể tải chi tiết người dùng");
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    loadDetail();
  }, [userId, activityPages, refreshKey]);

  const transactionPreview = useMemo(
    () => data?.activities.transactions ?? [],
    [data],
  );

  function updateActivityPage(
    key:
      | "transactions"
      | "vipLogs"
      | "giftLogs"
      | "welfareClaims"
      | "referralLogs"
      | "coinLogs"
      | "watchHistory",
    page: number,
  ) {
    setActivityPages((prev) => ({ ...prev, [key]: page }));
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-gray-800" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl border border-white/8 bg-gray-900"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
        <Link
          href="/admin/users"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách user
        </Link>
        <p className="text-base font-semibold">
          {error ?? "Không tìm thấy người dùng"}
        </p>
      </div>
    );
  }

  const { user, summary, activities } = data;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-white"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách user
          </Link>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white">
            Chi tiết người dùng
          </h1>
          <p className="mt-2 text-gray-400">
            Theo dõi đầy đủ hồ sơ, số dư và toàn bộ hoạt động của user.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="inline-flex items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-300 transition-colors hover:bg-red-500/20"
        >
          Chỉnh sửa user
        </button>
      </div>

      <section className="rounded-3xl border border-white/8 bg-gray-950 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-r from-red-500 to-pink-500">
                <User size={28} className="text-white" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-black text-white">
                {user.username}
              </h2>
              <p className="mt-1 text-sm text-gray-400">{user.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white/75">
                  Vai trò: {user.role}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white/75">
                  Tham gia: {formatDate(user.createdAt)}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white/75">
                  Cập nhật: {formatDate(user.updatedAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-widest text-yellow-200/60">
                Số dư xu
              </p>
              <p className="mt-2 text-2xl font-black text-yellow-300">
                {formatNumber(user.coins)}
              </p>
            </div>
            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-200/60">
                Xu thưởng
              </p>
              <p className="mt-2 text-2xl font-black text-orange-300">
                {formatNumber(user.bonusCoins)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Tổng nạp"
          value={formatNumber(summary.tongNap)}
          accent="text-emerald-400"
        />
        <SummaryCard
          label="Tổng tiêu xu"
          value={formatNumber(summary.tongTruXu)}
          accent="text-red-400"
        />
        <SummaryCard
          label="Tổng cộng xu"
          value={formatNumber(summary.tongCongXu)}
          accent="text-sky-400"
        />
        <SummaryCard
          label="Tổng giao dịch"
          value={formatNumber(summary.tongGiaoDich)}
          accent="text-white"
        />
        <SummaryCard
          label="Kiếm từ xem phim"
          value={formatNumber(summary.tongKiemTuXem)}
          accent="text-amber-300"
        />
        <SummaryCard
          label="Kiếm từ hộp quà"
          value={formatNumber(summary.tongKiemTuHopQua)}
          accent="text-fuchsia-300"
        />
        <SummaryCard
          label="Kiếm từ giới thiệu"
          value={formatNumber(summary.tongKiemTuGioiThieu)}
          accent="text-blue-300"
        />
        <SummaryCard
          label="Nhận phúc lợi"
          value={formatNumber(summary.tongPhucLoi)}
          accent="text-green-300"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Thông tin tài khoản">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl bg-black/25 px-4 py-3">
              <p className="text-xs text-gray-500">Trạng thái VIP</p>
              <p className="mt-1 text-sm font-bold text-white">
                {user.vipStatus
                  ? user.vipPackageName || "Đang hoạt động"
                  : "Không có VIP"}
              </p>
            </div>
            <div className="rounded-2xl bg-black/25 px-4 py-3">
              <p className="text-xs text-gray-500">Hạn VIP</p>
              <p className="mt-1 text-sm font-bold text-white">
                {formatDate(user.vipExpiry)}
              </p>
            </div>
            <div className="rounded-2xl bg-black/25 px-4 py-3">
              <p className="text-xs text-gray-500">Xu mỗi phút VIP</p>
              <p className="mt-1 text-sm font-bold text-white">
                {formatNumber(user.vipCoinsPerMinute ?? 0)}
              </p>
            </div>
            <div className="rounded-2xl bg-black/25 px-4 py-3">
              <p className="text-xs text-gray-500">Cấp quà</p>
              <p className="mt-1 text-sm font-bold text-white">
                Cấp {formatNumber(user.giftLevel)}
              </p>
            </div>
            <div className="rounded-2xl bg-black/25 px-4 py-3">
              <p className="text-xs text-gray-500">Mã giới thiệu</p>
              <p className="mt-1 break-all text-sm font-bold text-white">
                {user.referralCode || "-"}
              </p>
            </div>
            <div className="rounded-2xl bg-black/25 px-4 py-3">
              <p className="text-xs text-gray-500">Số lượt giới thiệu</p>
              <p className="mt-1 text-sm font-bold text-white">
                {formatNumber(user.referralCount)}
              </p>
            </div>
            <div className="rounded-2xl bg-black/25 px-4 py-3">
              <p className="text-xs text-gray-500">Mua gói bậc</p>
              <p className="mt-1 text-sm font-bold text-white">
                {formatNumber(summary.tongLanMuaVip)} lần
              </p>
            </div>
            <div className="rounded-2xl bg-black/25 px-4 py-3">
              <p className="text-xs text-gray-500">IP gần nhất</p>
              <p className="mt-1 break-all text-sm font-bold text-white">
                {user.lastLoginIp || "-"}
              </p>
            </div>
            <div className="rounded-2xl bg-black/25 px-4 py-3">
              <p className="text-xs text-gray-500">Đăng nhập gần nhất</p>
              <p className="mt-1 text-sm font-bold text-white">
                {formatDate(user.lastLoginAt)}
              </p>
            </div>
            <div className="rounded-2xl bg-black/25 px-4 py-3 md:col-span-2 xl:col-span-1">
              <p className="text-xs text-gray-500">Thiết bị gần nhất</p>
              <p className="mt-1 line-clamp-3 text-sm font-bold text-white/85">
                {user.lastLoginUserAgent || "-"}
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Chỉ số hoạt động">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl bg-black/25 px-4 py-3">
              <div className="flex items-center gap-2 text-white">
                <Wallet size={16} />
                <p className="text-sm font-bold">Nạp và giao dịch</p>
              </div>
              <p className="mt-2 text-sm text-gray-400">
                Nạp: {formatNumber(summary.tongNap)} · Tặng:{" "}
                {formatNumber(summary.tongTangXu)} · Nhận:{" "}
                {formatNumber(summary.tongNhanXu)}
              </p>
            </div>
            <div className="rounded-2xl bg-black/25 px-4 py-3">
              <div className="flex items-center gap-2 text-white">
                <Gift size={16} />
                <p className="text-sm font-bold">Phúc lợi và hộp quà</p>
              </div>
              <p className="mt-2 text-sm text-gray-400">
                Phúc lợi: {formatNumber(summary.tongLuotNhanPhucLoi)} lượt · Mở
                hộp: {formatNumber(summary.tongLanMoHopQua)} lượt
              </p>
            </div>
            <div className="rounded-2xl bg-black/25 px-4 py-3">
              <div className="flex items-center gap-2 text-white">
                <Tv size={16} />
                <p className="text-sm font-bold">Xem phim</p>
              </div>
              <p className="mt-2 text-sm text-gray-400">
                Lịch sử xem gần đây: {formatNumber(summary.tongLanXemGanDay)}{" "}
                mục
              </p>
            </div>
            <div className="rounded-2xl bg-black/25 px-4 py-3">
              <div className="flex items-center gap-2 text-white">
                <Shield size={16} />
                <p className="text-sm font-bold">Giới thiệu</p>
              </div>
              <p className="mt-2 text-sm text-gray-400">
                Log giới thiệu: {formatNumber(summary.tongLuotGioiThieu)}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Lịch sử giao dịch xu">
        <div className="overflow-hidden rounded-2xl border border-white/6">
          <div className="hidden grid-cols-[1.1fr_0.7fr_0.6fr_0.9fr] gap-3 bg-black/40 px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-500 md:grid">
            <div>Nội dung</div>
            <div>Loại</div>
            <div>Số xu</div>
            <div>Thời gian</div>
          </div>
          {transactionPreview.length === 0 ? (
            <div className="px-4 py-5 text-sm text-gray-400">
              Chưa có giao dịch.
            </div>
          ) : (
            transactionPreview.map((item) => (
              <div key={item._id}>
                <div className="hidden grid-cols-[1.1fr_0.7fr_0.6fr_0.9fr] gap-3 border-t border-white/6 px-4 py-3 text-sm text-white/85 md:grid">
                  <div>
                    <p className="font-semibold text-white">
                      {item.description}
                    </p>
                  </div>
                  <div className="text-gray-400">{item.type}</div>
                  <div
                    className={
                      item.direction === "credit"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }
                  >
                    {item.direction === "credit" ? "+" : "-"}
                    {formatNumber(item.amount)}
                  </div>
                  <div className="text-gray-400">
                    {formatDate(item.createdAt)}
                  </div>
                </div>
                <div className="border-t border-white/6 px-4 py-3 text-sm md:hidden">
                  <p className="font-semibold text-white">{item.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                    <span>{item.type}</span>
                    <span>•</span>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                  <p
                    className={`mt-2 font-bold ${
                      item.direction === "credit"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {item.direction === "credit" ? "+" : "-"}
                    {formatNumber(item.amount)} xu
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <PaginationControls
          page={data.pagination.transactions.page}
          totalPages={data.pagination.transactions.totalPages}
          onPageChange={(page) => updateActivityPage("transactions", page)}
        />
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Lịch sử mua gói bậc">
          <div className="space-y-3">
            {activities.vipLogs.length === 0 ? (
              <p className="text-sm text-gray-400">
                Chưa có lịch sử mua gói bậc.
              </p>
            ) : (
              activities.vipLogs.map((item) => (
                <div
                  key={item._id}
                  className="rounded-2xl bg-black/25 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-white">{item.packageName}</p>
                      <p className="mt-1 text-sm text-gray-400">
                        {item.days} ngày · {formatNumber(item.coinsPerMinute)}{" "}
                        xu/phút · Bậc hộp quà {formatNumber(item.giftRank)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-300">
                        {formatNumber(item.coinsPaid)} xu
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <PaginationControls
            page={data.pagination.vipLogs.page}
            totalPages={data.pagination.vipLogs.totalPages}
            onPageChange={(page) => updateActivityPage("vipLogs", page)}
          />
        </SectionCard>

        <SectionCard title="Lịch sử hộp quà">
          <div className="space-y-3">
            {activities.giftLogs.length === 0 ? (
              <p className="text-sm text-gray-400">Chưa có lịch sử hộp quà.</p>
            ) : (
              activities.giftLogs.map((item) => (
                <div
                  key={item._id}
                  className="rounded-2xl bg-black/25 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-white">
                        Cấp {item.giftLevel} · Rank {item.rank}
                      </p>
                      <p className="mt-1 text-sm text-gray-400">
                        Nhận {formatNumber(item.coinsEarned)} xu ·{" "}
                        {formatNumber(item.expEarned)} EXP
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">
                        {item.leveledUp ? "Có tăng cấp" : "Không tăng cấp"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <PaginationControls
            page={data.pagination.giftLogs.page}
            totalPages={data.pagination.giftLogs.totalPages}
            onPageChange={(page) => updateActivityPage("giftLogs", page)}
          />
        </SectionCard>

        <SectionCard title="Lịch sử phúc lợi">
          <div className="space-y-3">
            {activities.welfareClaims.length === 0 ? (
              <p className="text-sm text-gray-400">Chưa có lịch sử phúc lợi.</p>
            ) : (
              activities.welfareClaims.map((item) => (
                <div
                  key={item._id}
                  className="rounded-2xl bg-black/25 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-white">{item.actionType}</p>
                      <p className="mt-1 text-sm text-gray-400">
                        Mã nhiệm vụ: {item.taskId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-400">
                        +{formatNumber(item.reward)} xu
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <PaginationControls
            page={data.pagination.welfareClaims.page}
            totalPages={data.pagination.welfareClaims.totalPages}
            onPageChange={(page) => updateActivityPage("welfareClaims", page)}
          />
        </SectionCard>

        <SectionCard title="Lịch sử giới thiệu">
          <div className="space-y-3">
            {activities.referralLogs.length === 0 ? (
              <p className="text-sm text-gray-400">
                Chưa có lịch sử giới thiệu.
              </p>
            ) : (
              activities.referralLogs.map((item) => (
                <div
                  key={item._id}
                  className="rounded-2xl bg-black/25 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-white">
                        {item.referrerId === user._id
                          ? "Giới thiệu thành công"
                          : "Được giới thiệu"}
                      </p>
                      <p className="mt-1 text-sm text-gray-400">
                        Thưởng: {formatNumber(item.coinsAwarded)} xu
                        {item.bonusAwarded > 0
                          ? ` · Bonus ${formatNumber(item.bonusAwarded)} xu`
                          : ""}
                      </p>
                      {item.milestone && (
                        <p className="mt-1 text-xs text-gray-500">
                          Mốc: {item.milestone}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <PaginationControls
            page={data.pagination.referralLogs.page}
            totalPages={data.pagination.referralLogs.totalPages}
            onPageChange={(page) => updateActivityPage("referralLogs", page)}
          />
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Lịch sử xem phim gần đây">
          <div className="space-y-3">
            {activities.watchHistory.length === 0 ? (
              <p className="text-sm text-gray-400">Chưa có lịch sử xem phim.</p>
            ) : (
              activities.watchHistory.map((item) => (
                <div
                  key={item._id}
                  className="rounded-2xl bg-black/25 px-4 py-3"
                >
                  <p className="font-bold text-white">
                    {item.name || item.origin_name || "Không rõ tên phim"}
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    Tập: {item.episode || "-"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatDate(item.watchedAt)}
                  </p>
                </div>
              ))
            )}
          </div>
          <PaginationControls
            page={data.pagination.watchHistory.page}
            totalPages={data.pagination.watchHistory.totalPages}
            onPageChange={(page) => updateActivityPage("watchHistory", page)}
          />
        </SectionCard>

        <SectionCard title="Lịch sử nhận xu từ xem phim">
          <div className="space-y-3">
            {activities.coinLogs.length === 0 ? (
              <p className="text-sm text-gray-400">
                Chưa có log nhận xu từ xem phim.
              </p>
            ) : (
              activities.coinLogs.map((item) => (
                <div
                  key={item._id}
                  className="rounded-2xl bg-black/25 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-white">
                        Episode ID: {item.episodeId}
                      </p>
                      <p className="mt-1 text-sm text-gray-400">
                        Mốc phút: {item.minuteIndex}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-yellow-300">
                        +{formatNumber(item.amount)} xu
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <PaginationControls
            page={data.pagination.coinLogs.page}
            totalPages={data.pagination.coinLogs.totalPages}
            onPageChange={(page) => updateActivityPage("coinLogs", page)}
          />
        </SectionCard>
      </div>

      <EditUserModal
        open={editOpen}
        user={user}
        onClose={() => setEditOpen(false)}
        onSaved={() => setRefreshKey((current) => current + 1)}
      />
    </div>
  );
}
