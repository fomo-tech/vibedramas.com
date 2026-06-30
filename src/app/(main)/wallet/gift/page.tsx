import GiftCoinsPage from "@/components/wallet/GiftCoinsPage";
import { buildPrivateMetadata } from "@/lib/seo";

export const metadata = buildPrivateMetadata(
  "Tặng Xu | Phim ngắn hay",
  "/wallet/gift",
);

export default function GiftCoinsRoute() {
  return <GiftCoinsPage />;
}
