/**
 * Lighthouse Website Analysis API Route
 *
 * Analyzes any public website URL for performance, accessibility,
 * SEO, and best practices using Google PageSpeed Insights.
 */

import { NextRequest, NextResponse } from 'next/server';
import { LighthouseClient, LighthouseError } from '@/app/lib/lighthouse/client';
import { LighthouseRequestParams } from '@/app/lib/lighthouse/types';

// Server-side environment variable
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

export async function POST(request: NextRequest) {
  try {
    // Log environment check
    console.log('Lighthouse environment check:', {
      hasGoogleApiKey: !!GOOGLE_API_KEY,
      usingPageSpeedInsights: true,
      rateLimit: GOOGLE_API_KEY ? '25,000 requests/day' : '25 requests/day'
    });

    // Parse request body
    const body: LighthouseRequestParams = await request.json();
    const { url, strategy = 'mobile' } = body;

    // Validate required fields
    if (!url || url.trim() === '') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate strategy
    if (strategy && strategy !== 'mobile' && strategy !== 'desktop') {
      return NextResponse.json(
        { error: 'Strategy must be either "mobile" or "desktop"' },
        { status: 400 }
      );
    }

    console.log('[Lighthouse] Starting analysis:', {
      url,
      strategy,
      timestamp: new Date().toISOString()
    });

    // Create client and analyze
    const client = new LighthouseClient(GOOGLE_API_KEY);
    const analysis = await client.analyzeWebsite({ url, strategy });

    console.log('[Lighthouse] Analysis completed:', {
      url,
      strategy,
      performanceScore: analysis.scores.performance,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(analysis);

  } catch (error: any) {
    console.error('[Lighthouse API Error]', {
      error: error.message,
      statusCode: error.statusCode,
      details: error.details,
      stack: error.stack
    });

    // Handle Lighthouse-specific errors
    if (error instanceof LighthouseError) {
      return NextResponse.json(
        {
          error: error.message,
          details: error.details
        },
        { status: error.statusCode }
      );
    }

    // Handle unexpected errors
    return NextResponse.json(
      {
        error: 'Failed to analyze website',
        message: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
