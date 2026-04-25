import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Episode from '@/models/Episode';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ dramaId: string }> }
) {
  try {
    await connectDB();

    // Next.js 15: params is now a Promise — must be awaited
    const { dramaId } = await params;

    if (!mongoose.Types.ObjectId.isValid(dramaId)) {
      return NextResponse.json({ error: 'Invalid dramaId' }, { status: 400 });
    }

    const objectId = new mongoose.Types.ObjectId(dramaId);

    const episodes = await Episode.find({ dramaId: objectId }).lean();

    // Sort numerically (episode names: "1","2","10" not "1","10","2")
    const sorted = (episodes as any[]).sort((a, b) => {
      const numA = parseInt(a.name, 10);
      const numB = parseInt(b.name, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return String(a.name).localeCompare(String(b.name));
    });

    return NextResponse.json(sorted);
  } catch (error: any) {
    console.error('Episodes API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch episodes' }, { status: 500 });
  }
}
