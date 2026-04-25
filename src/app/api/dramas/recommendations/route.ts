import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Drama from "@/models/Drama";
import Episode from "@/models/Episode";
import { getUserSession } from "@/lib/auth";

export async function GET() {
  try {
    await connectDB();

    const session = await getUserSession();
    const userId = session?.userId ?? null;

    let dramas: any[];

    if (userId) {
      try {
        const [likedDramas, watchedEpisodes] = await Promise.all([
          Drama.find({ likedBy: userId }).limit(10).lean(),
          Episode.find({ watchedBy: userId })
            .sort({ updatedAt: -1 })
            .limit(30)
            .lean(),
        ]);

        const watchedDramaIds = [
          ...new Set(watchedEpisodes.map((ep: any) => String(ep.dramaId))),
        ];
        const watchedDramas = watchedDramaIds.length
          ? await Drama.find({ _id: { $in: watchedDramaIds } })
              .limit(10)
              .lean()
          : [];

        const interestDramas = [...likedDramas, ...watchedDramas];
        const categories = new Set<string>();
        const countries = new Set<string>();
        const excludeIds = new Set<string>();

        interestDramas.forEach((d: any) => {
          excludeIds.add(String(d._id));
          d.category?.forEach((c: any) => categories.add(c.slug));
          d.country?.forEach((c: any) => countries.add(c.slug));
        });

        if (categories.size > 0 || countries.size > 0) {
          const [similar, random] = await Promise.all([
            Drama.aggregate([
              {
                $match: {
                  _id: { $nin: [...excludeIds].map((id) => ({ $oid: id })) },
                  $or: [
                    { "category.slug": { $in: [...categories] } },
                    { "country.slug": { $in: [...countries] } },
                  ],
                },
              },
              { $sample: { size: 16 } },
            ]),
            Drama.aggregate([{ $sample: { size: 4 } }]),
          ]);

          // Deduplicate
          const seen = new Set<string>();
          dramas = [...similar, ...random].filter((d) => {
            const id = String(d._id);
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
          });
        } else {
          dramas = await Drama.aggregate([{ $sample: { size: 20 } }]);
        }
      } catch {
        dramas = await Drama.aggregate([{ $sample: { size: 20 } }]);
      }
    } else {
      // Guest: random
      dramas = await Drama.aggregate([{ $sample: { size: 20 } }]);
    }

    return NextResponse.json(JSON.parse(JSON.stringify(dramas)));
  } catch (error) {
    console.error("Recommendations API error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
