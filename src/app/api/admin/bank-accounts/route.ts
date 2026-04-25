import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import BankAccount from "@/models/BankAccount";
import { getSession } from "@/lib/auth";

// GET: Lấy tất cả bank accounts (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const accounts = await BankAccount.find().sort({ createdAt: -1 }).lean();

    return NextResponse.json(accounts);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 },
    );
  }
}

// POST: Thêm bank account (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const { bankName, accountNumber, accountName, bankBranch } = body;

    if (!bankName || !accountNumber || !accountName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const account = await BankAccount.create({
      bankName,
      accountNumber,
      accountName,
      bankBranch,
      isActive: true,
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 },
    );
  }
}

// PUT: Update bank account
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const { accountId, ...updateData } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 },
      );
    }

    const account = await BankAccount.findByIdAndUpdate(accountId, updateData, {
      returnDocument: "after",
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 },
    );
  }
}

// DELETE: Xóa bank account
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("id");

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 },
      );
    }

    const account = await BankAccount.findByIdAndDelete(accountId);

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 },
    );
  }
}
