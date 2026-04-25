import type { Metadata } from "next";
import { notFound } from "next/navigation";
import connectDB from "@/lib/db";
import Drama from "@/models/Drama";
import AllDramasClient from "@/components/home/AllDramasClient";

interface Props {
  params: Promise<{ slug: string }>;
}

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  "https://vibedramas.com"
)
  .trim()
  .replace(/\/+$/, "");

function titleize(text: string) {
  return text
    .split("-")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  await connectDB();

  const sample = await Drama.findOne({ "category.slug": slug })
    .select("category")
    .lean<any>();

  const categoryName =
    sample?.category?.find((c: any) => c.slug === slug)?.name || titleize(slug);

  const title = `${categoryName} - Phim Ngắn Mới Nhất | Vibe Drama`;
  const description = `Tổng hợp phim ngắn thể loại ${categoryName} vietsub, cập nhật liên tục trên Vibe Drama.`;
  const canonical = `${SITE_URL}/category/${slug}`;

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    keywords: [categoryName, "phim ngắn", "xem phim", "vietsub", "Vibe Drama"],
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName: "Vibe Drama",
      locale: "vi_VN",
      images: [{ url: "/og-image.jpg" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.jpg"],
    },
    robots: { index: true, follow: true },
  };
}

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  await connectDB();

  const dramas = await Drama.find({ "category.slug": slug })
    .select(
      "_id name slug poster_url thumb_url content type status category country year view createdAt",
    )
    .sort({ createdAt: -1 })
    .lean<any[]>();

  if (!dramas.length) notFound();

  const categoryName =
    dramas[0]?.category?.find((c: any) => c.slug === slug)?.name ||
    titleize(slug);

  return (
    <main className="h-full bg-black">
      <AllDramasClient
        dramas={JSON.parse(JSON.stringify(dramas))}
        pageTitle={`The Loai: ${categoryName}`}
        pageDescription={`Danh sach phim ngan thuoc the loai ${categoryName}.`}
        initialFilters={{ category: slug }}
      />
    </main>
  );
}
