import WithdrawPage from "@/components/wallet/WithdrawPage";
import { buildPrivateMetadata } from "@/lib/seo";

export const metadata = buildPrivateMetadata(
  "Rút Tiền | Phim ngắn hay",
  "/wallet/withdraw",
);

export default function WithdrawRoute() {
  return <WithdrawPage />;
}
