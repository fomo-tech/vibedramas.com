import { buildMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import connectDB from "@/lib/db";
import Drama from "@/models/Drama";
import AllDramasClient from "@/components/home/AllDramasClient";

interface Props {
  params: Promise<{ slug: string }>;
}

function titleize(text: string) {
  return text
    .split("-")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: Props): Promise<any> {
  const { slug } = await params;
  await connectDB();

  const sample = await Drama.findOne({ "category.slug": slug })
    .select("category")
    .lean<any>();

  const categoryName =
    sample?.category?.find((c: any) => c.slug === slug)?.name || titleize(slug);

  const title = `${categoryName} - Phim Ngắn Mới Nhất | Phim ngắn hay`;
  const description = `Tổng hợp phim ngắn thể loại ${categoryName} vietsub, cập nhật liên tục trên Phim ngắn hay.`;

  return buildMetadata({
    title,
    description,
    keywords: [categoryName, "phim ngắn", "xem phim", "vietsub", "Phim ngắn hay"],
    canonicalUrl: `/category/${slug}`,
    ogImage: "/icons/og-image.png",
  });
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
        pageTitle={`Thể Loại: ${categoryName}`}
        pageDescription={`Danh sách phim ngắn thuộc thể loại ${categoryName}, cập nhật liên tục.`}
        initialFilters={{ category: slug }}
      />
    </main>
  );
}
