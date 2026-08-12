import VipPage from "@/components/vip/VipPage";
import { buildPrivateMetadata } from "@/lib/seo";

export const metadata = buildPrivateMetadata(
  "Rạp Quà Phim Ngắn | Phim ngắn hay",
  "/reward-box",
  "Xem phim ngắn, tích thời gian, mở hộp nhận xu, EXP và quà Shopee.",
);

export default function RewardBoxRoutePage() {
  return <VipPage />;
}
