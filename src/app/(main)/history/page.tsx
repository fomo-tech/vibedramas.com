import HistoryPage from "@/components/home/HistoryPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lịch Sử Xem | Vibe Drama",
  description: "Xem lại danh sách phim bạn đã theo dõi gần đây.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function HistoryRoute() {
  return <HistoryPage />;
}
