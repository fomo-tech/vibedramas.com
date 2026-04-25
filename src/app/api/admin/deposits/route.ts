import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import DepositOrder from "@/models/DepositOrder";
import User from "@/models/User";
import CoinLog from "@/models/CoinLog";
import { getSession } from "@/lib/auth";

// GET: Admin lấy tất cả deposit orders
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const query: any = {};
    if (status) query.status = status;

    const orders = await DepositOrder.find(query)
      .populate("userId", "username email")
      .populate("bankAccountId")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await DepositOrder.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Map to component-expected shape
    const deposits = orders.map((o: any) => ({
      _id: String(o._id),
      user: {
        _id: String(o.userId?._id ?? o.userId ?? ""),
        name: o.userId?.name ?? o.userId?.username ?? "N/A",
        email: o.userId?.email ?? "",
      },
      amount: o.amount,
      orderCode: o.orderCode,
      bankAccount: {
        bankName: o.bankAccountId?.bankName ?? "",
        accountNumber: o.bankAccountId?.accountNumber ?? "",
        accountName: o.bankAccountId?.accountName ?? "",
      },
      qrCodeUrl: o.qrCodeUrl,
      status: o.status,
      sepayTransactionId: o.sepayTransactionId,
      createdAt: o.createdAt,
      expiresAt: o.expiresAt,
      completedAt: o.completedAt,
    }));

    return NextResponse.json({ deposits, totalPages, total });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 },
    );
  }
}

// PUT: Admin xác nhận / huỷ deposit
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id, action, adminNote } = await req.json();

    if (!id || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const order = await DepositOrder.findById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "Order đã được xử lý" },
        { status: 400 },
      );
    }

    if (action === "confirm") {
      const user = await User.findById(order.userId);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Credit coins to user
      user.coins = (user.coins ?? 0) + order.amount;
      await user.save();

      // Record CoinLog for deposit history
      await CoinLog.create({
        userId: String(user._id),
        amount: order.amount,
        type: "deposit",
        description:
          adminNote || `Nạp tiền xác nhận bởi admin - ${order.orderCode}`,
        relatedId: String(order._id),
      });

      order.status = "completed";
      order.completedAt = new Date();
      await order.save();

      return NextResponse.json({
        ok: true,
        message: "Đã xác nhận và cộng xu cho user",
      });
    } else if (action === "cancel") {
      order.status = "cancelled";
      await order.save();

      return NextResponse.json({ ok: true, message: "Đã huỷ deposit" });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 },
    );
  }
}
