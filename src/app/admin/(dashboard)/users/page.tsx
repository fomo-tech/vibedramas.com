"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Coins,
  Crown,
  Search,
  Users,
} from "lucide-react";

interface UserStats {
  coinLogsCount: number;
  welfareClaimsCount: number;
  referralCount: number;
}

interface ListUser {
  _id: string;
  username: string;
  email: string;
  coins: number;
  vipStatus: boolean;
  referralCount: number;
  lastLoginIp?: string;
  lastLoginAt?: string;
  stats: UserStats;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ListUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/users?page=${page}`);
        const data = await res.json();
        setUsers(Array.isArray(data?.users) ? data.users : []);
        setTotalPages(
          typeof data?.totalPages === "number" && data.totalPages > 0
            ? data.totalPages
            : 1,
        );
      } catch {
        setUsers([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [page]);

  const keyword = search.trim().toLowerCase();
  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(keyword) ||
      user.email.toLowerCase().includes(keyword),
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white">
          Quản lý người dùng
        </h1>
        <p className="mt-2 text-gray-400">
          Danh sách tài khoản và điều hướng tới trang chi tiết riêng cho từng
          user.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 text-gray-500" size={18} />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm theo tên hoặc email"
          className="w-full rounded-xl border border-gray-700 bg-gray-800 py-2.5 pl-10 pr-4 text-white placeholder:text-gray-500 focus:border-red-500 focus:outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-800 bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-800 bg-gray-950 text-gray-400">
              <tr>
                <th className="px-4 py-4 text-left font-semibold sm:px-6">
                  Người dùng
                </th>
                <th className="px-4 py-4 text-left font-semibold sm:px-6">
                  Số dư xu
                </th>
                <th className="px-4 py-4 text-left font-semibold sm:px-6">
                  VIP
                </th>
                <th className="hidden px-4 py-4 text-left font-semibold lg:table-cell sm:px-6">
                  Giới thiệu
                </th>
                <th className="hidden px-4 py-4 text-left font-semibold xl:table-cell sm:px-6">
                  IP gần nhất
                </th>
                <th className="hidden px-4 py-4 text-left font-semibold 2xl:table-cell sm:px-6">
                  Hoạt động
                </th>
                <th className="px-4 py-4 text-left font-semibold sm:px-6">
                  Chi tiết
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    Đang tải dữ liệu người dùng...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    Không tìm thấy người dùng.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-white/2 transition-colors"
                  >
                    <td className="px-4 py-4 sm:px-6">
                      <div>
                        <p className="font-semibold text-white">
                          {user.username}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {user.email}
                        </p>
                        {user.lastLoginIp ? (
                          <p className="mt-1 text-xs text-gray-500 xl:hidden">
                            IP: {user.lastLoginIp}
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <div className="flex items-center gap-2 text-white">
                        <Coins size={16} className="text-yellow-400" />
                        <span className="font-semibold">
                          {user.coins.toLocaleString("vi-VN")}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      {user.vipStatus ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/15 px-2.5 py-1 text-xs font-semibold text-purple-300">
                          <Crown size={12} />
                          Đang hoạt động
                        </span>
                      ) : (
                        <span className="text-gray-500">Không có</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-4 lg:table-cell sm:px-6">
                      <div className="flex items-center gap-2 text-white">
                        <Users size={16} className="text-sky-400" />
                        <span>{user.referralCount}</span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-4 text-xs text-gray-400 xl:table-cell sm:px-6">
                      <div className="space-y-1">
                        <p className="break-all text-white/80">
                          {user.lastLoginIp || "-"}
                        </p>
                        <p>
                          {user.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleString("vi-VN")
                            : "Chưa có"}
                        </p>
                      </div>
                    </td>
                    <td className="hidden px-4 py-4 text-xs text-gray-400 2xl:table-cell sm:px-6">
                      <div className="space-y-1">
                        <p>Xem phim: {user.stats.coinLogsCount}</p>
                        <p>Phúc lợi: {user.stats.welfareClaimsCount}</p>
                        <p>Giới thiệu: {user.stats.referralCount}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <Link
                        href={`/admin/users/${user._id}`}
                        className="inline-flex rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20"
                      >
                        Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-gray-800 bg-gray-950 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-gray-700 disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              Trang trước
            </button>
            <span className="text-sm text-gray-400">
              Trang {page} / {totalPages}
            </span>
            <button
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={page === totalPages}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-gray-700 disabled:opacity-50"
            >
              Trang sau
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
