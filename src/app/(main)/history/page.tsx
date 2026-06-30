import HistoryPage from "@/components/home/HistoryPage";
import { buildPrivateMetadata } from "@/lib/seo";

export const metadata = buildPrivateMetadata(
  "Lịch Sử Xem | Phim ngắn hay",
  "/history",
  "Xem lại danh sách phim bạn đã theo dõi gần đây.",
);

export default function HistoryRoute() {
  return <HistoryPage />;
}
