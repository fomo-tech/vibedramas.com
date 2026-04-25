import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import EpisodeComment from "@/models/EpisodeComment";
import { rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ episodeId: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { episodeId } = await params;
  const limit = Math.min(
    Math.max(Number(req.nextUrl.searchParams.get("limit") || 20), 1),
    50,
  );
  const skip = Math.max(Number(req.nextUrl.searchParams.get("skip") || 0), 0);

  await connectDB();

  const [comments, total] = await Promise.all([
    EpisodeComment.find({ episodeId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<
        {
          _id: string;
          userId: string;
          userName: string;
          userAvatar?: string;
          content: string;
          createdAt: Date;
        }[]
      >(),
    EpisodeComment.countDocuments({ episodeId }),
  ]);

  return NextResponse.json({ comments, total });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  // Rate limit: 10 comments/min per IP — anti-spam
  const limited = await rateLimit(req, {
    windowMs: 60,
    max: 10,
    keyPrefix: "rl:comment",
  });
  if (limited) return limited;

  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
  }

  const { episodeId } = await params;
  const body = await req.json().catch(() => null);
  const content = String(body?.content ?? "").trim();
  const dramaId = String(body?.dramaId ?? "").trim();

  if (!content) {
    return NextResponse.json(
      { error: "Nội dung bình luận trống" },
      { status: 400 },
    );
  }
  if (content.length > 500) {
    return NextResponse.json(
      { error: "Bình luận tối đa 500 ký tự" },
      { status: 400 },
    );
  }
  if (!dramaId) {
    return NextResponse.json({ error: "Thiếu dramaId" }, { status: 400 });
  }

  await connectDB();

  const comment = await EpisodeComment.create({
    episodeId,
    dramaId,
    userId: String(session.userId),
    userName: String(
      (session as { username?: string; email?: string }).username ??
        (session as { email?: string }).email ??
        "User",
    ),
    userAvatar: String((session as { avatar?: string }).avatar ?? ""),
    content,
  });

  const total = await EpisodeComment.countDocuments({ episodeId });

  return NextResponse.json({
    comment: {
      _id: String(comment._id),
      userId: comment.userId,
      userName: comment.userName,
      userAvatar: comment.userAvatar,
      content: comment.content,
      createdAt: comment.createdAt,
    },
    total,
  });
}
