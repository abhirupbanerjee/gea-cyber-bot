import {
  PageSpeedResponse,
  NormalizedLighthouseAnalysis,
  LighthouseRequestParams
} from './types';
import { normalizeAnalysis } from './normalizer';

/**
 * Custom error class for Lighthouse API errors
 */
export class LighthouseError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'LighthouseError';
  }
}

/**
 * Lighthouse API Client using Google PageSpeed Insights API
 */
export class LighthouseClient {
  private baseURL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  /**
   * Analyze a website using PageSpeed Insights
   */
  async analyzeWebsite(params: LighthouseRequestParams): Promise<NormalizedLighthouseAnalysis> {
    const { url, strategy = 'mobile' } = params;

    // Validate URL
    if (!this.isValidUrl(url)) {
      throw new LighthouseError(
        'Invalid URL format. Please provide a full URL (e.g., https://example.com)',
        400
      );
    }

    console.log('[Lighthouse API]', {
      url,
      strategy,
      hasApiKey: !!this.apiKey,
      timestamp: new Date().toISOString()
    });

    try {
      const apiUrl = new URL(this.baseURL);
      apiUrl.searchParams.append('url', url);
      apiUrl.searchParams.append('strategy', strategy);
      apiUrl.searchParams.append('category', 'performance');
      apiUrl.searchParams.append('category', 'accessibility');
      apiUrl.searchParams.append('category', 'best-practices');
      apiUrl.searchParams.append('category', 'seo');

      if (this.apiKey) {
        apiUrl.searchParams.append('key', this.apiKey);
      }

      const response = await fetch(apiUrl.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Handle rate limiting
      if (response.status === 429) {
        throw new LighthouseError(
          'PageSpeed API rate limit exceeded. ' +
          (this.apiKey
            ? 'Please try again later.'
            : 'Consider adding GOOGLE_API_KEY for higher rate limits (25k/day vs 25/day).'),
          429
        );
      }

      // Handle authentication errors
      if (response.status === 401) {
        throw new LighthouseError(
          'Authentication failed. Check your Google API key.',
          401
        );
      }

      // Handle bad requests
      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}));
        throw new LighthouseError(
          errorData.error?.message || 'Invalid request. Check the URL format.',
          400,
          errorData
        );
      }

      // Handle server errors
      if (response.status >= 500) {
        throw new LighthouseError(
          'PageSpeed API server error. Please try again later.',
          response.status
        );
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Lighthouse API Error]', {
          status: response.status,
          url,
          strategy,
          errorData
        });
        throw new LighthouseError(
          errorData.error?.message || 'PageSpeed API request failed',
          response.status,
          errorData
        );
      }

      const data: PageSpeedResponse = await response.json();

      // Normalize the response
      return normalizeAnalysis(data, url, strategy);

    } catch (error) {
      if (error instanceof LighthouseError) {
        throw error;
      }

      // Network or other errors
      throw new LighthouseError(
        `Failed to analyze website: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
