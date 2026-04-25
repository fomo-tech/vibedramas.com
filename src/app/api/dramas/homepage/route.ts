import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Drama from "@/models/Drama";
import User from "@/models/User";
import { getUserSession } from "@/lib/auth";

// GET: Lấy homepage sections
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const session = await getUserSession();
    let userId: string | null = null;

    if (session?.userId) {
      const user = await User.findById(session.userId);
      userId = user?._id?.toString() || null;
    }

    // 1. Phim thịnh hành (trending) - sort by trendingRank
    let trending = await Drama.find({
      isTrending: true,
      trendingRank: { $exists: true },
    })
      .sort({ trendingRank: 1 })
      .limit(20)
      .select(
        "name slug thumb_url poster_url year episode_current episode_total view likes",
      )
      .lean();

    if (!trending.length) {
      trending = await Drama.find()
        .sort({ view: -1, likes: -1, createdAt: -1 })
        .limit(20)
        .select(
          "name slug thumb_url poster_url year episode_current episode_total view likes",
        )
        .lean();
    }

    // 2. Phim mới nhất - sort by createdAt
    const latest = await Drama.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .select(
        "name slug thumb_url poster_url year episode_current episode_total view likes",
      )
      .lean();

    // 3. Phim hay (top rated) - sort by view + likes
    const topRated = await Drama.find()
      .sort({ view: -1, likes: -1 })
      .limit(20)
      .select(
        "name slug thumb_url poster_url year episode_current episode_total view likes",
      )
      .lean();

    // 4. Dành cho bạn (recommendation)
    let recommended = [];

    if (userId) {
      // Lấy lịch sử xem và likes của user
      const user = await User.findById(userId)
        .populate("likedDramas", "category")
        .lean();

      // Collect categories từ dramas user đã like
      const userCategories: string[] = [];
      if (user?.likedDramas && Array.isArray(user.likedDramas)) {
        user.likedDramas.forEach((drama: any) => {
          if (drama.category) {
            drama.category.forEach((cat: any) => {
              if (cat.slug && !userCategories.includes(cat.slug)) {
                userCategories.push(cat.slug);
              }
            });
          }
        });
      }

      if (userCategories.length > 0) {
        // Tìm dramas có category tương tự
        recommended = await Drama.find({
          "category.slug": { $in: userCategories },
        })
          .sort({ view: -1, createdAt: -1 })
          .limit(20)
          .select(
            "name slug thumb_url poster_url year episode_current episode_total view likes category",
          )
          .lean();
      }
    }

    // Nếu không có recommendation hoặc user chưa login, lấy random
    if (recommended.length === 0) {
      recommended = await Drama.aggregate([
        { $sample: { size: 20 } },
        {
          $project: {
            name: 1,
            slug: 1,
            thumb_url: 1,
            poster_url: 1,
            year: 1,
            episode_current: 1,
            episode_total: 1,
            view: 1,
            likes: 1,
          },
        },
      ]);
    }

    return NextResponse.json({
      trending,
      latest,
      topRated,
      recommended,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 },
    );
  }
}
