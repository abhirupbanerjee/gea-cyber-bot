import {
  PageSpeedResult,
  PageSpeedError,
  LighthouseScores,
  CoreWebVitals,
  AuditItem
} from './types';

const BASE_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

export class PageSpeedClient {
  private apiKey?: string;

  constructor() {
    this.apiKey = process.env.PAGESPEED_API_KEY;
  }

  async analyze(
    url: string,
    strategy: 'mobile' | 'desktop' = 'mobile'
  ): Promise<PageSpeedResult> {
    // Build URL with proper category handling
    const params = new URLSearchParams({
      url,
      strategy,
    });

    // Add multiple category parameters
    ['performance', 'accessibility', 'best-practices', 'seo'].forEach(cat => {
      params.append('category', cat);
    });

    if (this.apiKey) {
      params.append('key', this.apiKey);
    }

    const requestUrl = `${BASE_URL}?${params.toString()}`;
    console.log('[PageSpeed] Requesting analysis for:', url, 'strategy:', strategy);

    const response = await fetch(requestUrl);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[PageSpeed] API error:', errorData);
      throw new PageSpeedError(
        errorData.error?.message || 'PageSpeed API request failed',
        response.status,
        JSON.stringify(errorData)
      );
    }

    const data = await response.json();
    return this.normalizeResponse(data, strategy);
  }

  private normalizeResponse(
    data: any,
    strategy: 'mobile' | 'desktop'
  ): PageSpeedResult {
    const lighthouse = data.lighthouseResult;
    const categories = lighthouse?.categories || {};
    const audits = lighthouse?.audits || {};

    // Extract scores (convert 0-1 to 0-100)
    const scores: LighthouseScores = {
      performance: Math.round((categories.performance?.score || 0) * 100),
      accessibility: Math.round((categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
      seo: Math.round((categories.seo?.score || 0) * 100),
    };

    // Extract Core Web Vitals
    const coreWebVitals: CoreWebVitals = {
      lcp: Math.round(audits['largest-contentful-paint']?.numericValue || 0),
      fid: Math.round(audits['max-potential-fid']?.numericValue || 0),
      cls: Number((audits['cumulative-layout-shift']?.numericValue || 0).toFixed(3)),
      fcp: Math.round(audits['first-contentful-paint']?.numericValue || 0),
      ttfb: Math.round(audits['server-response-time']?.numericValue || 0),
    };

    // Extract opportunities (actionable improvements)
    const opportunities: AuditItem[] = Object.values(audits)
      .filter((audit: any) =>
        audit.details?.type === 'opportunity' &&
        audit.score !== null &&
        audit.score < 1
      )
      .sort((a: any, b: any) => (a.score || 0) - (b.score || 0))
      .slice(0, 5)
      .map((audit: any) => ({
        id: audit.id,
        title: audit.title,
        description: audit.description,
        score: audit.score,
        displayValue: audit.displayValue,
      }));

    // Extract diagnostics (informational items)
    const diagnostics: AuditItem[] = Object.values(audits)
      .filter((audit: any) =>
        audit.details?.type === 'table' &&
        audit.score !== null &&
        audit.score < 1
      )
      .sort((a: any, b: any) => (a.score || 0) - (b.score || 0))
      .slice(0, 5)
      .map((audit: any) => ({
        id: audit.id,
        title: audit.title,
        description: audit.description,
        score: audit.score,
        displayValue: audit.displayValue,
      }));

    console.log('[PageSpeed] Analysis complete:', {
      url: data.id,
      performanceScore: scores.performance,
      opportunities: opportunities.length,
      diagnostics: diagnostics.length
    });

    return {
      url: data.id,
      fetchTime: data.analysisUTCTimestamp,
      strategy,
      scores,
      coreWebVitals,
      opportunities,
      diagnostics,
    };
  }
}
