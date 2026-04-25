import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import HeroSlide from "@/models/HeroSlide";
import Drama from "@/models/Drama";
import { getSession } from "@/lib/auth";

// GET: Lấy danh sách hero slides (admin + client)
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const slides = await HeroSlide.find({ isActive: true })
      .sort({ order: 1 })
      .lean();

    // Populate drama data
    const dramaIds = slides.map((s) => s.dramaId);
    const dramas = await Drama.find({ _id: { $in: dramaIds } }).lean();
    const dramaMap = new Map(dramas.map((d) => [d._id.toString(), d]));

    const result = slides
      .map((slide) => ({
        _id: slide._id,
        order: slide.order,
        drama: dramaMap.get(slide.dramaId),
      }))
      .filter((s) => s.drama); // Chỉ lấy slide có drama tồn tại

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 },
    );
  }
}

// POST: Thêm hero slide (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const { dramaId } = body;

    if (!dramaId) {
      return NextResponse.json(
        { error: "Drama ID is required" },
        { status: 400 },
      );
    }

    // Check if drama exists
    const drama = await Drama.findById(dramaId);
    if (!drama) {
      return NextResponse.json({ error: "Drama not found" }, { status: 404 });
    }

    // Get max order
    const maxOrderSlide = await HeroSlide.findOne().sort({ order: -1 });
    const newOrder = maxOrderSlide ? maxOrderSlide.order + 1 : 1;

    const slide = await HeroSlide.create({
      dramaId,
      order: newOrder,
      isActive: true,
    });

    return NextResponse.json(slide, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 },
    );
  }
}

// PUT: Update order hoặc active status
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const { slideId, order, isActive } = body;

    if (!slideId) {
      return NextResponse.json(
        { error: "Slide ID is required" },
        { status: 400 },
      );
    }

    const updateData: any = {};
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;

    const slide = await HeroSlide.findByIdAndUpdate(slideId, updateData, {
      returnDocument: "after",
    });

    if (!slide) {
      return NextResponse.json({ error: "Slide not found" }, { status: 404 });
    }

    return NextResponse.json(slide);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 },
    );
  }
}

// DELETE: Xóa hero slide
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const slideId = searchParams.get("id");

    if (!slideId) {
      return NextResponse.json(
        { error: "Slide ID is required" },
        { status: 400 },
      );
    }

    const slide = await HeroSlide.findByIdAndDelete(slideId);

    if (!slide) {
      return NextResponse.json({ error: "Slide not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Slide deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 },
    );
  }
}
