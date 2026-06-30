import ProfilePage from "@/components/home/ProfilePage";
import { buildPrivateMetadata } from "@/lib/seo";

export const metadata = buildPrivateMetadata(
  "Hồ Sơ Của Tôi | Phim ngắn hay",
  "/profile",
);

export default function ProfileRoute() {
  return <ProfilePage />;
}
