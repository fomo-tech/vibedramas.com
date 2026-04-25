import type { MetadataRoute } from "next";
import connectDB from "@/lib/db";
import Drama from "@/models/Drama";
import { resolveSiteUrl } from "@/lib/seo";

type DramaTaxonomy = { slug: string };
type DramaSitemapDoc = {
  slug: string;
  updatedAt?: Date;
  category?: DramaTaxonomy[];
  country?: DramaTaxonomy[];
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = resolveSiteUrl();

  // Keyword-targeted tag pages for better SEO
  const tagRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/tag/tong-tai`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${siteUrl}/tag/trung-quoc`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${siteUrl}/tag/han-quoc`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/tag/thai-lan`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/all`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/foryou`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/vip`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  try {
    await connectDB();
    const dramas = await Drama.find({ slug: { $exists: true, $ne: "" } })
      .select("slug updatedAt category country")
      .sort({ updatedAt: -1 })
      .limit(5000)
      .lean();

    const dramaRoutes: MetadataRoute.Sitemap = (
      dramas as DramaSitemapDoc[]
    ).map((drama) => ({
      url: `${siteUrl}/short/${drama.slug}`,
      lastModified: drama.updatedAt ? new Date(drama.updatedAt) : new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    }));

    const categorySlugs = new Set<string>();
    const countrySlugs = new Set<string>();

    for (const drama of dramas as DramaSitemapDoc[]) {
      for (const cat of drama.category || []) {
        if (cat?.slug) categorySlugs.add(cat.slug);
      }
      for (const country of drama.country || []) {
        if (country?.slug) countrySlugs.add(country.slug);
      }
    }

    const categoryRoutes: MetadataRoute.Sitemap = Array.from(categorySlugs).map(
      (slug) => ({
        url: `${siteUrl}/category/${slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.75,
      }),
    );

    const countryRoutes: MetadataRoute.Sitemap = Array.from(countrySlugs).map(
      (slug) => ({
        url: `${siteUrl}/country/${slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.75,
      }),
    );

    return [
      ...staticRoutes,
      ...tagRoutes,
      ...categoryRoutes,
      ...countryRoutes,
      ...dramaRoutes,
    ];
  } catch {
    return [...staticRoutes, ...tagRoutes];
  }
}
