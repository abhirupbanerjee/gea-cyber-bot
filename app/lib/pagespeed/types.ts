// ============================================
// PAGESPEED INSIGHTS API TYPES
// ============================================

// Core Web Vitals metrics
export interface CoreWebVitals {
  lcp: number;  // Largest Contentful Paint (ms)
  fid: number;  // First Input Delay (ms)
  cls: number;  // Cumulative Layout Shift
  fcp: number;  // First Contentful Paint (ms)
  ttfb: number; // Time to First Byte (ms)
}

// Lighthouse category scores (0-100)
export interface LighthouseScores {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

// Audit item (opportunity or diagnostic)
export interface AuditItem {
  id: string;
  title: string;
  description: string;
  score: number | null;
  displayValue?: string;
}

// ============================================
// NORMALIZED OUTPUT TYPES (For LLM consumption)
// ============================================

export interface PageSpeedResult {
  url: string;
  fetchTime: string;
  strategy: 'mobile' | 'desktop';
  scores: LighthouseScores;
  coreWebVitals: CoreWebVitals;
  opportunities: AuditItem[];  // Performance improvements
  diagnostics: AuditItem[];   // Performance info
}

// ============================================
// FUNCTION CALL TYPES
// ============================================

export interface AnalyzePerformanceArgs {
  targetUrl: string;
  strategy?: 'mobile' | 'desktop';
}

// ============================================
// ERROR TYPES
// ============================================

export class PageSpeedError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: string
  ) {
    super(message);
    this.name = 'PageSpeedError';
  }
}
