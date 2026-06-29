import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Episode from "@/models/Episode";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ dramaId: string }> },
) {
  try {
    await connectDB();

    // Next.js 15: params is now a Promise — must be awaited
    const { dramaId } = await params;

    if (!mongoose.Types.ObjectId.isValid(dramaId)) {
      return NextResponse.json({ error: "Invalid dramaId" }, { status: 400 });
    }

    const objectId = new mongoose.Types.ObjectId(dramaId);

    const episodes = await Episode.find({ dramaId: objectId }).lean();

    // Sort numerically — handles both "1","2","10" and "Tập 01","Tập 02" formats
    const sorted = (episodes as any[]).sort((a, b) => {
      // Extract the numeric part from any format: "1", "01", "Tập 01", "Episode 2"
      const extractNum = (name: string) => {
        const m = String(name).match(/\d+/);
        return m ? parseInt(m[0], 10) : Number.MAX_SAFE_INTEGER;
      };
      return extractNum(a.name) - extractNum(b.name);
    });

    return NextResponse.json(sorted);
  } catch (error: any) {
    console.error("Episodes API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch episodes" },
      { status: 500 },
    );
  }
}
