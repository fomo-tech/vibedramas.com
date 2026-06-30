import TopupPage from "@/components/wallet/TopupPage";
import { buildPrivateMetadata } from "@/lib/seo";

export const metadata = buildPrivateMetadata(
  "Nạp Xu | Phim ngắn hay",
  "/wallet/topup",
  "Nạp xu vào ví tài khoản Phim ngắn hay.",
);

export default function Page() {
  return <TopupPage />;
}
