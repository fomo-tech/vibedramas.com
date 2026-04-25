import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Drama from "@/models/Drama";
import { getCache, setCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const cacheKey = `drama:slug:${slug}`;
    const cached = await getCache(cacheKey);
    if (cached) return NextResponse.json(cached);

    await connectDB();

    const drama = await Drama.findOne({ slug }).lean();
    if (!drama) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await setCache(cacheKey, drama, 60 * 10);
    return NextResponse.json(drama);
  } catch (error) {
    console.error("Drama slug API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
