import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

export const dynamic = "force-dynamic";

/** GET /api/wallet/gift?page=1 — history of sent + received coin gifts */
export async function GET(req: NextRequest) {
  const session = await getUserSession();
  if (!session)
    return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = 20;
  const skip = (page - 1) * limit;

  await connectDB();

  const [items, total] = await Promise.all([
    Transaction.find({
      userId: String(session.userId),
      type: { $in: ["coin_gift_sent", "coin_gift_received"] },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Transaction.countDocuments({
      userId: String(session.userId),
      type: { $in: ["coin_gift_sent", "coin_gift_received"] },
    }),
  ]);

  return NextResponse.json({
    items: items.map((t) => ({
      id: String(t._id),
      type: t.type,
      amount: t.amount,
      direction: t.direction,
      description: t.description,
      metadata: t.metadata ?? {},
      createdAt: (t.createdAt as Date).toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

/** POST /api/wallet/gift — send coins to another user by username (VIP only) */
export async function POST(req: NextRequest) {
  const session = await getUserSession();
  if (!session)
    return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });

  const body = await req.json();
  const { toUsername, amount, note } = body as {
    toUsername: string;
    amount: number;
    note?: string;
  };

  if (!toUsername || typeof toUsername !== "string")
    return NextResponse.json(
      { error: "Thiếu tên người nhận" },
      { status: 400 },
    );

  const parsedAmount = Math.floor(Number(amount));
  if (!parsedAmount || parsedAmount < 1)
    return NextResponse.json(
      { error: "Số xu tặng tối thiểu là 1" },
      { status: 400 },
    );
  if (parsedAmount > 10000)
    return NextResponse.json(
      { error: "Số xu tặng tối đa là 10.000 mỗi lần" },
      { status: 400 },
    );

  await connectDB();

  const sender = await User.findById(session.userId).select(
    "username coins bonusCoins vipStatus vipExpiry",
  );
  if (!sender)
    return NextResponse.json({ error: "Không tìm thấy user" }, { status: 404 });

  // VIP-only feature
  const isVip =
    sender.vipStatus &&
    sender.vipExpiry &&
    new Date(sender.vipExpiry) > new Date();
  if (!isVip)
    return NextResponse.json(
      { error: "Chỉ thành viên VIP mới có thể tặng xu" },
      { status: 403 },
    );

  if ((sender.coins ?? 0) < parsedAmount)
    return NextResponse.json({ error: "Số dư xu không đủ" }, { status: 400 });

  const recipient = await User.findOne({ username: toUsername.trim() }).select(
    "_id username coins bonusCoins",
  );
  if (!recipient)
    return NextResponse.json(
      { error: "Không tìm thấy người dùng này" },
      { status: 404 },
    );

  if (String(recipient._id) === String(session.userId))
    return NextResponse.json(
      { error: "Không thể tặng xu cho chính mình" },
      { status: 400 },
    );

  // Atomic debit sender
  const updatedSender = await User.findByIdAndUpdate(
    session.userId,
    { $inc: { coins: -parsedAmount } },
    { new: true, select: "coins" },
  );
  if (!updatedSender)
    return NextResponse.json({ error: "Giao dịch thất bại" }, { status: 500 });

  // Credit recipient (bonusCoins for received gifts)
  await User.findByIdAndUpdate(recipient._id, {
    $inc: { bonusCoins: parsedAmount },
  });

  const now = new Date();
  const senderIdStr = String(session.userId);
  const recipientIdStr = String(recipient._id);

  // Log both sides in parallel
  await Promise.all([
    Transaction.create({
      userId: senderIdStr,
      type: "coin_gift_sent",
      amount: parsedAmount,
      direction: "debit",
      balanceAfter: updatedSender.coins,
      description: `Tặng ${parsedAmount.toLocaleString("vi-VN")} xu cho @${recipient.username}`,
      metadata: {
        toUserId: recipientIdStr,
        toUsername: recipient.username,
        note: note?.trim() ?? undefined,
      },
    }),
    Transaction.create({
      userId: recipientIdStr,
      type: "coin_gift_received",
      amount: parsedAmount,
      direction: "credit",
      description: `Nhận ${parsedAmount.toLocaleString("vi-VN")} xu từ @${sender.username}`,
      metadata: {
        fromUserId: senderIdStr,
        fromUsername: sender.username,
        note: note?.trim() ?? undefined,
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    coinsLeft: updatedSender.coins,
  });
}
