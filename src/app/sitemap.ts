import type { MetadataRoute } from "next";
import connectDB from "@/lib/db";
import Drama from "@/models/Drama";
import { resolveSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

type DramaTaxonomy = { slug: string; name?: string };
type DramaSitemapDoc = {
  slug: string;
  updatedAt?: Date;
  category?: DramaTaxonomy[];
  country?: DramaTaxonomy[];
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = resolveSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/all`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/short`,
      changeFrequency: "daily",
      priority: 0.9,
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
      lastModified: drama.updatedAt ? new Date(drama.updatedAt) : undefined,
      changeFrequency: "daily",
      priority: 0.85,
    }));

    const categorySlugs = new Set<string>();
    const countrySlugs = new Set<string>();
    let hasTongTai = false;

    for (const drama of dramas as DramaSitemapDoc[]) {
      for (const cat of drama.category || []) {
        if (cat?.slug) categorySlugs.add(cat.slug);
        if (
          cat?.slug === "tong-tai" ||
          String(cat?.name ?? "")
            .toLocaleLowerCase("vi-VN")
            .includes("tổng tài")
        ) {
          hasTongTai = true;
        }
      }
      for (const country of drama.country || []) {
        if (country?.slug) countrySlugs.add(country.slug);
      }
    }

    const tagSlugs = [
      ...(hasTongTai ? ["tong-tai"] : []),
      ...["trung-quoc", "han-quoc", "thai-lan"].filter((slug) =>
        countrySlugs.has(slug),
      ),
    ];
    const tagRoutes: MetadataRoute.Sitemap = tagSlugs.map((slug) => ({
      url: `${siteUrl}/tag/${slug}`,
      changeFrequency: "daily",
      priority: slug === "tong-tai" || slug === "trung-quoc" ? 0.85 : 0.8,
    }));

    const categoryRoutes: MetadataRoute.Sitemap = Array.from(categorySlugs).map(
      (slug) => ({
        url: `${siteUrl}/category/${slug}`,
        changeFrequency: "weekly",
        priority: 0.75,
      }),
    );

    const countryRoutes: MetadataRoute.Sitemap = Array.from(countrySlugs).map(
      (slug) => ({
        url: `${siteUrl}/country/${slug}`,
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
    return staticRoutes;
  }
}
