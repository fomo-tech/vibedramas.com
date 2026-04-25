import LikedPage from "@/components/home/LikedPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yêu Thích | Vibe Drama",
  description: "Danh sách phim ngắn bạn đã thả tim và lưu lại.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LikedRoute() {
  return <LikedPage />;
}
