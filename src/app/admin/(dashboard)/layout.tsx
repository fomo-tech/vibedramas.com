"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAdmin } from "@/actions/authActions";
import {
  Crown,
  Film,
  Gift,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Shield,
  Users,
  Wallet,
  UserPlus,
  Settings,
  ChevronDown,
  ChevronRight,
  Sparkles,
  DollarSign,
  Banknote,
  Landmark,
  Search,
  Megaphone,
} from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [chatUnread, setChatUnread] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(false);

  // Auto-open settings if on a settings sub-page
  useEffect(() => {
    const settingsRoutes = [
      "/admin/vip",
      "/admin/topup-packages",
      "/admin/ranks",
      "/admin/welfare",
      "/admin/wallet",
      "/admin/seo-configs",
      "/admin/referral",
    ];
    if (settingsRoutes.some((route) => pathname.startsWith(route))) {
      setSettingsOpen(true);
    }

    const financeRoutes = [
      "/admin/deposits",
      "/admin/withdrawals",
      "/admin/bank-accounts",
    ];
    if (financeRoutes.some((route) => pathname.startsWith(route))) {
      setFinanceOpen(true);
    }
  }, [pathname]);

  // Fetch chat unread count
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/chat/admin/rooms");
        if (res.ok) {
          const rooms = await res.json();
          const total = rooms.reduce(
            (sum: number, r: { adminUnread?: number }) =>
              sum + (r.adminUnread || 0),
            0,
          );
          setChatUnread(total);
        }
      } catch {
        // Ignore errors
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 3000); // Poll every 3s for better responsiveness

    // Refetch when window regains focus
    const handleFocus = () => fetchUnread();
    window.addEventListener("focus", handleFocus);

    // Listen for custom event from chat page
    const handleChatUpdate = () => fetchUnread();
    window.addEventListener("chatUnreadUpdate", handleChatUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("chatUnreadUpdate", handleChatUpdate);
    };
  }, []);

  const mainMenuItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
    { href: "/admin/dramas", icon: Film, label: "Dramas" },
    { href: "/admin/hero-slides", icon: Sparkles, label: "Hero Slider" },
    { href: "/admin/ad-banner", icon: Megaphone, label: "Quảng cáo Feed" },
    { href: "/admin/users", icon: Users, label: "Users" },
    {
      href: "/admin/chat",
      icon: MessageCircle,
      label: "Live Chat",
      badge: chatUnread,
    },
  ];

  const financeMenuItems = [
    { href: "/admin/deposits", icon: DollarSign, label: "Quản lý Nạp" },
    { href: "/admin/withdrawals", icon: Banknote, label: "Quản lý Rút" },
    { href: "/admin/bank-accounts", icon: Landmark, label: "Cấu hình Sepay" },
  ];

  const settingsMenuItems = [
    { href: "/admin/vip", icon: Crown, label: "Gói bậc" },
    { href: "/admin/topup-packages", icon: DollarSign, label: "Gói nạp xu" },
    { href: "/admin/ranks", icon: Shield, label: "Bậc hộp quà" },
    { href: "/admin/welfare", icon: Gift, label: "Phúc lợi" },
    { href: "/admin/wallet", icon: Wallet, label: "Nạp Rút" },
    { href: "/admin/seo-configs", icon: Search, label: "Cấu hình SEO" },
    { href: "/admin/referral", icon: UserPlus, label: "Giới thiệu" },
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const isFinanceActive = financeMenuItems.some((item) =>
    pathname.startsWith(item.href),
  );

  const isSettingsActive = settingsMenuItems.some((item) =>
    pathname.startsWith(item.href),
  );

  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-950 border-r border-gray-800 hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-linear-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
            Vibe Admin
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          {/* Main menu items */}
          {mainMenuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                isActive(item.href, item.exact)
                  ? "bg-red-500/20 text-white border border-red-500/30"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <div className="flex items-center space-x-3">
                <item.icon size={20} />
                <span>{item.label}</span>
              </div>
              {item.badge && item.badge > 0 ? (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-5 text-center">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              ) : null}
            </Link>
          ))}

          {/* Finance collapsible menu */}
          <div>
            <button
              onClick={() => setFinanceOpen(!financeOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                isFinanceActive
                  ? "bg-red-500/20 text-white border border-red-500/30"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Wallet size={20} />
                <span>Nạp Rút</span>
              </div>
              {financeOpen ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>

            {/* Finance submenu */}
            {financeOpen && (
              <div className="mt-1 ml-4 space-y-1 border-l-2 border-gray-700 pl-2">
                {financeMenuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                      isActive(item.href)
                        ? "bg-red-500/10 text-white"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ) : null}
            </Link>
          ))}

          {/* Settings collapsible menu */}
          <div>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                isSettingsActive
                  ? "bg-red-500/20 text-white border border-red-500/30"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Settings size={20} />
                <span>Cài đặt</span>
              </div>
              {settingsOpen ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>

            {/* Settings submenu */}
            {settingsOpen && (
              <div className="mt-1 ml-4 space-y-1 border-l-2 border-gray-700 pl-2">
                {settingsMenuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                      isActive(item.href)
                        ? "bg-red-500/10 text-white"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <form action={logoutAdmin}>
            <button
              type="submit"
              className="flex w-full items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <header className="md:hidden bg-gray-950 p-4 border-b border-gray-800 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">Vibe Admin</h1>
          <form action={logoutAdmin}>
            <button type="submit" className="text-red-400">
              Logout
            </button>
          </form>
        </header>

        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
