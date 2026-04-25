import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import Episode from "@/models/Episode";
import EpisodeComment from "@/models/EpisodeComment";
import User from "@/models/User";
import { rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

interface LikeData {
  liked: boolean;
  dramaSlug?: string;
}

type Ctx = { params: Promise<{ episodeId: string }> };

/** GET /api/dramas/episodes/[episodeId]/likes */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { episodeId } = await params;

  await connectDB();
  const session = await getUserSession();

  const [episode, commentCount, user] = await Promise.all([
    Episode.findById(episodeId)
      .select("likeCount")
      .lean<{ likeCount?: number } | null>(),
    EpisodeComment.countDocuments({ episodeId }),
    session
      ? User.findById(String(session.userId))
          .select("likedEpisodes")
          .lean<{ likedEpisodes?: string[] } | null>()
      : Promise.resolve(null),
  ]);

  if (!episode) {
    return NextResponse.json({ error: "Episode not found" }, { status: 404 });
  }

  return NextResponse.json({
    likeCount: Number(episode.likeCount ?? 0),
    commentCount,
    liked: Boolean(user?.likedEpisodes?.includes(episodeId)),
  });
}

/** POST /api/dramas/episodes/[episodeId]/likes */
export async function POST(req: NextRequest, { params }: Ctx) {
  // Rate limit: 30 toggles/min per IP
  const limited = await rateLimit(req, {
    windowMs: 60,
    max: 30,
    keyPrefix: "rl:like",
  });
  if (limited) return limited;

  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { episodeId } = await params;
  const body = (await req.json().catch(() => null)) as LikeData | null;
  if (typeof body?.liked !== "boolean") {
    return NextResponse.json({ error: "Missing liked state" }, { status: 400 });
  }

  await connectDB();

  const { liked, dramaSlug } = body;
  const userId = String(session.userId);

  const episode = await Episode.findById(episodeId);
  if (!episode) {
    return NextResponse.json({ error: "Episode not found" }, { status: 404 });
  }

  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Initialize arrays if needed
  if (!user.likedEpisodes) user.likedEpisodes = [];

  const episodeIdStr = String(episodeId);
  const hasLiked = user.likedEpisodes.includes(episodeIdStr);

  // Toggle like state
  if (liked && !hasLiked) {
    // Like
    user.likedEpisodes.push(episodeIdStr);
    episode.likeCount = (episode.likeCount || 0) + 1;
    if (dramaSlug) {
      if (!Array.isArray(user.likedDramas)) user.likedDramas = [];
      if (!user.likedDramas.includes(dramaSlug)) {
        user.likedDramas.unshift(dramaSlug);
      }
    }
  } else if (!liked && hasLiked) {
    // Unlike
    user.likedEpisodes = user.likedEpisodes.filter((id) => id !== episodeIdStr);
    episode.likeCount = Math.max(0, (episode.likeCount || 0) - 1);
    if (dramaSlug && Array.isArray(user.likedDramas)) {
      user.likedDramas = user.likedDramas.filter((slug) => slug !== dramaSlug);
    }
  }

  await user.save();
  await episode.save();

  const commentCount = await EpisodeComment.countDocuments({ episodeId });

  return NextResponse.json({
    liked: user.likedEpisodes.includes(episodeIdStr),
    likeCount: Number(episode.likeCount ?? 0),
    commentCount,
  });
}
