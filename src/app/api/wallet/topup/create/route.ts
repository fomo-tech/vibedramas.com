import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getUserSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import TopupOrder from "@/models/TopupOrder";
import { COIN_PACKAGES, getPackageById } from "@/constants/coinPackages";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ─── MoMo helpers ─────────────────────────────────────────────────────────────

function momoSignature(raw: string): string {
  return crypto
    .createHmac("sha256", process.env.MOMO_SECRET_KEY!)
    .update(raw)
    .digest("hex");
}

async function createMomoOrder(
  orderId: string,
  requestId: string,
  amount: number,
  orderInfo: string,
): Promise<{
  deeplink?: string;
  qrCodeUrl?: string;
  payUrl?: string;
  error?: string;
}> {
  const partnerCode = process.env.MOMO_PARTNER_CODE!;
  const accessKey = process.env.MOMO_ACCESS_KEY!;
  const redirectUrl = `${APP_URL}/wallet/topup/check/${orderId}`;
  const ipnUrl = `${APP_URL}/api/wallet/topup/postback`;
  const requestType = "captureWallet";
  const extraData = "";

  const rawSig = [
    `accessKey=${accessKey}`,
    `amount=${amount}`,
    `extraData=${extraData}`,
    `ipnUrl=${ipnUrl}`,
    `orderId=${orderId}`,
    `orderInfo=${orderInfo}`,
    `partnerCode=${partnerCode}`,
    `redirectUrl=${redirectUrl}`,
    `requestId=${requestId}`,
    `requestType=${requestType}`,
  ].join("&");

  const signature = momoSignature(rawSig);

  const body = {
    partnerCode,
    accessKey,
    requestId,
    amount,
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    extraData,
    requestType,
    signature,
    lang: "vi",
  };

  try {
    const res = await fetch("https://payment.momo.vn/v2/gateway/api/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.resultCode !== 0) {
      return { error: data.message ?? "MoMo error" };
    }
    return {
      deeplink: data.deeplink,
      qrCodeUrl: data.qrCodeUrl,
      payUrl: data.payUrl,
    };
  } catch {
    return { error: "Không thể kết nối MoMo" };
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────

/** POST /api/wallet/topup/create */
export async function POST(req: NextRequest) {
  const session = await getUserSession();
  if (!session)
    return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body)
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ" },
      { status: 400 },
    );

  const { packageId, method } = body;
  if (!["momo", "bank"].includes(method))
    return NextResponse.json(
      { error: "Phương thức không hợp lệ" },
      { status: 400 },
    );

  const pkg = getPackageById(packageId);
  if (!pkg)
    return NextResponse.json({ error: "Gói không tồn tại" }, { status: 404 });

  await connectDB();

  // Build a unique orderId (safe for MoMo: max 50 chars, alphanum + underscore)
  const timestamp = Date.now();
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
  const orderId = `VIBE_${timestamp}_${rand}`;
  const requestId = orderId; // MoMo reuses same value
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  // Limit to 1 pending order per user per package per method
  await TopupOrder.deleteMany({
    userId: String(session.userId),
    status: "pending",
    expiresAt: { $lt: new Date() },
  });

  let momoDeeplink: string | undefined;
  let momoQrCode: string | undefined;
  let momoPayUrl: string | undefined;

  if (method === "momo") {
    const orderInfo = `Nap ${pkg.coins} xu VibeDrama`;
    const result = await createMomoOrder(
      orderId,
      requestId,
      pkg.price,
      orderInfo,
    );
    if (result.error) {
      return NextResponse.json(
        {
          error:
            "Không thể tạo đơn MoMo. Vui lòng thử lại hoặc dùng chuyển khoản.",
        },
        { status: 502 },
      );
    }
    momoDeeplink = result.deeplink;
    momoQrCode = result.qrCodeUrl;
    momoPayUrl = result.payUrl;
  }

  const order = await TopupOrder.create({
    userId: String(session.userId),
    orderId,
    method,
    amount: pkg.price,
    coins: pkg.coins,
    packageId: pkg.id,
    packageLabel: pkg.label,
    bankTransferContent: orderId,
    status: "pending",
    momoRequestId: method === "momo" ? requestId : undefined,
    momoDeeplink,
    momoQrCode,
    momoPayUrl,
    expiresAt,
  });

  const bankAccount = process.env.TOPUP_BANK_ACCOUNT_NUMBER;
  const bankName = process.env.TOPUP_BANK_NAME;
  const bankCode = process.env.TOPUP_BANK_CODE;
  const bankAccountName = process.env.TOPUP_BANK_ACCOUNT_NAME;

  return NextResponse.json({
    orderId: order.orderId,
    method,
    amount: pkg.price,
    coins: pkg.coins,
    packageLabel: pkg.label,
    expiresAt: expiresAt.toISOString(),
    // MoMo
    momoDeeplink,
    momoQrCode,
    momoPayUrl,
    // Bank
    bankAccount,
    bankName,
    bankCode,
    bankAccountName,
    bankTransferContent: orderId,
    // VietQR URL for bank transfer QR
    vietQrUrl:
      method === "bank" && bankCode && bankAccount
        ? `https://img.vietqr.io/image/${bankCode}-${bankAccount}-compact2.jpg?amount=${pkg.price}&addInfo=${encodeURIComponent(orderId)}&accountName=${encodeURIComponent(bankAccountName ?? "")}`
        : undefined,
  });
}

/** GET /api/wallet/topup/create — list available packages */
export async function GET() {
  return NextResponse.json({ packages: COIN_PACKAGES });
}
