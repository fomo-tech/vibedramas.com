import WalletPage from "@/components/wallet/WalletPage";
import { buildPrivateMetadata } from "@/lib/seo";

export const metadata = buildPrivateMetadata(
  "Ví Của Tôi | Phim ngắn hay",
  "/wallet",
);

export default function WalletRoute() {
  return <WalletPage />;
}
