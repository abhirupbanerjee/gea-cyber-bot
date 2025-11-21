/**
 * Lighthouse Analysis Types
 *
 * Type definitions for Google PageSpeed Insights API responses
 * and normalized Lighthouse analysis data.
 */

/**
 * Raw PageSpeed Insights API Response
 */
export interface PageSpeedResponse {
  lighthouseResult: {
    finalUrl: string;
    fetchTime: string;
    categories: {
      performance: LighthouseCategory;
      accessibility: LighthouseCategory;
      'best-practices': LighthouseCategory;
      seo: LighthouseCategory;
    };
    audits: Record<string, LighthouseAudit>;
  };
  loadingExperience?: {
    metrics: Record<string, any>;
  };
  analysisUTCTimestamp: string;
}

export interface LighthouseCategory {
  id: string;
  title: string;
  score: number; // 0-1
}

export interface LighthouseAudit {
  id: string;
  title: string;
  description: string;
  score: number | null; // 0-1 or null
  scoreDisplayMode: string;
  displayValue?: string;
  numericValue?: number;
  numericUnit?: string;
  details?: any;
}

/**
 * Normalized Lighthouse Analysis
 */
export interface NormalizedLighthouseAnalysis {
  url: string;
  strategy: 'mobile' | 'desktop';
  analyzedAt: string;
  scores: {
    performance: number; // 0-100
    accessibility: number; // 0-100
    bestPractices: number; // 0-100
    seo: number; // 0-100
  };
  metrics: {
    firstContentfulPaint: MetricValue;
    largestContentfulPaint: MetricValue;
    totalBlockingTime: MetricValue;
    cumulativeLayoutShift: MetricValue;
    speedIndex: MetricValue;
  };
  opportunities: Opportunity[];
  diagnostics: Diagnostic[];
  recommendations: string[];
}

export interface MetricValue {
  value: number;
  unit: string;
  displayValue: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export interface Opportunity {
  title: string;
  description: string;
  savings: string;
  impact: 'high' | 'medium' | 'low';
}

export interface Diagnostic {
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
}

/**
 * Lighthouse Request Parameters
 */
export interface LighthouseRequestParams {
  url: string;
  strategy?: 'mobile' | 'desktop';
}
