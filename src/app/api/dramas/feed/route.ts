import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Drama from "@/models/Drama";
import Episode from "@/models/Episode";
import { getUserSession } from "@/lib/auth";
import { getCache, setCache } from "@/lib/cache";
import { rateLimit } from "@/lib/rateLimit";

// ─── Resolve episode1 for a batch of dramas (single query, not N+1) ──────────
async function attachEpisode1(dramas: any[]): Promise<any[]> {
  const dramaIds = dramas.map((d) => String(d._id));
  const objectIds = dramaIds.map((id) => new mongoose.Types.ObjectId(id));

  // Pass 1: look for common episode-1 names (OPhim + KKPhim formats)
  const ep1Names = ["1", "01", "Tập 1", "Tập 01", "Episode 1", "Full"];
  const episodes = await Episode.find({
    dramaId: { $in: objectIds },
    $or: [
      { name: { $in: ep1Names } },
      { name: { $regex: /^(tập|tap|episode|ep|phần|phan)?\s*0*1\b/i } },
    ],
    link_m3u8: { $exists: true, $nin: [null, ""] },
  })
    .lean()
    .exec();

  // When a drama has multiple ep-1 candidates (OPhim "1" + KKPhim "Tập 01"),
  // prefer the one with pure-numeric name (OPhim) — typically lower bitrate,
  // better mobile compatibility. Fall back to any match.
  const epMap = new Map<string, any>();
  for (const ep of episodes) {
    const key = String(ep.dramaId);
    const existing = epMap.get(key);
    if (!existing) {
      epMap.set(key, ep);
    } else {
      // Pure-numeric name wins (OPhim style: "1", "01")
      const isNumeric = (name: string) => /^\d+$/.test(name.trim());
      if (!isNumeric(existing.name) && isNumeric(ep.name)) {
        epMap.set(key, ep);
      }
    }
  }

  // Pass 2: for dramas still missing episode1 — fall back to ANY episode with m3u8
  const missingIds = objectIds.filter((id) => !epMap.has(String(id)));
  if (missingIds.length > 0) {
    const fallback = await Episode.find({
      dramaId: { $in: missingIds },
      link_m3u8: { $exists: true, $nin: [null, ""] },
    })
      .sort({ createdAt: 1 })
      .lean()
      .exec();

    for (const ep of fallback) {
      const key = String(ep.dramaId);
      if (!epMap.has(key)) epMap.set(key, ep);
    }
  }

  return dramas
    .map((drama) => {
      const ep1 = epMap.get(String(drama._id));
      if (!ep1) return null;
      return { ...drama, episode1: ep1 };
    })
    .filter(Boolean);
}

export async function GET(req: NextRequest) {
  try {
    // Rate limit: 120 req/min per IP — public feed, high traffic expected
    const limited = await rateLimit(req, {
      windowMs: 60,
      max: 120,
      keyPrefix: "rl:feed",
    });
    if (limited) return limited;

    await connectDB();

    const session = await getUserSession();
    const userId = session?.userId ?? null;

    // Pagination params
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    let dramas: any[];

    if (userId) {
      // Personalised feed — not cached (user-specific)
      try {
        const [likedDramas, watchedEpisodes] = await Promise.all([
          Drama.find({ likedBy: userId }).limit(5).lean(),
          Episode.find({ watchedBy: userId })
            .sort({ updatedAt: -1 })
            .limit(20)
            .lean(),
        ]);

        const watchedDramaIds = [
          ...new Set(watchedEpisodes.map((ep: any) => String(ep.dramaId))),
        ];
        const watchedDramas = watchedDramaIds.length
          ? await Drama.find({ _id: { $in: watchedDramaIds } })
              .limit(5)
              .lean()
          : [];

        const interestDramas = [...likedDramas, ...watchedDramas];
        const categories = new Set<string>();
        const countries = new Set<string>();
        interestDramas.forEach((d: any) => {
          d.category?.forEach((c: any) => categories.add(c.slug));
          d.country?.forEach((c: any) => countries.add(c.slug));
        });

        if (categories.size > 0 || countries.size > 0) {
          const [similar, random] = await Promise.all([
            Drama.aggregate([
              {
                $match: {
                  $or: [
                    { "category.slug": { $in: [...categories] } },
                    { "country.slug": { $in: [...countries] } },
                  ],
                },
              },
              { $sample: { size: 35 } },
            ]),
            Drama.aggregate([{ $sample: { size: 15 } }]),
          ]);
          dramas = [...similar, ...random];
        } else {
          dramas = await Drama.aggregate([{ $sample: { size: 50 } }]);
        }
      } catch {
        dramas = await Drama.aggregate([{ $sample: { size: 50 } }]);
      }

      const feedItems = await attachEpisode1(dramas);

      // Paginate
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedItems = feedItems.slice(startIndex, endIndex);
      const hasMore = endIndex < feedItems.length;

      return NextResponse.json({
        items: paginatedItems,
        hasMore,
        page,
      });
    }

    // ── Guest feed: cache for 5 minutes (same random set per window) ────────
    const cacheKey = "feed:guest:v1";
    const cached = await getCache<any[]>(cacheKey);

    let feedItems: any[];
    if (cached) {
      feedItems = cached;
    } else {
      dramas = await Drama.aggregate([{ $sample: { size: 60 } }]);
      feedItems = await attachEpisode1(dramas);
      // Cache 5 min — safe for guest since content isn't personalised
      await setCache(cacheKey, feedItems, 300);
    }

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = feedItems.slice(startIndex, endIndex);
    const hasMore = endIndex < feedItems.length;

    return NextResponse.json({
      items: paginatedItems,
      hasMore,
      page,
    });
  } catch (error: any) {
    console.error("Error in feed API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
