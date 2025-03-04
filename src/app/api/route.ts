import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Welcome to the Philly Social API',
    endpoints: {
      news: '/api/news'
    }
  });
} 