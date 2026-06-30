import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mất Kết Nối | Phim ngắn hay",
  robots: { index: false, follow: false },
};

export default function OfflineLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
