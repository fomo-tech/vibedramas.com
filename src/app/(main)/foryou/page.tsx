import BackgroundDecor from "@/components/home/BackgroundDecor";
import FeedScroll from "@/components/home/FeedScroll";
import { buildPrivateMetadata } from "@/lib/seo";

export const metadata = buildPrivateMetadata(
  "Dành Cho Bạn | Phim ngắn hay",
  "/foryou",
);

export default function ForYouPage() {
  return (
    <div className="relative h-full flex-1 overflow-hidden">
      <BackgroundDecor />
      <FeedScroll />
    </div>
  );
}
