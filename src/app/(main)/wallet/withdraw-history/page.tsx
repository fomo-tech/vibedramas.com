import WithdrawHistoryPage from "@/components/wallet/WithdrawHistoryPage";
import { buildPrivateMetadata } from "@/lib/seo";

export const metadata = buildPrivateMetadata(
  "Lịch Sử Rút Xu | Phim ngắn hay",
  "/wallet/withdraw-history",
);

export default function WithdrawHistoryRoute() {
  return <WithdrawHistoryPage />;
}
