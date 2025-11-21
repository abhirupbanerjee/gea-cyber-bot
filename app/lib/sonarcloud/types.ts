// ============================================
// SONARCLOUD API RESPONSE TYPES
// ============================================

export interface SonarProject {
  key: string;
  name: string;
  qualifier: string;
  visibility: 'public' | 'private';
  lastAnalysisDate?: string;
  revision?: string;
}

export interface SonarMetric {
  metric: string;
  value: string;
  bestValue?: boolean;
}

export interface SonarMeasure {
  component: {
    id: string;
    key: string;
    name: string;
    qualifier: string;
    measures: SonarMetric[];
  };
}

export interface SonarIssue {
  key: string;
  rule: string;
  severity: 'BLOCKER' | 'CRITICAL' | 'MAJOR' | 'MINOR' | 'INFO';
  component: string;
  line?: number;
  message: string;
  type: 'BUG' | 'VULNERABILITY' | 'CODE_SMELL' | 'SECURITY_HOTSPOT';
  status: string;
  creationDate: string;
}

// ============================================
// NORMALIZED OUTPUT TYPES (For LLM consumption)
// ============================================

export interface NormalizedAnalysis {
  repository: {
    githubUrl: string;
    sonarProjectKey: string;
    displayName: string;
    lastAnalysisDate: string;
  };
  summary: {
    bugs: number;
    vulnerabilities: number;
    securityHotspots: number;
    codeSmells: number;
    coverage: number;
    duplication: number;
    linesOfCode: number;
    technicalDebtMinutes: number;
  };
  ratings: {
    reliability: string;
    security: string;
    maintainability: string;
  };
  issues: {
    critical: SonarIssue[];
    high: SonarIssue[];
    medium: SonarIssue[];
    low: SonarIssue[];
  };
  recommendations: string[];
}

// ============================================
// CONFIGURATION TYPES
// ============================================

export interface ConfiguredRepo {
  githubUrl: string;
  sonarProjectKey: string;
  displayName: string;
  branch: string;
  configured: boolean;
  lastSync: string;
}

export interface SonarRepoConfig {
  repositories: ConfiguredRepo[];
}

// ============================================
// FUNCTION CALL TYPES
// ============================================

export interface ValidateRepoArgs {
  githubUrl: string;
}

export interface GetAnalysisArgs {
  githubUrl: string;
  includeIssues?: boolean;
}
