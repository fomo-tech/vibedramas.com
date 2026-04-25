import connectDB from "@/lib/db";
import Drama from "@/models/Drama";
import Episode from "@/models/Episode";
import User from "@/models/User";
import DepositOrder from "@/models/DepositOrder";
import WithdrawRequest from "@/models/WithdrawRequest";
import VipLog from "@/models/VipLog";
import CoinLog from "@/models/CoinLog";
import { getCache, setCache } from "@/lib/cache";
import StatsGrid from "@/components/admin/StatsGrid";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const CACHE_KEY = "admin:stats:v2";

  let stats = await getCache<{
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
    latestDramas: any[];
    pendingDepositList: any[];
    pendingWithdrawList: any[];
  }>(CACHE_KEY);

  if (!stats) {
    await connectDB();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const [
      totalDramas,
      totalEpisodes,
      totalUsers,
      newUsersToday,
      pendingDeposits,
      pendingWithdrawals,
      completedDepositsThisMonth,
      completedWithdrawalsThisMonth,
      depositAggThisMonth,
      withdrawAggThisMonth,
      activeVipUsers,
      vipSalesThisMonth,
      latestDramas,
      pendingDepositList,
      pendingWithdrawList,
    ] = await Promise.all([
      Drama.countDocuments(),
      Episode.countDocuments(),
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startOfToday } }),
      DepositOrder.countDocuments({ status: "pending" }),
      WithdrawRequest.countDocuments({ status: "pending" }),
      DepositOrder.countDocuments({
        status: "completed",
        completedAt: { $gte: startOfMonth },
      }),
      WithdrawRequest.countDocuments({
        status: "completed",
        updatedAt: { $gte: startOfMonth },
      }),
      DepositOrder.aggregate([
        {
          $match: { status: "completed", completedAt: { $gte: startOfMonth } },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      WithdrawRequest.aggregate([
        { $match: { status: "completed", updatedAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      User.countDocuments({ vipExpiry: { $gte: now } }),
      VipLog.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$coinsPaid" } } },
      ]),
      Drama.find().sort({ createdAt: -1 }).limit(5).lean(),
      DepositOrder.find({ status: "pending" })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("userId", "name username")
        .lean(),
      WithdrawRequest.find({ status: "pending" })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("userId", "name username")
        .lean(),
    ]);

    stats = {
      totalDramas,
      totalEpisodes,
      totalUsers,
      newUsersToday,
      pendingDeposits,
      pendingWithdrawals,
      completedDepositsThisMonth,
      completedWithdrawalsThisMonth,
      totalDepositAmountThisMonth: depositAggThisMonth[0]?.total ?? 0,
      totalWithdrawAmountThisMonth: withdrawAggThisMonth[0]?.total ?? 0,
      activeVipUsers,
      vipSalesThisMonth: vipSalesThisMonth[0]?.total ?? 0,
      latestDramas,
      pendingDepositList,
      pendingWithdrawList,
    };
    await setCache(CACHE_KEY, stats, 300);
  }

  const {
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
    latestDramas,
    pendingDepositList,
    pendingWithdrawList,
  } = stats;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-gray-400 mt-2 font-medium">
            Giám sát các chỉ số của Vibe Drama.
          </p>
        </div>
        <div className="text-xs text-gray-500 bg-gray-950 px-3 py-1.5 rounded-full border border-gray-800">
          Cập nhật mỗi 5 phút
        </div>
      </div>

      <StatsGrid
        totalDramas={totalDramas}
        totalEpisodes={totalEpisodes}
        totalUsers={totalUsers}
        newUsersToday={newUsersToday}
        pendingDeposits={pendingDeposits}
        pendingWithdrawals={pendingWithdrawals}
        completedDepositsThisMonth={completedDepositsThisMonth}
        completedWithdrawalsThisMonth={completedWithdrawalsThisMonth}
        totalDepositAmountThisMonth={totalDepositAmountThisMonth}
        totalWithdrawAmountThisMonth={totalWithdrawAmountThisMonth}
        activeVipUsers={activeVipUsers}
        vipSalesThisMonth={vipSalesThisMonth}
      />

      {/* Pending Actions */}
      {(pendingDepositList.length > 0 || pendingWithdrawList.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Deposits */}
          <div className="bg-gray-900 border border-yellow-500/20 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                <h2 className="text-base font-bold text-white">
                  Nạp tiền chờ duyệt
                </h2>
              </div>
              <span className="text-xs font-black text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full">
                {pendingDeposits}
              </span>
            </div>
            <div className="divide-y divide-gray-800/50">
              {pendingDepositList.map((d: any) => (
                <div
                  key={d._id.toString()}
                  className="px-5 py-3 flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="text-white font-bold">
                      {(d.userId as any)?.name ??
                        (d.userId as any)?.username ??
                        "N/A"}
                    </p>
                    <p className="text-gray-500 text-xs">{d.orderCode}</p>
                  </div>
                  <span className="text-green-400 font-black">
                    +{d.amount?.toLocaleString()}₫
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Withdrawals */}
          <div className="bg-gray-900 border border-red-500/20 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <h2 className="text-base font-bold text-white">
                  Rút tiền chờ duyệt
                </h2>
              </div>
              <span className="text-xs font-black text-red-400 bg-red-400/10 px-2 py-1 rounded-full">
                {pendingWithdrawals}
              </span>
            </div>
            <div className="divide-y divide-gray-800/50">
              {pendingWithdrawList.map((w: any) => (
                <div
                  key={w._id.toString()}
                  className="px-5 py-3 flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="text-white font-bold">
                      {(w.userId as any)?.name ??
                        (w.userId as any)?.username ??
                        "N/A"}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {w.bankName} · {w.bankAccount}
                    </p>
                  </div>
                  <span className="text-red-400 font-black">
                    -{w.amount?.toLocaleString()}₫
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Latest Dramas */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            Phim mới thêm gần đây
          </h2>
          <a
            href="/admin/dramas"
            className="text-sm font-bold text-red-500 hover:text-red-400 transition-colors uppercase tracking-widest"
          >
            Xem tất cả
          </a>
        </div>
        <div className="divide-y divide-gray-800">
          {latestDramas.map((drama: any) => (
            <div
              key={drama._id.toString()}
              className="p-6 flex items-center space-x-6 hover:bg-gray-800/30 transition-colors group"
            >
              <img
                src={drama.thumb_url}
                alt={drama.name}
                className="w-16 h-24 object-cover rounded-xl bg-gray-800 shadow-md group-hover:scale-105 transition-transform"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white truncate group-hover:text-red-400 transition-colors uppercase tracking-tight">
                  {drama.name}
                </h3>
                <p className="text-sm text-gray-500 truncate mt-0.5">
                  {drama.origin_name || "N/A"}
                </p>
                <div className="flex items-center space-x-4 mt-3 text-xs">
                  <span className="bg-red-500/10 text-red-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider border border-red-500/10">
                    {drama.status}
                  </span>
                  <span className="text-gray-500 font-medium">
                    {drama.year}
                  </span>
                  <span className="text-gray-500 font-medium">
                    {drama.quality}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {latestDramas.length === 0 && (
            <div className="p-16 text-center text-gray-600 font-medium italic">
              Database trống. Hãy thêm phim mới!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
