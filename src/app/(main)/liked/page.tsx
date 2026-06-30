import LikedPage from "@/components/home/LikedPage";
import { buildPrivateMetadata } from "@/lib/seo";

export const metadata = buildPrivateMetadata(
  "Yêu Thích | Phim ngắn hay",
  "/liked",
  "Danh sách phim ngắn bạn đã thả tim và lưu lại.",
);

export default function LikedRoute() {
  return <LikedPage />;
}
