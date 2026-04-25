import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Drama from '@/models/Drama';
import { getCache, setCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || '';
    const featured = searchParams.get('featured') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    const cacheKey = `public:dramas:${category}:${featured}:${limit}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    await connectDB();

    const query: any = {};
    if (category) {
      query['category.name'] = category;
    }

    let dramas;
    if (featured) {
      // For featured, get top viewed or curated
      dramas = await Drama.find(query)
        .sort({ view: -1 })
        .limit(5)
        .lean();
    } else {
      dramas = await Drama.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
    }

    const responseData = JSON.parse(JSON.stringify(dramas));
    
    // Cache public data for 5 minutes
    await setCache(cacheKey, responseData, 300);

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Public API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch dramas' }, { status: 500 });
  }
}
