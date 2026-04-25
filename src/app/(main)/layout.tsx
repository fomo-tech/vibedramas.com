"use client";

import { Suspense, useEffect } from "react";
import dynamic from "next/dynamic";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import Sidebar from "@/components/home/Sidebar";
import MobileNav from "@/components/home/MobileNav";
import { useAuthStore } from "@/store/useAuthStore";

// Lazy load heavy components — deferred until after first paint
const LoginModal = dynamic(() => import("@/components/shared/LoginModal"), {
  ssr: false,
});
const GiftBox = dynamic(() => import("@/components/home/gift/GiftBox"), {
  ssr: false,
});
const ChatWidget = dynamic(() => import("@/components/chat/ChatWidget"), {
  ssr: false,
});

function MainAppLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openLoginModal } = useAuthStore();

  // Open login modal when redirected from a protected route
  useEffect(() => {
    const requireLogin = searchParams.get("require_login");
    if (requireLogin !== "1") return;

    openLoginModal();
    // Remove the query param from URL without reload
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.delete("require_login");
    const newUrl = pathname + (params.size ? `?${params}` : "");
    router.replace(newUrl, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const sidebarTab = pathname === "/foryou" ? "foryou" : "home";

  return (
    <div className="relative h-screen bg-black flex overflow-hidden">
      {/* Sidebar — PC only, fixed */}
      <Sidebar activeTab={sidebarTab} />

      {/* Main content area offset by sidebar on PC */}
      <div className="flex-1 lg:pl-56 xl:pl-72 h-dvh min-h-0 flex flex-col overflow-hidden">
        {children}
      </div>

      {/* Bottom nav — mobile only */}
      <MobileNav />

      {/* Lazy-loaded heavy widgets — load after first paint */}
      <GiftBox />
      <LoginModal />
      <ChatWidget />
    </div>
  );
}

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <MainAppLayoutInner>{children}</MainAppLayoutInner>
    </Suspense>
  );
}
