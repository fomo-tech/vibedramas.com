import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { syncDramas } from '@/services/crawlerService';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Trigger sync for first 10 pages for a quick UI response
    // In a real app, you might want to use a background job/worker
    const total = await syncDramas(1, 10);

    return NextResponse.json({ success: true, count: total });
  } catch (error: any) {
    console.error('Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
