import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';

/**
 * Vercel Cron Job endpoint to keep Supabase database connection alive
 * 
 * This endpoint is called by Vercel Cron Jobs once per day (at midnight UTC)
 * to prevent Supabase from going into a paused state due to inactivity.
 * 
 * Note: Vercel Hobby plan only allows daily cron jobs (once per day).
 * For more frequent pings, upgrade to Pro plan or use external cron services.
 * 
 * Security: Protected by CRON_SECRET environment variable
 */
export async function GET(request: NextRequest) {
  try {
    // Security check - Vercel automatically adds Authorization header with CRON_SECRET
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET environment variable is not set');
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Perform a lightweight database query to keep the connection alive
    // This queries the Employee table (smallest table) with a limit of 1
    const result = await db.employee.findFirst({
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      ok: true,
      message: 'Database keep-alive ping successful',
      timestamp: new Date().toISOString(),
      database: 'connected',
      recordFound: !!result,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST method (some cron services use POST)
export const POST = GET;

