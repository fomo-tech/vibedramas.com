import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  const session = await getUserSession();

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    await connectDB();
    const dbUser = (await User.findById(session.userId)
      .select(
        "coins vipStatus vipExpiry vipCoinsPerMinute vipPackageName giftLevel",
      )
      .lean()) as {
      coins?: number;
      vipStatus?: boolean;
      vipExpiry?: Date;
      vipCoinsPerMinute?: number;
      vipPackageName?: string;
      giftLevel?: number;
    } | null;

    return NextResponse.json({
      user: {
        id: session.userId,
        name: session.name,
        email: session.email,
        avatar: session.avatar,
        coins: dbUser?.coins ?? 0,
        vipStatus: dbUser?.vipStatus ?? false,
        vipExpiry: dbUser?.vipExpiry
          ? new Date(dbUser.vipExpiry).toISOString()
          : null,
        vipCoinsPerMinute: dbUser?.vipCoinsPerMinute ?? 0,
        vipPackageName: dbUser?.vipPackageName ?? "",
        giftLevel: Math.min(5, Math.max(1, Number(dbUser?.giftLevel ?? 1))),
      },
    });
  } catch {
    // DB unavailable — return session data without coins
    return NextResponse.json({
      user: {
        id: session.userId,
        name: session.name,
        email: session.email,
        avatar: session.avatar,
        coins: 0,
        vipStatus: false,
        vipExpiry: null,
        vipCoinsPerMinute: 0,
        vipPackageName: "",
        giftLevel: 1,
      },
    });
  }
}
