import { Metadata } from "next";
import { notFound } from "next/navigation";
import connectDB from "@/lib/db";
import Drama from "@/models/Drama";
import DramaDetailClient from "./DramaDetailClient";

interface Props {
  params: Promise<{ slug: string }>;
}

const SITE_NAME = "Vibe Drama";
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  "https://vibedramas.com"
)
  .trim()
  .replace(/\/+$/, "");
const CDN = "https://img.ophim.live/uploads/movies";

function stripHtml(input: string = ""): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getOgImage(thumb_url: string): string {
  if (!thumb_url) return `${SITE_URL}/icons/og-image.png`;
  if (thumb_url.startsWith("http")) return thumb_url;
  return `${CDN}/${thumb_url}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  await connectDB();
  const drama = await Drama.findOne({ slug }).lean<any>();
  if (!drama) return { title: "Không tìm thấy | Vibe Drama" };

  // Build titleHead: name - origin_name [quality-lang]
  const qualityTag = [drama.quality, drama.lang].filter(Boolean).join("-");
  const titleHead = [
    drama.name,
    drama.origin_name ? `${drama.origin_name}` : null,
    qualityTag ? `[${qualityTag}]` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const title = `${titleHead} | ${SITE_NAME}`;

  const plainDesc = stripHtml(drama.content || "").slice(0, 160);

  const description =
    plainDesc ||
    `Xem phim ${drama.name} vietsub full HD miễn phí trên ${SITE_NAME}.`;

  const ogImage = getOgImage(drama.thumb_url);
  const canonicalUrl = `${SITE_URL}/short/${slug}`;

  // Keywords: categories + countries + actors (first 5)
  const keywords = [
    ...(drama.category || []).map((c: any) => c.name),
    ...(drama.country || []).map((c: any) => c.name),
    ...(drama.actor || []).slice(0, 5),
    drama.name,
    drama.origin_name,
    "xem phim",
    "vietsub",
    "phim ngắn",
    SITE_NAME,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    keywords,
    robots: { index: true, follow: true },
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      type: "video.other",
      url: canonicalUrl,
      siteName: SITE_NAME,
      images: [
        {
          url: ogImage,
          width: 800,
          height: 450,
          alt: drama.name,
        },
      ],
      locale: "vi_VN",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    other: {},
  };
}

export const dynamic = "force-dynamic";

export default async function ShortPage({ params }: Props) {
  const { slug } = await params;

  // Only fetch minimal drama data for JSON-LD (SSR for SEO).
  // All feed data (drama detail + episodes) is fetched client-side in DramaDetailClient.
  await connectDB();
  const drama = await Drama.findOne(
    { slug },
    {
      _id: 1,
      slug: 1,
      name: 1,
      origin_name: 1,
      quality: 1,
      lang: 1,
      year: 1,
      content: 1,
      thumb_url: 1,
      poster_url: 1,
      episode_total: 1,
      episode_current: 1,
      type: 1,
      category: 1,
      actor: 1,
    },
  ).lean<any>();
  if (!drama) notFound();

  const qualityTag = [drama.quality, drama.lang].filter(Boolean).join("-");
  const titleHead = [
    drama.name,
    drama.origin_name || null,
    qualityTag ? `[${qualityTag}]` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const canonicalUrl = `${SITE_URL}/short/${slug}`;
  const description = stripHtml(drama.content || "").slice(0, 300);
  const firstCategory = (drama.category || [])[0] || null;

  const mediaSchema = {
    "@context": "https://schema.org",
    "@type": drama.type === "series" ? "TVSeries" : "Movie",
    name: titleHead,
    description,
    image: getOgImage(drama.thumb_url),
    url: canonicalUrl,
    datePublished: drama.year ? `${drama.year}-01-01` : undefined,
    actor: (drama.actor || [])
      .slice(0, 8)
      .map((name: string) => ({ "@type": "Person", name })),
    genre: (drama.category || []).map((c: any) => c.name),
    inLanguage: "vi",
  };

  const videoSchema = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: titleHead,
    description,
    thumbnailUrl: [getOgImage(drama.thumb_url)],
    uploadDate: drama.year ? `${drama.year}-01-01` : undefined,
    url: canonicalUrl,
    potentialAction: {
      "@type": "WatchAction",
      target: canonicalUrl,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Trang chu",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Tat ca phim",
        item: `${SITE_URL}/all`,
      },
      firstCategory
        ? {
            "@type": "ListItem",
            position: 3,
            name: firstCategory.name,
            item: `${SITE_URL}/category/${firstCategory.slug}`,
          }
        : null,
      {
        "@type": "ListItem",
        position: firstCategory ? 4 : 3,
        name: drama.name,
        item: canonicalUrl,
      },
    ].filter(Boolean),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([mediaSchema, videoSchema, breadcrumbSchema]),
        }}
      />
      <div className="h-full">
        <DramaDetailClient
          slug={slug}
          initialDrama={{
            _id: String(drama._id),
            slug: drama.slug,
            name: drama.name,
            origin_name: drama.origin_name,
            thumb_url: drama.thumb_url,
            poster_url: drama.poster_url,
            episode_total: drama.episode_total,
            episode_current: drama.episode_current,
            category: drama.category || [],
          }}
        />
      </div>
    </>
  );
}
