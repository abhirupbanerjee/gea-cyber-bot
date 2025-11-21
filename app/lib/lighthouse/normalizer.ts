import {
  PageSpeedResponse,
  NormalizedLighthouseAnalysis,
  MetricValue,
  Opportunity,
  Diagnostic
} from './types';

/**
 * Normalize PageSpeed Insights response to our format
 */
export function normalizeAnalysis(
  response: PageSpeedResponse,
  url: string,
  strategy: 'mobile' | 'desktop'
): NormalizedLighthouseAnalysis {
  const { lighthouseResult } = response;
  const { categories, audits } = lighthouseResult;

  return {
    url,
    strategy,
    analyzedAt: response.analysisUTCTimestamp,
    scores: normalizeScores(categories),
    metrics: normalizeMetrics(audits),
    opportunities: extractOpportunities(audits),
    diagnostics: extractDiagnostics(audits),
    recommendations: generateRecommendations(categories, audits)
  };
}

/**
 * Convert category scores from 0-1 to 0-100
 */
function normalizeScores(categories: PageSpeedResponse['lighthouseResult']['categories']) {
  return {
    performance: Math.round((categories.performance?.score || 0) * 100),
    accessibility: Math.round((categories.accessibility?.score || 0) * 100),
    bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
    seo: Math.round((categories.seo?.score || 0) * 100)
  };
}

/**
 * Extract and normalize core web vitals metrics
 */
function normalizeMetrics(audits: Record<string, any>) {
  return {
    firstContentfulPaint: normalizeMetric(audits['first-contentful-paint']),
    largestContentfulPaint: normalizeMetric(audits['largest-contentful-paint']),
    totalBlockingTime: normalizeMetric(audits['total-blocking-time']),
    cumulativeLayoutShift: normalizeMetric(audits['cumulative-layout-shift']),
    speedIndex: normalizeMetric(audits['speed-index'])
  };
}

/**
 * Normalize a single metric with rating
 */
function normalizeMetric(audit: any): MetricValue {
  if (!audit) {
    return {
      value: 0,
      unit: 'ms',
      displayValue: 'N/A',
      rating: 'poor'
    };
  }

  const score = audit.score || 0;
  let rating: 'good' | 'needs-improvement' | 'poor';

  if (score >= 0.9) {
    rating = 'good';
  } else if (score >= 0.5) {
    rating = 'needs-improvement';
  } else {
    rating = 'poor';
  }

  return {
    value: audit.numericValue || 0,
    unit: audit.numericUnit || 'ms',
    displayValue: audit.displayValue || 'N/A',
    rating
  };
}

/**
 * Extract performance opportunities
 */
function extractOpportunities(audits: Record<string, any>): Opportunity[] {
  const opportunities: Opportunity[] = [];

  const opportunityAudits = [
    'render-blocking-resources',
    'unused-css-rules',
    'unused-javascript',
    'modern-image-formats',
    'offscreen-images',
    'unminified-css',
    'unminified-javascript',
    'efficient-animated-content',
    'duplicated-javascript',
    'legacy-javascript'
  ];

  for (const auditId of opportunityAudits) {
    const audit = audits[auditId];
    if (audit && audit.score !== null && audit.score < 1) {
      const savings = audit.details?.overallSavingsMs
        ? `${Math.round(audit.details.overallSavingsMs)}ms`
        : audit.displayValue || 'Unknown';

      let impact: 'high' | 'medium' | 'low';
      if (audit.score < 0.5) {
        impact = 'high';
      } else if (audit.score < 0.9) {
        impact = 'medium';
      } else {
        impact = 'low';
      }

      opportunities.push({
        title: audit.title,
        description: audit.description,
        savings,
        impact
      });
    }
  }

  // Sort by impact (high -> medium -> low)
  const impactOrder = { high: 0, medium: 1, low: 2 };
  return opportunities.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);
}

/**
 * Extract diagnostics and issues
 */
function extractDiagnostics(audits: Record<string, any>): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  const diagnosticAudits = [
    'mainthread-work-breakdown',
    'bootup-time',
    'uses-long-cache-ttl',
    'total-byte-weight',
    'dom-size',
    'critical-request-chains',
    'redirects',
    'uses-responsive-images',
    'server-response-time'
  ];

  for (const auditId of diagnosticAudits) {
    const audit = audits[auditId];
    if (audit && audit.score !== null && audit.score < 0.9) {
      let severity: 'critical' | 'warning' | 'info';
      if (audit.score < 0.5) {
        severity = 'critical';
      } else if (audit.score < 0.9) {
        severity = 'warning';
      } else {
        severity = 'info';
      }

      diagnostics.push({
        title: audit.title,
        description: audit.description,
        severity
      });
    }
  }

  return diagnostics;
}

/**
 * Generate actionable recommendations based on analysis
 */
function generateRecommendations(
  categories: PageSpeedResponse['lighthouseResult']['categories'],
  audits: Record<string, any>
): string[] {
  const recommendations: string[] = [];
  const scores = normalizeScores(categories);

  // Performance recommendations
  if (scores.performance < 50) {
    recommendations.push('🚨 CRITICAL: Performance score is very low. Focus on reducing JavaScript execution time and optimizing images.');
  } else if (scores.performance < 90) {
    recommendations.push('⚠️ Performance needs improvement. Consider lazy loading images and deferring non-critical JavaScript.');
  }

  // Check specific metrics
  const lcp = audits['largest-contentful-paint'];
  if (lcp && lcp.numericValue > 2500) {
    recommendations.push('Largest Contentful Paint is slow. Optimize your largest image or text block above the fold.');
  }

  const tbt = audits['total-blocking-time'];
  if (tbt && tbt.numericValue > 300) {
    recommendations.push('Total Blocking Time is high. Reduce JavaScript execution time and break up long tasks.');
  }

  const cls = audits['cumulative-layout-shift'];
  if (cls && cls.numericValue > 0.1) {
    recommendations.push('Cumulative Layout Shift detected. Add size attributes to images and avoid inserting content above existing content.');
  }

  // Accessibility recommendations
  if (scores.accessibility < 90) {
    recommendations.push('Improve accessibility: Add alt text to images, ensure proper heading hierarchy, and verify color contrast.');
  }

  // SEO recommendations
  if (scores.seo < 90) {
    recommendations.push('Enhance SEO: Ensure meta descriptions exist, use descriptive link text, and verify mobile-friendliness.');
  }

  // Best practices
  if (scores.bestPractices < 90) {
    recommendations.push('Follow best practices: Use HTTPS, avoid deprecated APIs, and ensure proper image aspect ratios.');
  }

  // Add image optimization recommendation
  if (audits['modern-image-formats']?.score < 1 || audits['uses-optimized-images']?.score < 1) {
    recommendations.push('Optimize images: Convert to WebP/AVIF format and compress images without losing quality.');
  }

  // Add caching recommendation
  if (audits['uses-long-cache-ttl']?.score < 0.9) {
    recommendations.push('Improve caching: Set proper cache headers for static resources to reduce repeat visitor load times.');
  }

  return recommendations.length > 0
    ? recommendations
    : ['✅ Great job! All scores are good. Keep monitoring and maintaining these standards.'];
}
