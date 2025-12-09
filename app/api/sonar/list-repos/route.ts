import { NextRequest, NextResponse } from 'next/server';
import { loadProjectsFromAPI } from '@/app/lib/sonarcloud/config';

export async function GET(request: NextRequest) {
  try {
    const repos = await loadProjectsFromAPI();

    // Return only the necessary info for display
    const repoList = repos.map(repo => ({
      githubUrl: repo.githubUrl,
      displayName: repo.displayName,
      sonarProjectKey: repo.sonarProjectKey,
      configured: repo.configured
    }));

    return NextResponse.json({
      success: true,
      repos: repoList,
      count: repoList.length
    });

  } catch (error) {
    console.error('[List Repos] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load repositories',
        repos: [],
        count: 0
      },
      { status: 500 }
    );
  }
}
