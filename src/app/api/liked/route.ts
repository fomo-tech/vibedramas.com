import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Drama from "@/models/Drama";

// GET /api/liked — returns full drama objects for current user's liked list
export async function GET() {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ liked: [] }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.userId)
    .select("likedDramas")
    .lean<{ likedDramas: string[] }>();
  const slugs: string[] = user?.likedDramas ?? [];

  if (slugs.length === 0) return NextResponse.json({ liked: [] });

  const dramas = await Drama.find(
    { slug: { $in: slugs } },
    {
      slug: 1,
      name: 1,
      origin_name: 1,
      thumb_url: 1,
      poster_url: 1,
      episode_total: 1,
      episode_current: 1,
      category: 1,
    },
  ).lean();

  // Preserve order from likedDramas array (most recently liked first)
  const dramaMap = new Map(dramas.map((d) => [d.slug, d]));
  const liked = slugs
    .map((slug, i) => {
      const d = dramaMap.get(slug);
      if (!d) return null;
      return {
        _id: String((d as any)._id),
        slug: d.slug,
        name: d.name,
        origin_name: d.origin_name,
        thumb_url: d.thumb_url,
        poster_url: d.poster_url,
        episode_total: d.episode_total,
        episode_current: d.episode_current,
        category: d.category ?? [],
        likedAt: Date.now() - i * 1000, // approximate order
      };
    })
    .filter(Boolean);

  return NextResponse.json({ liked });
}

// POST /api/liked — toggle like for a drama
// Body: { slug: string, action: "like" | "unlike" }
export async function POST(req: NextRequest) {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json();
  const { slug, action } = body;

  if (!slug || !["like", "unlike"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await connectDB();

  if (action === "like") {
    await User.findByIdAndUpdate(session.userId, {
      $addToSet: { likedDramas: slug },
    });
  } else {
    await User.findByIdAndUpdate(session.userId, {
      $pull: { likedDramas: slug },
    });
  }

  return NextResponse.json({ ok: true });
}
