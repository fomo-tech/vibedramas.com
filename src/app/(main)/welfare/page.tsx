import WelfareCenterPage from "@/components/welfare/WelfareCenterPage";
import { buildPrivateMetadata } from "@/lib/seo";

export const metadata = buildPrivateMetadata(
  "Trung Tâm Phúc Lợi | Phim ngắn hay",
  "/welfare",
);

export default function WelfareRoute() {
  return <WelfareCenterPage />;
}
