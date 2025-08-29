import { NextResponse } from 'next/server';
import { db } from '@/server/db';

export async function GET() {
  try {
    // Test database connection
    const customerCount = await db.customer.count();
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      customerCount
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
