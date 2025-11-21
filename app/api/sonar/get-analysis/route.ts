import { NextRequest, NextResponse } from 'next/server';
import { findRepoByGithubUrl } from '@/app/lib/sonarcloud/config';
import { SonarCloudClient, SonarCloudError } from '@/app/lib/sonarcloud/client';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const { githubUrl, includeIssues = true } = await request.json();

    console.log('[Get Analysis]', {
      githubUrl,
      includeIssues,
      timestamp: new Date().toISOString()
    });

    if (!githubUrl || typeof githubUrl !== 'string') {
      return NextResponse.json(
        { error: 'GitHub URL is required' },
        { status: 400 }
      );
    }

    // Find repository configuration
    const repo = findRepoByGithubUrl(githubUrl);

    if (!repo) {
      console.log('[Get Analysis] Repository not configured:', githubUrl);
      return NextResponse.json(
        {
          error: 'Repository not configured',
          message: 'This repository is not configured in SonarCloud. Please add it to sonar-repos.json first.'
        },
        { status: 404 }
      );
    }

    // Check environment variables
    const token = process.env.SONARCLOUD_TOKEN;
    const organization = process.env.SONARCLOUD_ORGANIZATION;

    if (!token || !organization) {
      console.error('[Get Analysis] Missing SonarCloud configuration');
      return NextResponse.json(
        {
          error: 'SonarCloud not configured',
          message: 'Missing SONARCLOUD_TOKEN or SONARCLOUD_ORGANIZATION environment variables'
        },
        { status: 500 }
      );
    }

    // Initialize SonarCloud client
    const client = new SonarCloudClient(token, organization);

    // Get full analysis
    console.log('[Get Analysis] Fetching analysis for:', repo.sonarProjectKey);
    const analysis = await client.getFullAnalysis(repo.sonarProjectKey, repo);

    console.log('[Get Analysis] Success:', {
      projectKey: repo.sonarProjectKey,
      bugs: analysis.summary.bugs,
      vulnerabilities: analysis.summary.vulnerabilities
    });

    // Return normalized data
    return NextResponse.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('[Get Analysis] Error:', error);

    // Handle SonarCloud-specific errors
    if (error instanceof SonarCloudError) {
      return NextResponse.json(
        {
          error: error.message,
          statusCode: error.statusCode,
          details: error.details
        },
        { status: error.statusCode }
      );
    }

    // Handle generic errors
    return NextResponse.json(
      {
        error: 'Failed to fetch analysis',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
