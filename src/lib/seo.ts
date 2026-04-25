import dbConnect from "@/lib/db";
import SeoConfig from "@/models/SeoConfig";

// Utility để lấy SEO config — gọi DB trực tiếp (tránh self-referencing HTTP fetch)
export async function getSeoConfig(page: string) {
  try {
    await dbConnect();
    const config = await SeoConfig.findOne({ page, isActive: true }).lean();
    return config || null;
  } catch (error) {
    console.error("Error fetching SEO config:", error);
    return null;
  }
}

// Default SEO config - Tập trung thị trường Việt Nam
export const DEFAULT_SEO = {
  title: "Vibe Drama - Xem Phim Ngắn Trung Quốc Hay, Phim Tổng Tài 2026",
  description:
    "Xem phim ngắn trung quốc, phim ngắn hay nhất 2026. Phim ngắn tổng tài, phim bộ hàn quốc, phim thái hay. Cập nhật liên tục, chất lượng HD, miễn phí tại Vibe Drama.",
  keywords: [
    "phim ngắn",
    "phim ngắn trung quốc",
    "xem phim ngắn",
    "phim ngắn hay",
    "phim ngắn tổng tài",
    "phim ngắn trung quốc hay",
    "phim bộ",
    "phim trung quốc",
    "phim hàn quốc",
    "phim thái lan",
    "xem phim miễn phí",
    "phim hay 2026",
    "phim tài phiệt",
    "phim lý tưởng",
    "phim hd",
  ],
  ogImage: "/icons/og-image.png", // Custom OG image with VD logo
  ogType: "website",
  twitterCard: "summary_large_image",
  canonicalUrl: "/",
  author: "Vibe Drama",
  siteName: "Vibe Drama",
};

type SeoMetadataConfig = {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  canonicalUrl?: string;
  author?: string;
  siteName?: string;
  publishedTime?: string;
  modifiedTime?: string;
};

export const DEFAULT_SITE_URL = "https://vibedramas.com";

function isLocalHost(hostname: string) {
  const host = hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

function normalizeUrlCandidate(value: string) {
  const normalized = value.trim().replace(/\/+$/, "");

  if (!normalized) return null;

  const withProtocol = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(normalized)
    ? normalized
    : `https://${normalized}`;

  try {
    const parsed = new URL(withProtocol);
    if (isLocalHost(parsed.hostname)) return null;
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

export function resolveSiteUrl(): string {
  // In production, always use production URL (ignore localhost in env vars)
  if (process.env.NODE_ENV === "production") {
    const productionCandidates = [
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.APP_URL,
    ].filter((url) => url && !url.includes("localhost"));

    for (const candidate of productionCandidates) {
      if (!candidate) continue;
      const normalized = normalizeUrlCandidate(candidate);
      if (normalized) return normalized;
    }

    // Fallback to default production URL
    return DEFAULT_SITE_URL;
  }

  // In development, allow localhost
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
    DEFAULT_SITE_URL,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const normalized = normalizeUrlCandidate(candidate);
    if (normalized) return normalized;
  }

  return DEFAULT_SITE_URL;
}

export function buildMetadata(config: SeoMetadataConfig | null = null) {
  const seo: SeoMetadataConfig = { ...DEFAULT_SEO, ...config };
  const siteUrl = resolveSiteUrl();
  const metadataBase = new URL(siteUrl);
  const canonical = seo.canonicalUrl || "/";
  const ogImage = seo.ogImage || DEFAULT_SEO.ogImage;
  const fullImageUrl = ogImage.startsWith("http")
    ? ogImage
    : `${siteUrl}${ogImage}`;

  return {
    metadataBase,
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords || DEFAULT_SEO.keywords,
    authors: seo.author
      ? [{ name: seo.author }]
      : [{ name: DEFAULT_SEO.author }],
    creator: seo.author || DEFAULT_SEO.author,
    publisher: seo.siteName || DEFAULT_SEO.siteName,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    } as any,
    openGraph: {
      title: seo.title,
      description: seo.description,
      type: (seo.ogType as any) || "website",
      url: canonical,
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: seo.title,
        },
      ],
      siteName: seo.siteName || DEFAULT_SEO.siteName,
      locale: "vi_VN",
      ...(seo.publishedTime && { publishedTime: seo.publishedTime }),
      ...(seo.modifiedTime && { modifiedTime: seo.modifiedTime }),
    },
    twitter: {
      card: (seo.twitterCard as any) || "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [fullImageUrl],
      creator: "@vibedramas",
      site: "@vibedramas",
    },
    alternates: {
      canonical,
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
  };
}

// Generate Organization Schema for Google
export function generateOrganizationSchema() {
  const siteUrl = resolveSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Vibe Drama",
    alternateName: "Vibe Drama Việt",
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/icons/icon-512.png`,
      width: 512,
      height: 512,
    },
    sameAs: [
      "https://facebook.com/vibedramas",
      "https://tiktok.com/@vibedramas",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "hỗ trợ khách hàng",
      email: "support@vibedramas.com",
    },
  };
}

// Generate WebSite Schema for sitelinks searchbox
export function generateWebSiteSchema() {
  const siteUrl = resolveSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Vibe Drama",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// Generate BreadcrumbList Schema
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
) {
  const siteUrl = resolveSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${siteUrl}${item.url}`,
    })),
  };
}
