import { NextResponse } from 'next/server';
import { runDailyMaintenance } from '../../../jobs';

export async function GET(request: Request) {
  // Always verify a secret key to prevent unauthorized execution
  const authHeader = request.headers.get('authorization');
  
  if (
    process.env.CRON_SECRET && 
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Run the specified cron job logic
    const result = await runDailyMaintenance();
    
    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }
    
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
