import { NextResponse } from 'next/server';

// GET /api/health - Health check endpoint for Render
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
