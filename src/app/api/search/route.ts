import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Drama from "@/models/Drama";
import { rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Rate limit: 60 searches per minute per IP
    const limited = await rateLimit(req, {
      windowMs: 60,
      max: 60,
      keyPrefix: "rl:search",
    });
    if (limited) return limited;

    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 1) {
      return NextResponse.json([]);
    }

    // Limit query length to prevent ReDoS / excessive MongoDB load
    if (q.length > 100) {
      return NextResponse.json([]);
    }

    await connectDB();

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const dramas = await Drama.find({
      $or: [
        { name: { $regex: regex } },
        { origin_name: { $regex: regex } },
        { actor: { $regex: regex } },
        { content: { $regex: regex } },
        { "category.name": { $regex: regex } },
        { "country.name": { $regex: regex } },
      ],
    })
      .sort({ view: -1 })
      .limit(30)
      .select(
        "name slug origin_name thumb_url poster_url episode_total episode_current category country actor year quality",
      )
      .lean();

    return NextResponse.json(JSON.parse(JSON.stringify(dramas)));
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
