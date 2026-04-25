import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import WithdrawRequest from "@/models/WithdrawRequest";
import User from "@/models/User";
import { getSession } from "@/lib/auth";

// GET: Admin lấy tất cả withdraw requests
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

    const requests = await WithdrawRequest.find(query)
      .populate("userId", "username email coins")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await WithdrawRequest.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Map to component-expected shape
    const withdrawals = requests.map((r: any) => ({
      _id: String(r._id),
      user: {
        _id: String(r.userId?._id ?? r.userId ?? ""),
        name: r.userId?.name ?? r.userId?.username ?? "N/A",
        email: r.userId?.email ?? "",
      },
      amount: r.amount,
      paymentMethod: r.paymentMethodSnapshot?.type ?? "bank",
      paymentDetails: {
        bankName: r.paymentMethodSnapshot?.bankName ?? "",
        accountNumber: r.paymentMethodSnapshot?.accountNumber ?? "",
        accountName: r.paymentMethodSnapshot?.accountName ?? "",
      },
      status: r.status,
      adminNote: r.adminNote,
      userNote: r.userNote,
      createdAt: r.createdAt,
      processedAt: r.processedAt,
    }));

    return NextResponse.json({ withdrawals, totalPages, total });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 },
    );
  }
}

// PUT: Admin duyệt/từ chối withdraw request
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const { requestId, id, action, adminNote } = body;
    const targetId = requestId ?? id; // support both field names

    if (!targetId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const request = await WithdrawRequest.findById(targetId);
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (request.status !== "pending" && request.status !== "processing") {
      return NextResponse.json(
        { error: "Request đã được xử lý" },
        { status: 400 },
      );
    }

    // Lấy admin user
    const adminUser = await User.findById(session.userId);
    if (!adminUser) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    if (action === "approve" || action === "completed") {
      // Hoàn thành rút tiền - tiền đã trừ từ trước
      request.status = "completed";
      request.adminNote = adminNote || "Đã chuyển tiền";
      request.processedBy = adminUser._id.toString();
      request.processedAt = new Date();
    } else if (action === "reject" || action === "cancel") {
      // Từ chối - hoàn tiền lại cho user
      request.status = "rejected";
      request.adminNote = adminNote || "Yêu cầu bị từ chối";
      request.processedBy = adminUser._id.toString();
      request.processedAt = new Date();

      // Hoàn tiền
      const user = await User.findById(request.userId);
      if (user) {
        user.coins += request.amount;
        await user.save();
      }
    }

    await request.save();

    return NextResponse.json({
      message: "Đã xử lý yêu cầu",
      request,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 },
    );
  }
}
