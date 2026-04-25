import BackgroundDecor from "@/components/home/BackgroundDecor";
import FeedScroll from "@/components/home/FeedScroll";

export default function ForYouPage() {
  return (
    <div className="relative h-full flex-1 overflow-hidden">
      <BackgroundDecor />
      <FeedScroll />
    </div>
  );
}
