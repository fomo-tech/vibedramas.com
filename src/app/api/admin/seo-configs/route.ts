import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import SeoConfig from "@/models/SeoConfig";
import { getSession } from "@/lib/auth";

// GET: Lấy SEO config theo page hoặc tất cả
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page");

    if (page) {
      const config = await SeoConfig.findOne({ page, isActive: true }).lean();
      return NextResponse.json(config || null);
    }

    // Lấy tất cả (admin only)
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const configs = await SeoConfig.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(configs);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 },
    );
  }
}

// POST: Tạo SEO config mới (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const {
      page,
      title,
      description,
      keywords,
      ogImage,
      ogType,
      twitterCard,
      canonicalUrl,
    } = body;

    if (!page || !title || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if config for this page already exists
    const existing = await SeoConfig.findOne({ page });
    if (existing) {
      return NextResponse.json(
        { error: "SEO config for this page already exists" },
        { status: 400 },
      );
    }

    const config = await SeoConfig.create({
      page,
      title,
      description,
      keywords: keywords || [],
      ogImage,
      ogType: ogType || "website",
      twitterCard: twitterCard || "summary_large_image",
      canonicalUrl,
      isActive: true,
    });

    return NextResponse.json(config, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 },
    );
  }
}

// PUT: Update SEO config
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const { configId, ...updateData } = body;

    if (!configId) {
      return NextResponse.json(
        { error: "Config ID is required" },
        { status: 400 },
      );
    }

    const config = await SeoConfig.findByIdAndUpdate(configId, updateData, {
      returnDocument: "after",
    });

    if (!config) {
      return NextResponse.json({ error: "Config not found" }, { status: 404 });
    }

    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 },
    );
  }
}

// DELETE: Xóa SEO config
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const configId = searchParams.get("id");

    if (!configId) {
      return NextResponse.json(
        { error: "Config ID is required" },
        { status: 400 },
      );
    }

    const config = await SeoConfig.findByIdAndDelete(configId);

    if (!config) {
      return NextResponse.json({ error: "Config not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Config deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 },
    );
  }
}
