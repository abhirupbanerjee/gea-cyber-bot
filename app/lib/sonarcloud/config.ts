import { ConfiguredRepo, SonarRepoConfig } from './types';
import * as fs from 'fs';
import * as path from 'path';

// Cache for configured repos
let cachedRepos: ConfiguredRepo[] | null = null;

/**
 * Load configured repositories from sonar-repos.json
 */
export function loadConfiguredRepos(): ConfiguredRepo[] {
  if (cachedRepos) {
    return cachedRepos;
  }

  try {
    const configPath = path.join(process.cwd(), 'public/config/sonar-repos.json');
    const fileContent = fs.readFileSync(configPath, 'utf-8');
    const config: SonarRepoConfig = JSON.parse(fileContent);

    cachedRepos = config.repositories || [];
    return cachedRepos;
  } catch (error) {
    console.error('Failed to load sonar-repos.json:', error);
    return [];
  }
}

/**
 * Find a repository configuration by GitHub URL
 */
export function findRepoByGithubUrl(url: string): ConfiguredRepo | null {
  const repos = loadConfiguredRepos();
  const normalizedUrl = normalizeGithubUrl(url);

  return repos.find(repo =>
    normalizeGithubUrl(repo.githubUrl) === normalizedUrl
  ) || null;
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
