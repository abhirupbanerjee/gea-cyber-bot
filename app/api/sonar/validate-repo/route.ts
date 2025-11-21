import { NextRequest, NextResponse } from 'next/server';
import {
  isValidGithubUrl,
  findRepoByGithubUrl
} from '@/app/lib/sonarcloud/config';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { githubUrl } = await request.json();

    console.log('[Validate Repo]', { githubUrl, timestamp: new Date().toISOString() });

    // Validate URL format
    if (!githubUrl || typeof githubUrl !== 'string') {
      return NextResponse.json(
        {
          valid: false,
          error: 'GitHub URL is required'
        },
        { status: 400 }
      );
    }

    if (!isValidGithubUrl(githubUrl)) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid GitHub URL format. Expected: https://github.com/owner/repo'
        },
        { status: 400 }
      );
    }

    // Load configured repos and find match
    const repo = findRepoByGithubUrl(githubUrl);

    if (repo) {
      console.log('[Validate Repo] Found:', repo.sonarProjectKey);
      return NextResponse.json({
        valid: true,
        projectKey: repo.sonarProjectKey,
        displayName: repo.displayName,
        lastSync: repo.lastSync,
        message: 'Repository is configured and ready for analysis'
      });
    } else {
      console.log('[Validate Repo] Not found:', githubUrl);
      return NextResponse.json({
        valid: false,
        error: 'Repository not configured in SonarCloud',
        message: 'Please ensure this repository is added to your SonarCloud organization and configured in sonar-repos.json'
      });
    }

  } catch (error) {
    console.error('[Validate Repo] Error:', error);
    return NextResponse.json(
      {
        valid: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
