import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** VIP packages were replaced by the free watch-and-earn level system. */
export async function POST() {
  return NextResponse.json(
    {
      error: "Tính năng mua gói đã ngừng. Hãy xem phim để nhận thưởng và lên cấp.",
    },
    { status: 410 },
  );
}
