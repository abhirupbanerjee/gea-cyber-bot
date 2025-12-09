import { ConfiguredRepo, SonarRepoConfig } from './types';
import * as fs from 'fs';
import * as path from 'path';

// Cache for configured repos
let cachedRepos: ConfiguredRepo[] | null = null;

/**
 * Load configured repositories from sonar-repos.json
 * Handles both local development and Vercel deployment paths
 */
export function loadConfiguredRepos(): ConfiguredRepo[] {
  if (cachedRepos) {
    console.log('[Config] Using cached repos:', cachedRepos.length);
    return cachedRepos;
  }

  try {
    const cwd = process.cwd();
    console.log('[Config] Current working directory:', cwd);

    // Try primary path first: public/config/sonar-repos.json (for Vercel)
    let configPath = path.join(cwd, 'public', 'config', 'sonar-repos.json');

    // Fallback: app/config/sonar-repos.json (for local dev if public doesn't exist)
    if (!fs.existsSync(configPath)) {
      console.warn('[Config] Primary path not found:', configPath);
      configPath = path.join(cwd, 'app', 'config', 'sonar-repos.json');

      if (!fs.existsSync(configPath)) {
        console.error('[Config] Config file not found at any location!');
        console.error('[Config] Checked paths:');
        console.error('  -', path.join(cwd, 'public', 'config', 'sonar-repos.json'));
        console.error('  -', path.join(cwd, 'app', 'config', 'sonar-repos.json'));
        return [];
      } else {
        console.log('[Config] Using fallback path:', configPath);
      }
    } else {
      console.log('[Config] Using primary path:', configPath);
    }

    const fileContent = fs.readFileSync(configPath, 'utf-8');
    const config: SonarRepoConfig = JSON.parse(fileContent);

    cachedRepos = config.repositories || [];
    console.log(`[Config] Successfully loaded ${cachedRepos.length} repositories`);
    return cachedRepos;
  } catch (error) {
    console.error('[Config] Failed to load sonar-repos.json:', error);
    return [];
  }
}

/**
 * Find a repository configuration by GitHub URL
 */
export function findRepoByGithubUrl(url: string): ConfiguredRepo | null {
  const repos = loadConfiguredRepos();
  const normalizedUrl = normalizeGithubUrl(url);

  const found = repos.find(repo =>
    normalizeGithubUrl(repo.githubUrl) === normalizedUrl
  ) || null;

  if (!found) {
    console.log('[Config] Repository not found for URL:', url);
    console.log('[Config] Normalized URL:', normalizedUrl);
    console.log('[Config] Available repos:', repos.map(r => normalizeGithubUrl(r.githubUrl)));
  } else {
    console.log('[Config] Found repository:', found.displayName);
  }

  return found;
}

/**
 * Validate if a string is a valid GitHub URL
 */
export function isValidGithubUrl(url: string): boolean {
  const githubUrlPattern = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+(\.git)?\/?$/i;
  return githubUrlPattern.test(url);
}

/**
 * Parse GitHub URL to extract owner and repo name
 */
export function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/?$/);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, '')
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Normalize GitHub URL (remove trailing slashes, .git extensions)
 */
function normalizeGithubUrl(url: string): string {
  return url
    .toLowerCase()
    .replace(/\/$/, '')
    .replace(/\.git$/, '');
}

/**
 * Clear cached repos (useful for testing)
 */
export function clearCache(): void {
  cachedRepos = null;
}

/**
 * Infer GitHub URL from SonarCloud project key
 * Convention: owner_repo -> https://github.com/owner/repo
 */
function inferGitHubUrl(projectKey: string): string {
  const parts = projectKey.split('_');
  if (parts.length >= 2) {
    return `https://github.com/${parts[0]}/${parts.slice(1).join('_')}`;
  }
  return `https://github.com/${projectKey}`;
}

/**
 * Load projects dynamically from SonarCloud API
 * Falls back to static config if API fails or env vars missing
 */
export async function loadProjectsFromAPI(): Promise<ConfiguredRepo[]> {
  const token = process.env.SONARCLOUD_TOKEN;
  const organization = process.env.SONARCLOUD_ORGANIZATION;

  if (!token || !organization) {
    console.warn('[Config] Missing env vars, falling back to static config');
    return loadConfiguredRepos();
  }

  try {
    const url = new URL('https://sonarcloud.io/api/projects/search');
    url.searchParams.append('organization', organization);
    url.searchParams.append('ps', '100');

    const response = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${token}` },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`SonarCloud API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[Config] Fetched ${data.components?.length || 0} projects from SonarCloud API`);

    return (data.components || []).map((project: any) => ({
      githubUrl: inferGitHubUrl(project.key),
      sonarProjectKey: project.key,
      displayName: project.name,
      configured: true,
      branch: 'main',
      lastSync: project.lastAnalysisDate
    }));
  } catch (error) {
    console.error('[Config] API fetch failed, falling back to static config:', error);
    return loadConfiguredRepos();
  }
}

/**
 * Find a repository by SonarCloud project key
 */
export function findRepoByProjectKey(projectKey: string): ConfiguredRepo | null {
  const repos = loadConfiguredRepos();
  return repos.find(repo => repo.sonarProjectKey === projectKey) || null;
}
