import SpendingHistoryPage from "@/components/wallet/SpendingHistoryPage";
import { buildPrivateMetadata } from "@/lib/seo";

export const metadata = buildPrivateMetadata(
  "Lịch Sử Tiêu Dùng | Phim ngắn hay",
  "/wallet/spending",
);

export default function SpendingHistoryRoute() {
  return <SpendingHistoryPage />;
}
