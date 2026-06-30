import SearchPage from "@/components/home/SearchPage";
import { buildPrivateMetadata } from "@/lib/seo";

export const metadata = buildPrivateMetadata(
  "Tìm Kiếm | Phim ngắn hay",
  "/search",
  "Tìm nhanh phim ngắn theo tên phim, diễn viên, nội dung, thể loại hoặc quốc gia.",
);

export default function SearchRoute() {
  return <SearchPage />;
}
