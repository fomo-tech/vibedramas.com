import type { Metadata } from "next";
import connectDB from "@/lib/db";
import Drama from "@/models/Drama";
import AllDramasClient from "@/components/home/AllDramasClient";
import { resolveSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const SITE_NAME = "Vibe Drama";
const CDN = "https://img.ophim.live/uploads/movies";

function resolveThumb(thumb_url: string, fallback: string): string {
  if (!thumb_url) return fallback;
  if (thumb_url.startsWith("http")) return thumb_url;
  return `${CDN}/${thumb_url}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = resolveSiteUrl();
  const canonicalUrl = `${siteUrl}/short`;
  const fallbackOg = `${siteUrl}/icons/og-image.png`;

  // Dùng thumbnail của drama nổi bật nhất làm OG image
  await connectDB();
  const featured = await Drama.findOne(
    { thumb_url: { $exists: true, $ne: "" } },
    { thumb_url: 1 },
  )
    .sort({ view: -1 })
    .lean<{ thumb_url?: string }>();

  const ogImage = resolveThumb(featured?.thumb_url ?? "", fallbackOg);

  const title =
    "Phim Ngắn Trung Quốc Hay Nhất 2026 - Phim Ngắn Tổng Tài, Cổ Trang | Vibe Drama";
  const description =
    "Xem phim ngắn trung quốc hay nhất 2026 miễn phí. Phim ngắn tổng tài, phim ngắn cổ trang, phim ngắn hay vietsub full HD. Cập nhật liên tục tại Vibe Drama.";

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    keywords: [
      // Core - volume cao nhất
      "phim ngắn trung quốc",
      "phim ngắn hay",
      "phim ngắn tổng tài",
      "phim ngắn cổ trang",
      // Long-tail cụ thể
      "phim ngắn trung quốc hay nhất 2026",
      "phim ngắn tổng tài vietsub",
      "phim ngắn cổ trang trung quốc vietsub",
      "phim ngắn tổng tài hay",
      "phim ngắn cổ trang hay",
      "xem phim ngắn trung quốc",
      "xem phim ngắn tổng tài",
      "phim ngắn trung quốc vietsub full hd",
      // Broad
      "phim ngắn",
      "xem phim ngắn",
      "phim ngắn vietsub",
      "phim ngắn online",
      "phim ngắn hd",
      "xem phim ngắn miễn phí",
      SITE_NAME,
    ],
    robots: { index: true, follow: true },
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: "vi_VN",
      images: [
        {
          url: ogImage,
          width: 800,
          height: 450,
          alt: "Phim Ngắn Trung Quốc Hay - Vibe Drama",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title:
        "Phim Ngắn Trung Quốc Hay Nhất 2026 - Tổng Tài, Cổ Trang | Vibe Drama",
      description:
        "Xem phim ngắn trung quốc, phim ngắn tổng tài, phim ngắn cổ trang hay nhất 2026. Vietsub full HD miễn phí.",
      images: [ogImage],
    },
  };
}

export default async function ShortListPage() {
  await connectDB();

  const dramas = await Drama.find()
    .select(
      "_id name slug poster_url thumb_url content type status category country year view createdAt",
    )
    .sort({ createdAt: -1 })
    .lean();

  const serializedDramas = JSON.parse(JSON.stringify(dramas));

  return (
    <main className="h-full bg-black">
      <AllDramasClient
        dramas={serializedDramas}
        pageTitle="Phim Ngắn Trung Quốc"
        pageDescription="Xem phim ngắn trung quốc hay nhất, phim ngắn tổng tài, phim ngắn cổ trang vietsub full HD miễn phí"
      />
    </main>
  );
}
