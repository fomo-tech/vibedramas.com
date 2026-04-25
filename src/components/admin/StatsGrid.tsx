import {
  Film,
  PlayCircle,
  Users,
  UserPlus,
  ArrowDownCircle,
  ArrowUpCircle,
  Crown,
  TrendingUp,
  Clock,
  DollarSign,
} from "lucide-react";

interface StatsGridProps {
  totalDramas: number;
  totalEpisodes: number;
  totalUsers: number;
  newUsersToday: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  completedDepositsThisMonth: number;
  completedWithdrawalsThisMonth: number;
  totalDepositAmountThisMonth: number;
  totalWithdrawAmountThisMonth: number;
  activeVipUsers: number;
  vipSalesThisMonth: number;
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  sub,
  urgent,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bg: string;
  sub?: string;
  urgent?: boolean;
}) {
  return (
    <div
      className={`bg-gray-900 border rounded-2xl p-5 flex flex-col justify-between h-36 hover:border-gray-700 transition-colors group ${urgent ? "border-yellow-500/40" : "border-gray-800"}`}
    >
      <div className="flex justify-between items-start">
        <div className="min-w-0">
          <p className="text-gray-400 font-medium text-xs uppercase tracking-wider">
            {label}
          </p>
          <p className="text-3xl font-black text-white mt-1 group-hover:scale-105 transition-transform origin-left truncate">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        </div>
        <div className={`p-2.5 ${bg} ${color} rounded-xl shrink-0`}>
          <Icon size={20} />
        </div>
      </div>
      {sub && <p className="text-xs text-gray-600 mt-1 truncate">{sub}</p>}
    </div>
  );
}

export default function StatsGrid({
  totalDramas,
  totalEpisodes,
  totalUsers,
  newUsersToday,
  pendingDeposits,
  pendingWithdrawals,
  completedDepositsThisMonth,
  completedWithdrawalsThisMonth,
  totalDepositAmountThisMonth,
  totalWithdrawAmountThisMonth,
  activeVipUsers,
  vipSalesThisMonth,
}: StatsGridProps) {
  const formatMoney = (n: number) =>
    n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(1)}M₫`
      : n >= 1_000
        ? `${(n / 1_000).toFixed(0)}K₫`
        : `${n}₫`;

  return (
    <div className="space-y-4">
      {/* Content */}
      <div>
        <p className="text-xs text-gray-600 uppercase font-bold tracking-widest mb-3">
          Nội dung
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Tổng phim"
            value={totalDramas}
            icon={Film}
            color="text-red-500"
            bg="bg-red-500/10"
          />
          <StatCard
            label="Tổng tập"
            value={totalEpisodes}
            icon={PlayCircle}
            color="text-pink-500"
            bg="bg-pink-500/10"
          />
          <StatCard
            label="Người dùng"
            value={totalUsers}
            icon={Users}
            color="text-blue-500"
            bg="bg-blue-500/10"
          />
          <StatCard
            label="Đăng ký hôm nay"
            value={newUsersToday}
            icon={UserPlus}
            color="text-cyan-500"
            bg="bg-cyan-500/10"
            sub="so với tổng"
          />
        </div>
      </div>

      {/* Finance */}
      <div>
        <p className="text-xs text-gray-600 uppercase font-bold tracking-widest mb-3">
          Tài chính tháng này
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Nạp chờ duyệt"
            value={pendingDeposits}
            icon={Clock}
            color="text-yellow-500"
            bg="bg-yellow-500/10"
            urgent={pendingDeposits > 0}
          />
          <StatCard
            label="Rút chờ duyệt"
            value={pendingWithdrawals}
            icon={Clock}
            color="text-orange-500"
            bg="bg-orange-500/10"
            urgent={pendingWithdrawals > 0}
          />
          <StatCard
            label="Nạp thành công"
            value={completedDepositsThisMonth}
            icon={ArrowDownCircle}
            color="text-green-500"
            bg="bg-green-500/10"
            sub={`Tổng: ${formatMoney(totalDepositAmountThisMonth)}`}
          />
          <StatCard
            label="Rút thành công"
            value={completedWithdrawalsThisMonth}
            icon={ArrowUpCircle}
            color="text-rose-500"
            bg="bg-rose-500/10"
            sub={`Tổng: ${formatMoney(totalWithdrawAmountThisMonth)}`}
          />
        </div>
      </div>

      {/* VIP */}
      <div>
        <p className="text-xs text-gray-600 uppercase font-bold tracking-widest mb-3">
          VIP
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="VIP đang hoạt động"
            value={activeVipUsers}
            icon={Crown}
            color="text-yellow-400"
            bg="bg-yellow-400/10"
          />
          <StatCard
            label="Xu VIP tháng này"
            value={vipSalesThisMonth.toLocaleString()}
            icon={TrendingUp}
            color="text-purple-500"
            bg="bg-purple-500/10"
            sub="tổng coins tiêu vào VIP"
          />
        </div>
      </div>
    </div>
  );
}
