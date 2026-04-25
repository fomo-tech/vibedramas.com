import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import DepositOrder from "@/models/DepositOrder";
import User from "@/models/User";
import CoinLog from "@/models/CoinLog";

// Cron job để check Sepay webhook và expire orders
// Sepay sẽ gửi POST request khi có giao dịch mới

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "your-cron-secret";

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Task 1: Expire các orders quá hạn
    const expiredOrders = await DepositOrder.updateMany(
      {
        status: "pending",
        expiresAt: { $lt: new Date() },
      },
      {
        $set: { status: "expired" },
      },
    );

    console.log(`Expired ${expiredOrders.modifiedCount} orders`);

    return NextResponse.json({
      message: "Cron job completed",
      expiredOrders: expiredOrders.modifiedCount,
    });
  } catch (error: any) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 },
    );
  }
}

// Webhook từ Sepay khi có giao dịch mới
export async function PUT(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();

    // Sepay webhook format (cần check docs Sepay chính xác)
    const { transactionId, amount, description, status } = body;

    if (status !== "success") {
      return NextResponse.json({ message: "Transaction not successful" });
    }

    // Extract order code từ description
    // Format: VD<orderCode>
    const orderCodeMatch = description?.match(/VD[A-Z0-9]+/);
    if (!orderCodeMatch) {
      return NextResponse.json({ message: "Order code not found" });
    }

    const orderCode = orderCodeMatch[0];

    // Tìm order
    const order = await DepositOrder.findOne({ orderCode, status: "pending" });
    if (!order) {
      return NextResponse.json({
        message: "Order not found or already processed",
      });
    }

    // Verify amount
    if (order.amount !== amount) {
      console.error(`Amount mismatch: expected ${order.amount}, got ${amount}`);
      return NextResponse.json({ message: "Amount mismatch" });
    }

    // Update order status
    order.status = "completed";
    order.completedAt = new Date();
    order.sepayTransactionId = transactionId;
    await order.save();

    // Cộng xu cho user
    const user = await User.findById(order.userId);
    if (user) {
      user.coins += amount; // 1 VNĐ = 1 xu
      await user.save();

      // Log coin transaction
      await CoinLog.create({
        userId: user._id.toString(),
        amount: amount,
        type: "deposit",
        description: `Nạp tiền qua ngân hàng - ${orderCode}`,
        relatedId: order._id.toString(),
      });
    }

    return NextResponse.json({
      message: "Deposit completed successfully",
      orderCode,
      amount,
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 },
    );
  }
}
