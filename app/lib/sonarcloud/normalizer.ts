import { SonarMeasure, SonarIssue, NormalizedAnalysis } from './types';

/**
 * Normalize metrics from SonarCloud API response into summary object
 */
export function normalizeMetrics(measures: SonarMeasure): NormalizedAnalysis['summary'] {
  const metrics = measures.component.measures;

  const getMetricValue = (key: string): number => {
    const metric = metrics.find(m => m.metric === key);
    return metric ? parseFloat(metric.value) || 0 : 0;
  };

  return {
    bugs: getMetricValue('bugs'),
    vulnerabilities: getMetricValue('vulnerabilities'),
    securityHotspots: getMetricValue('security_hotspots'),
    codeSmells: getMetricValue('code_smells'),
    coverage: getMetricValue('coverage'),
    duplication: getMetricValue('duplicated_lines_density'),
    linesOfCode: getMetricValue('ncloc'),
    technicalDebtMinutes: getMetricValue('sqale_index')
  };
}

/**
 * Normalize ratings from SonarCloud API response
 */
export function normalizeRatings(measures: SonarMeasure): NormalizedAnalysis['ratings'] {
  const metrics = measures.component.measures;

  const getRating = (key: string): string => {
    const metric = metrics.find(m => m.metric === key);
    return metric ? ratingToLabel(metric.value) : 'N/A';
  };

  return {
    reliability: getRating('reliability_rating'),
    security: getRating('security_rating'),
    maintainability: getRating('sqale_rating')
  };
}

/**
 * Categorize issues by severity
 */
export function categorizeIssues(issues: SonarIssue[]): NormalizedAnalysis['issues'] {
  const categorized = {
    critical: [] as SonarIssue[],
    high: [] as SonarIssue[],
    medium: [] as SonarIssue[],
    low: [] as SonarIssue[]
  };

  issues.forEach(issue => {
    if (issue.severity === 'BLOCKER' || issue.severity === 'CRITICAL') {
      categorized.critical.push(issue);
    } else if (issue.severity === 'MAJOR') {
      categorized.high.push(issue);
    } else if (issue.severity === 'MINOR') {
      categorized.medium.push(issue);
    } else {
      categorized.low.push(issue);
    }
  });

  return categorized;
}

/**
 * Generate recommendations based on metrics and issues
 */
export function generateRecommendations(
  summary: NormalizedAnalysis['summary'],
  issues: NormalizedAnalysis['issues']
): string[] {
  const recommendations: string[] = [];

  // Coverage recommendations
  if (summary.coverage < 80) {
    recommendations.push(
      `Code coverage is ${summary.coverage.toFixed(1)}%. Consider increasing test coverage to at least 80%.`
    );
  }

  // Bug recommendations
  if (summary.bugs > 0) {
    recommendations.push(
      `Found ${summary.bugs} bug${summary.bugs > 1 ? 's' : ''}. Prioritize fixing bugs to improve reliability.`
    );
  }

  // Vulnerability recommendations
  if (summary.vulnerabilities > 0) {
    recommendations.push(
      `Found ${summary.vulnerabilities} security ${summary.vulnerabilities > 1 ? 'vulnerabilities' : 'vulnerability'}. Address immediately.`
    );
  }

  // Security hotspots
  if (summary.securityHotspots > 0) {
    recommendations.push(
      `Review ${summary.securityHotspots} security hotspot${summary.securityHotspots > 1 ? 's' : ''} for potential vulnerabilities.`
    );
  }

  // Code smells
  if (summary.codeSmells > 50) {
    recommendations.push(
      `High number of code smells (${summary.codeSmells}). Consider refactoring to improve maintainability.`
    );
  }

  // Duplication
  if (summary.duplication > 5) {
    recommendations.push(
      `Code duplication is ${summary.duplication.toFixed(1)}%. Look for opportunities to reduce duplication.`
    );
  }

  // Technical debt
  const debtHours = summary.technicalDebtMinutes / 60;
  if (debtHours > 40) {
    recommendations.push(
      `Technical debt is approximately ${Math.round(debtHours)} hours. Plan refactoring efforts to reduce debt.`
    );
  }

  // Critical issues
  if (issues.critical.length > 0) {
    recommendations.push(
      `Address ${issues.critical.length} critical issue${issues.critical.length > 1 ? 's' : ''} as highest priority.`
    );
  }

  // Default recommendation if everything looks good
  if (recommendations.length === 0) {
    recommendations.push(
      'Code quality metrics look good! Continue maintaining current standards.'
    );
  }

  return recommendations;
}

/**
 * Convert SonarCloud rating (1-5) to letter grade (A-E)
 */
export function ratingToLabel(rating: string): string {
  const ratingMap: Record<string, string> = {
    '1': 'A',
    '2': 'B',
    '3': 'C',
    '4': 'D',
    '5': 'E'
  };

  return ratingMap[rating] || rating;
}
