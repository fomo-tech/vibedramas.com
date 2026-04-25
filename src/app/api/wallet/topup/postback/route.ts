import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/db";
import TopupOrder from "@/models/TopupOrder";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

export const dynamic = "force-dynamic";

// ─── Credit coins helper ───────────────────────────────────────────────────────

async function creditCoins(order: InstanceType<typeof TopupOrder>) {
  const user = await User.findById(order.userId);
  if (!user) return;

  user.coins = (user.coins ?? 0) + order.coins;
  await user.save();

  await Transaction.create({
    userId: order.userId,
    type: "topup",
    amount: order.coins,
    direction: "credit",
    balanceAfter: user.coins,
    description: `Nạp xu: ${order.packageLabel}`,
    metadata: {
      packageName: order.packageLabel,
      packagePrice: order.amount,
      note: `Order ${order.orderId}`,
    },
  });

  order.status = "completed";
  order.paidAt = new Date();
  await order.save();
}

// ─── MoMo IPN handler ─────────────────────────────────────────────────────────

async function handleMomoIpn(body: Record<string, unknown>) {
  const {
    orderId,
    resultCode,
    transId,
    amount,
    signature: receivedSig,
  } = body as {
    orderId: string;
    resultCode: number;
    transId: string;
    amount: number;
    signature: string;
    accessKey: string;
    extraData: string;
    message: string;
    orderInfo: string;
    orderType: string;
    partnerCode: string;
    payType: string;
    requestId: string;
    responseTime: number;
  };

  const accessKey = process.env.MOMO_ACCESS_KEY!;
  const secretKey = process.env.MOMO_SECRET_KEY!;

  // Reconstruct raw signature string per MoMo docs
  const rawSig = [
    `accessKey=${accessKey}`,
    `amount=${amount}`,
    `extraData=${body.extraData ?? ""}`,
    `message=${body.message ?? ""}`,
    `orderId=${orderId}`,
    `orderInfo=${body.orderInfo ?? ""}`,
    `orderType=${body.orderType ?? ""}`,
    `partnerCode=${body.partnerCode ?? ""}`,
    `payType=${body.payType ?? ""}`,
    `requestId=${body.requestId ?? ""}`,
    `responseTime=${body.responseTime ?? ""}`,
    `resultCode=${resultCode}`,
    `transId=${transId}`,
  ].join("&");

  const expectedSig = crypto
    .createHmac("sha256", secretKey)
    .update(rawSig)
    .digest("hex");

  if (expectedSig !== receivedSig) {
    return NextResponse.json({ message: "invalid signature" }, { status: 400 });
  }

  await connectDB();
  const order = await TopupOrder.findOne({ orderId });
  if (!order) {
    return NextResponse.json({ message: "order not found" }, { status: 404 });
  }

  if (order.status === "completed") {
    return NextResponse.json({ message: "already processed" });
  }

  if (resultCode === 0) {
    order.momoTransId = String(transId);
    await creditCoins(order);
  } else {
    order.status = "failed";
    await order.save();
  }

  return NextResponse.json({ message: "ok" });
}

// ─── SePay webhook handler ─────────────────────────────────────────────────────

async function handleSepayWebhook(
  body: Record<string, unknown>,
  req: NextRequest,
) {
  // Validate SePay API key
  const sePayApiKey = process.env.SEPAY_API_KEY;
  if (sePayApiKey) {
    const authHeader = req.headers.get("Authorization") ?? "";
    const providedKey = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (providedKey !== sePayApiKey) {
      return NextResponse.json({ message: "unauthorized" }, { status: 401 });
    }
  }

  // SePay sends: { code, content, transferAmount, transferType, ... }
  // We put orderId as the transfer content/code
  const { transferType, transferAmount, code, content } = body as {
    transferType: string;
    transferAmount: number;
    code: string;
    content: string;
  };

  if (transferType !== "in") {
    return NextResponse.json({ message: "ignored: outgoing" });
  }

  // Extract orderId from content or code (pattern: VIBE_\d+_[A-F0-9]+)
  const match =
    (code ?? "").match(/VIBE_\d+_[A-F0-9]+/i) ??
    (content ?? "").match(/VIBE_\d+_[A-F0-9]+/i);

  if (!match) {
    return NextResponse.json({ message: "no orderId in content" });
  }

  const orderId = match[0].toUpperCase();

  await connectDB();
  const order = await TopupOrder.findOne({ orderId });
  if (!order) {
    return NextResponse.json({ message: "order not found" });
  }
  if (order.status === "completed") {
    return NextResponse.json({ message: "already processed" });
  }

  // Verify amount matches (allow exact match only)
  if (Math.abs(transferAmount - order.amount) > 0) {
    order.status = "failed";
    await order.save();
    return NextResponse.json({ message: "amount mismatch" });
  }

  await creditCoins(order);
  return NextResponse.json({ message: "ok" });
}

// ─── Main route ───────────────────────────────────────────────────────────────

/** POST /api/wallet/topup/postback
 *
 *  Handles:
 *   - MoMo IPN  (body.partnerCode exists)
 *   - SePay webhook (body.code / body.content with VIBE_ prefix)
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "bad request" }, { status: 400 });
  }

  if (body.partnerCode) {
    return handleMomoIpn(body);
  }
  return handleSepayWebhook(body, req);
}
