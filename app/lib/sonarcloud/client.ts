import {
  SonarProject,
  SonarMeasure,
  SonarIssue,
  NormalizedAnalysis,
  ConfiguredRepo
} from './types';
import {
  normalizeMetrics,
  normalizeRatings,
  categorizeIssues,
  generateRecommendations
} from './normalizer';

/**
 * Custom error class for SonarCloud API errors
 */
export class SonarCloudError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'SonarCloudError';
  }
}

/**
 * SonarCloud API Client
 */
export class SonarCloudClient {
  private baseURL = 'https://sonarcloud.io/api';
  private token: string;
  private organization: string;

  constructor(token: string, organization: string) {
    this.token = token;
    this.organization = organization;
  }

  /**
   * Core HTTP request method with error handling
   */
  private async request<T>(
    endpoint: string,
    params?: Record<string, string>
  ): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`);

    // Add query parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    console.log('[SonarCloud API]', {
      endpoint,
      params,
      timestamp: new Date().toISOString()
    });

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      // Handle rate limiting
      if (response.status === 429) {
        throw new SonarCloudError(
          'Rate limit exceeded. Please try again later.',
          429
        );
      }

      // Handle authentication errors
      if (response.status === 401) {
        throw new SonarCloudError(
          'Authentication failed. Check your SonarCloud token.',
          401
        );
      }

      // Handle not found
      if (response.status === 404) {
        throw new SonarCloudError(
          'Resource not found. Check project key and organization.',
          404
        );
      }

      // Handle server errors with retry
      if (response.status >= 500) {
        throw new SonarCloudError(
          'SonarCloud server error. Please try again.',
          response.status
        );
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[SonarCloud API Error]', {
          status: response.status,
          endpoint,
          params,
          errorData
        });
        throw new SonarCloudError(
          errorData.message || errorData.error?.message || 'SonarCloud API request failed',
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof SonarCloudError) {
        throw error;
      }

      // Network or other errors
      throw new SonarCloudError(
        `Failed to connect to SonarCloud: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Get project information
   */
  async getProject(projectKey: string): Promise<SonarProject> {
    interface ProjectsResponse {
      components: SonarProject[];
    }

    const response = await this.request<ProjectsResponse>('/projects/search', {
      projects: projectKey,
      organization: this.organization
    });

    if (!response.components || response.components.length === 0) {
      throw new SonarCloudError(
        `Project not found: ${projectKey}`,
        404
      );
    }

    return response.components[0];
  }

  /**
   * Get metrics for a project
   */
  async getMetrics(
    projectKey: string,
    metricKeys: string[]
  ): Promise<SonarMeasure> {
    const response = await this.request<SonarMeasure>('/measures/component', {
      component: projectKey,
      metricKeys: metricKeys.join(',')
    });

    return response;
  }

  /**
   * Get issues for a project
   */
  async getIssues(
    projectKey: string,
    severities?: string[],
    types?: string[]
  ): Promise<SonarIssue[]> {
    interface IssuesResponse {
      issues: SonarIssue[];
      total: number;
      p: number;
      ps: number;
    }

    const params: Record<string, string> = {
      componentKeys: projectKey,
      ps: '500' // Max results (no pagination for now)
    };

    if (severities && severities.length > 0) {
      params.severities = severities.join(',');
    }

    if (types && types.length > 0) {
      params.types = types.join(',');
    }

    const response = await this.request<IssuesResponse>('/issues/search', params);

    return response.issues || [];
  }

  /**
   * Get security hotspots for a project
   */
  async getHotspots(projectKey: string): Promise<any[]> {
    interface HotspotsResponse {
      hotspots: any[];
    }

    const response = await this.request<HotspotsResponse>('/hotspots/search', {
      projectKey
    });

    return response.hotspots || [];
  }

  /**
   * Get full analysis for a project (orchestrates multiple API calls)
   */
  async getFullAnalysis(
    projectKey: string,
    repoConfig: ConfiguredRepo
  ): Promise<NormalizedAnalysis> {
    try {
      // Define metrics to fetch
      const metricKeys = [
        'bugs',
        'vulnerabilities',
        'security_hotspots',
        'code_smells',
        'coverage',
        'duplicated_lines_density',
        'ncloc',
        'sqale_index',
        'reliability_rating',
        'security_rating',
        'sqale_rating'
      ];

      // Fetch all data in parallel
      const [project, measures, issues] = await Promise.all([
        this.getProject(projectKey),
        this.getMetrics(projectKey, metricKeys),
        this.getIssues(projectKey)
      ]);

      // Normalize data
      const summary = normalizeMetrics(measures);
      const ratings = normalizeRatings(measures);
      const categorizedIssues = categorizeIssues(issues);
      const recommendations = generateRecommendations(summary, categorizedIssues);

      return {
        repository: {
          githubUrl: repoConfig.githubUrl,
          sonarProjectKey: projectKey,
          displayName: repoConfig.displayName,
          lastAnalysisDate: project.lastAnalysisDate || 'N/A'
        },
        summary,
        ratings,
        issues: categorizedIssues,
        recommendations
      };
    } catch (error) {
      if (error instanceof SonarCloudError) {
        throw error;
      }

      throw new SonarCloudError(
        `Failed to fetch analysis: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }
}
