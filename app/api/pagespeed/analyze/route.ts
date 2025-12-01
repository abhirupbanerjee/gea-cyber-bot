import { NextRequest, NextResponse } from 'next/server';
import { PageSpeedClient, PageSpeedError } from '@/app/lib/pagespeed';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetUrl, strategy = 'mobile' } = body;

    // Validate URL is provided
    if (!targetUrl) {
      return NextResponse.json(
        { success: false, error: 'targetUrl is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(targetUrl);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format. Please provide a full URL (e.g., https://example.com)' },
        { status: 400 }
      );
    }

    // Validate strategy
    if (strategy && !['mobile', 'desktop'].includes(strategy)) {
      return NextResponse.json(
        { success: false, error: 'strategy must be "mobile" or "desktop"' },
        { status: 400 }
      );
    }

    console.log('[PageSpeed Route] Analyzing:', targetUrl, 'strategy:', strategy);

    const client = new PageSpeedClient();
    const result = await client.analyze(targetUrl, strategy);

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    if (error instanceof PageSpeedError) {
      console.error('[PageSpeed Route] API Error:', error.message, error.statusCode);
      return NextResponse.json(
        { success: false, error: error.message, details: error.details },
        { status: error.statusCode >= 400 && error.statusCode < 600 ? error.statusCode : 500 }
      );
    }

    console.error('[PageSpeed Route] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
