import ReferralPage from "@/components/home/ReferralPage";
import { buildPrivateMetadata } from "@/lib/seo";

export const metadata = buildPrivateMetadata(
  "Giới Thiệu Bạn Bè | Phim ngắn hay",
  "/referral",
);

export default function Page() {
  return <ReferralPage />;
}
