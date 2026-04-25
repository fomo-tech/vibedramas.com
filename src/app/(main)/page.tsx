import connectDB from "@/lib/db";
import Drama from "@/models/Drama";
import MainLayoutSwitcher from "@/components/home/MainLayoutSwitcher";
import BackgroundDecor from "@/components/home/BackgroundDecor";
import { getCache, setCache } from "@/lib/cache";
import { resolveSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const HOME_CACHE_KEY = "homepage:sections:v1";
const HOME_CACHE_TTL = 300; // 5 minutes

export default async function HomePage() {
  await connectDB();
  const siteUrl = resolveSiteUrl();

  // Try cache first — avoids 5 parallel DB queries on every SSR render
  const cached = await getCache<{
    featuredDramas: any[];
    newReleases: any[];
    trendingDramas: any[];
    topRatedDramas: any[];
    recommendedDramas: any[];
  }>(HOME_CACHE_KEY);

  let featuredDramas,
    newReleases,
    trendingDramas,
    topRatedDramas,
    recommendedDramas;

  if (cached) {
    ({
      featuredDramas,
      newReleases,
      trendingDramas,
      topRatedDramas,
      recommendedDramas,
    } = cached);
  } else {
    const hasPoster = {
      poster_url: {
        $regex: /^https:\/\/img\.ophim\.live\/uploads\/movies\/.+/,
      },
    };

    [
      featuredDramas,
      newReleases,
      trendingDramas,
      topRatedDramas,
      recommendedDramas,
    ] = await Promise.all([
      Drama.find(hasPoster).sort({ view: -1, createdAt: -1 }).limit(8).lean(),
      Drama.find().sort({ createdAt: -1 }).limit(20).lean(),
      Drama.find({ isTrending: true, trendingRank: { $exists: true } })
        .sort({ trendingRank: 1 })
        .limit(20)
        .lean(),
      Drama.find().sort({ view: -1, likes: -1 }).limit(20).lean(),
      Drama.aggregate([{ $sample: { size: 20 } }]),
    ]);

    if (!trendingDramas?.length) {
      trendingDramas = await Drama.find()
        .sort({ view: -1, likes: -1, createdAt: -1 })
        .limit(20)
        .lean();
    }

    const payload = {
      featuredDramas: JSON.parse(JSON.stringify(featuredDramas)),
      newReleases: JSON.parse(JSON.stringify(newReleases)),
      trendingDramas: JSON.parse(JSON.stringify(trendingDramas)),
      topRatedDramas: JSON.parse(JSON.stringify(topRatedDramas)),
      recommendedDramas: JSON.parse(JSON.stringify(recommendedDramas)),
    };
    // Cache asynchronously — don't block the response
    setCache(HOME_CACHE_KEY, payload, HOME_CACHE_TTL).catch(() => {});
    ({
      featuredDramas,
      newReleases,
      trendingDramas,
      topRatedDramas,
      recommendedDramas,
    } = payload);
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Vibe Drama",
            url: siteUrl,
            inLanguage: "vi-VN",
            potentialAction: {
              "@type": "SearchAction",
              target: `${siteUrl}/search?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
      <BackgroundDecor />
      <MainLayoutSwitcher
        featuredDramas={featuredDramas}
        newReleases={newReleases}
        trendingDramas={trendingDramas}
        topRatedDramas={topRatedDramas}
        recommendedDramas={recommendedDramas}
      />
    </>
  );
}
