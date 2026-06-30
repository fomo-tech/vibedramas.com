import VipPage from "@/components/vip/VipPage";
import { buildPrivateMetadata } from "@/lib/seo";

export const metadata = buildPrivateMetadata(
  "Phần Thưởng Xem Phim | Phim ngắn hay",
  "/vip",
  "Xem phim, mở hộp nhận xu và tích lũy EXP để tự động lên cấp.",
);

export default function VipRoutePage() {
  return <VipPage />;
}
