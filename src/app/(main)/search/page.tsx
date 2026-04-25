import SearchPage from "@/components/home/SearchPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tìm Kiếm | Vibe Drama",
  description:
    "Tìm nhanh phim ngắn theo tên phim, diễn viên, nội dung, thể loại hoặc quốc gia.",
  alternates: {
    canonical: "/search",
  },
};

export default function SearchRoute() {
  return <SearchPage />;
}
