import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import WatchHistory from "@/models/WatchHistory";

// GET /api/history — load history for logged-in user
export async function GET() {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ history: [] }, { status: 401 });

  await connectDB();
  const docs = await WatchHistory.find({ userId: session.userId })
    .sort({ watchedAt: -1 })
    .limit(100)
    .lean();

  const history = docs.map((d) => ({
    _id: d.dramaId || d.slug,
    slug: d.slug,
    name: d.name,
    origin_name: d.origin_name,
    thumb_url: d.thumb_url,
    poster_url: d.poster_url,
    episode: d.episode,
    watchedAt: new Date(d.watchedAt).getTime(),
  }));

  return NextResponse.json({ history });
}

// POST /api/history — upsert a history entry
export async function POST(req: NextRequest) {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json();
  const { slug, dramaId, name, origin_name, thumb_url, poster_url, episode } =
    body;

  if (!slug || !episode) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await connectDB();

  await WatchHistory.findOneAndUpdate(
    { userId: session.userId, slug },
    {
      userId: session.userId,
      slug,
      dramaId,
      name,
      origin_name,
      thumb_url,
      poster_url,
      episode,
      watchedAt: new Date(),
    },
    { upsert: true, returnDocument: "after" },
  );

  return NextResponse.json({ ok: true });
}

// DELETE /api/history?slug=xxx
export async function DELETE(req: NextRequest) {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug)
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  await connectDB();
  await WatchHistory.deleteOne({ userId: session.userId, slug });

  return NextResponse.json({ ok: true });
}
