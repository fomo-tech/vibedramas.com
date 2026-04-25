import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import CoinLog from "@/models/CoinLog";
import ReferralLog from "@/models/ReferralLog";
import WelfareClaim from "@/models/WelfareClaim";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") return unauthorized();

    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;

    await connectDB();

    if (userId) {
      // Get detailed user info with activity history
      const user = await User.findById(userId).lean();
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Get activity history
      const [coinLogs, referralLogs, welfareClaims] = await Promise.all([
        CoinLog.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),
        ReferralLog.find({
          $or: [{ referrerId: userId }, { refereeId: userId }],
        })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean(),
        WelfareClaim.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),
      ]);

      const totalCoinEarned = coinLogs.reduce(
        (acc, log) => acc + log.amount,
        0,
      );
      const totalWelfareCoins = welfareClaims.reduce(
        (acc, claim) => acc + claim.reward,
        0,
      );
      const totalReferralCoins = referralLogs
        .filter((log) => String(log.referrerId) === userId)
        .reduce((acc, log) => acc + log.coinsAwarded, 0);

      return NextResponse.json({
        user: {
          ...user,
          _id: String(user._id),
          createdAt: (user.createdAt as unknown as Date)?.toISOString(),
          updatedAt: (user.updatedAt as unknown as Date)?.toISOString(),
          vipExpiry: (user.vipExpiry as unknown as Date)?.toISOString(),
        },
        stats: {
          totalCoinEarned,
          totalWelfareCoins,
          totalReferralCoins,
          coinLogsCount: coinLogs.length,
          referralLogsCount: referralLogs.length,
          welfareClaimsCount: welfareClaims.length,
        },
        activities: {
          coinLogs: coinLogs.map((log) => ({
            ...log,
            _id: String(log._id),
            createdAt: (log.createdAt as unknown as Date)?.toISOString(),
          })),
          referralLogs: referralLogs.map((log) => ({
            ...log,
            _id: String(log._id),
            createdAt: (log.createdAt as unknown as Date)?.toISOString(),
          })),
          welfareClaims: welfareClaims.map((claim) => ({
            ...claim,
            _id: String(claim._id),
            createdAt: (claim.createdAt as unknown as Date)?.toISOString(),
          })),
        },
      });
    }

    // List all users with pagination
    const skip = (page - 1) * limit;
    const [users, totalUsers] = await Promise.all([
      User.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(),
    ]);

    // Enrich user data with stats
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const [coinCount, welfareCount, referralCount] = await Promise.all([
          CoinLog.countDocuments({ userId: String(user._id) }),
          WelfareClaim.countDocuments({ userId: String(user._id) }),
          ReferralLog.countDocuments({ referrerId: String(user._id) }),
        ]);

        return {
          ...user,
          _id: String(user._id),
          createdAt: (user.createdAt as unknown as Date)?.toISOString(),
          updatedAt: (user.updatedAt as unknown as Date)?.toISOString(),
          vipExpiry: (user.vipExpiry as unknown as Date)?.toISOString(),
          lastLoginIp: user.lastLoginIp ?? "",
          lastLoginAt: (
            user.lastLoginAt as unknown as Date | undefined
          )?.toISOString?.(),
          stats: {
            coinLogsCount: coinCount,
            welfareClaimsCount: welfareCount,
            referralCount: referralCount,
          },
        };
      }),
    );

    return NextResponse.json({
      users: enrichedUsers,
      totalUsers,
      page,
      limit,
      totalPages: Math.ceil(totalUsers / limit),
    });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
