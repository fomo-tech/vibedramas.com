import TopupHistoryPage from "@/components/wallet/TopupHistoryPage";
import { buildPrivateMetadata } from "@/lib/seo";

export const metadata = buildPrivateMetadata(
  "Lịch Sử Nạp Xu | Phim ngắn hay",
  "/wallet/topup-history",
);

export default function TopupHistoryRoute() {
  return <TopupHistoryPage />;
}
