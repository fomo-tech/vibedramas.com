import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dbConnect from "@/lib/db";
import Drama from "@/models/Drama";
import { buildMetadata } from "@/lib/seo";
import { generateBreadcrumbSchema } from "@/lib/seoKeywords";
import AllDramasGrid from "@/components/home/AllDramasGrid";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Tag metadata mapping for SEO - Tập trung thị trường Việt Nam
const TAG_METADATA: Record<
  string,
  {
    title: string;
    description: string;
    keywords: string[];
  }
> = {
  "tong-tai": {
    title: "Phim Ngắn Tổng Tài - Xem Phim Tài Phiệt Trung Quốc Hay Nhất",
    description:
      "Phim ngắn tổng tài - Xem phim tài phiệt, phim tổng tài trung quốc hay nhất. Những câu chuyện về tycoon, nhà tài phiệt quyền lực giàu có. Cập nhật liên tục, chất lượng HD miễn phí tại Vibe Drama.",
    keywords: [
      "phim ngắn tổng tài",
      "phim tài phiệt",
      "phim tổng tài",
      "phim tài phiệt trung quốc",
      "phim tổng tài hay",
      "xem phim tổng tài",
    ],
  },
  "trung-quoc": {
    title: "Phim Ngắn Trung Quốc Hay - Xem Phim Trung Quốc HD 2026",
    description:
      "Phim ngắn trung quốc hay nhất - Xem phim trung quốc chất lượng HD miễn phí. Bộ phim trung quốc mới cập nhật liên tục. Phim bộ, phim ngắn trung quốc hot 2026 tại Vibe Drama.",
    keywords: [
      "phim ngắn trung quốc",
      "phim trung quốc hay",
      "phim ngắn trung quốc hay",
      "phim trung quốc 2026",
      "xem phim trung quốc",
    ],
  },
  "han-quoc": {
    title: "Phim Ngắn Hàn Quốc Hay - Xem Phim Hàn Quốc HD 2026",
    description:
      "Phim ngắn Hàn Quốc hay nhất 2026 - Xem phim Hàn Quốc chất lượng HD miễn phí. Phim bộ Hàn Quốc mới, phim ngắn Hàn hot cập nhật liên tục tại Vibe Drama.",
    keywords: [
      "phim ngắn hàn quốc",
      "phim hàn quốc hay",
      "phim ngắn hàn",
      "xem phim hàn quốc",
    ],
  },
  "thai-lan": {
    title: "Phim Ngắn Thái Lan Hay - Xem Phim Thái Lan HD 2026",
    description:
      "Phim ngắn Thái Lan hay nhất - Xem phim Thái Lan chất lượng HD miễn phí. Phim bộ Thái Lan, phim ngắn Thái hot cập nhật liên tục tại Vibe Drama.",
    keywords: ["phim ngắn thái lan", "phim thái lan hay", "xem phim thái lan"],
  },
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tagMeta = TAG_METADATA[slug];

  if (!tagMeta) {
    return {
      title: "Tag không tìm thấy",
    };
  }

  return buildMetadata({
    title: tagMeta.title,
    description: tagMeta.description,
    keywords: tagMeta.keywords,
    canonicalUrl: `/tag/${slug}`,
  });
}

// Generate static params for these tags
export async function generateStaticParams() {
  return Object.keys(TAG_METADATA).map((slug) => ({
    slug,
  }));
}

export default async function TagPage({ params }: PageProps) {
  const { slug } = await params;
  const tagMeta = TAG_METADATA[slug];

  if (!tagMeta) {
    notFound();
  }

  await dbConnect();

  // Map slug to category filter
  const categoryMap: Record<string, string> = {
    "tong-tai": "Tổng Tài",
    "trung-quoc": "Trung Quốc",
    "han-quoc": "Hàn Quốc",
    "thai-lan": "Thái Lan",
  };

  const categoryName = categoryMap[slug];
  const dramas = await Drama.find({
    category: { $elemMatch: { name: categoryName } },
  })
    .sort({ createdAt: -1, view: -1 })
    .limit(100)
    .lean();

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* SEO Heading */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {tagMeta.title.split(" - ")[0]}
          </h1>
          <p className="text-lg text-foreground/70">{tagMeta.description}</p>
        </div>

        {/* Dramas Grid */}
        {dramas.length > 0 ? (
          <AllDramasGrid dramas={dramas} />
        ) : (
          <div className="text-center py-12">
            <p className="text-foreground/60">
              Chưa có phim nào trong danh mục này.
            </p>
          </div>
        )}

        {/* Structured Data for Rich Results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: tagMeta.title,
              description: tagMeta.description,
              url: `https://vibedramas.com/tag/${slug}`,
              mainEntity: {
                "@type": "ItemList",
                itemListElement: dramas.slice(0, 10).map((drama, index) => ({
                  "@type": "ListItem",
                  position: index + 1,
                  name: drama.name,
                  url: `https://vibedramas.com/short/${drama.slug}`,
                  image: drama.poster_url,
                })),
              },
            }),
          }}
        />

        {/* Breadcrumb Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              generateBreadcrumbSchema(tagMeta.title.split(" - ")[0], slug),
            ),
          }}
        />
      </div>
    </main>
  );
}
