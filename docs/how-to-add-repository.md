# How to Add a New Repository

## Overview
This guide explains how to add a new GitHub repository to GEA Cyber Bot for SonarCloud security analysis.

**Note:** This configuration is only needed for Security Analysis (SonarCloud). Performance Testing (PageSpeed Insights) works with any public URL without configuration.

## Prerequisites
Before adding a repository, ensure you have:
- The GitHub repository URL
- The SonarQube project key for the repository
- Access permissions to the repository
- The main branch name (typically "main" or "master")

## Step-by-Step Instructions

### 1. Locate the Configuration File

The repository configuration file location depends on your deployment environment:

**Production (Vercel/Azure/Cloud Deployments):**
```
public/config/sonar-repos.json
```

**Local Development (Fallback):**
```
app/config/sonar-repos.json
```

> **Important:** For production deployments on Vercel, Azure, or other cloud platforms, the configuration file MUST be placed in `public/config/sonar-repos.json` to ensure it's included in the deployment bundle. The application will automatically check both locations with fallback support.

### 2. Understanding the Configuration Structure
Each repository entry contains the following fields:

- **githubUrl**: The full GitHub repository URL (e.g., `https://github.com/username/repo-name.git`)
- **sonarProjectKey**: The unique project key from SonarQube (format: `username_repo-name`)
- **displayName**: A user-friendly name for the repository
- **branch**: The branch to monitor (typically "main" or "master")
- **configured**: Whether the repository is active (set to `true`)
- **lastSync**: Timestamp of the last synchronization (ISO 8601 format)

### 3. Adding a New Repository

Open the `sonar-repos.json` file and add a new entry to the `repositories` array:

```json
{
  "repositories": [
    {
      "githubUrl": "https://github.com/your-username/your-repo.git",
      "sonarProjectKey": "your-username_your-repo",
      "displayName": "Your Repository Name",
      "branch": "main",
      "configured": true,
      "lastSync": "2025-11-20T10:00:00Z"
    }
  ]
}
```

### 4. Example Configuration

Here's a complete example with multiple repositories:

```json
{
  "repositories": [
    {
      "githubUrl": "https://github.com/abhirupbanerjee/GEAv3.git",
      "sonarProjectKey": "abhirupbanerjee_GEAv3",
      "displayName": "EA Portal",
      "branch": "main",
      "configured": true,
      "lastSync": "2025-11-20T10:00:00Z"
    },
    {
      "githubUrl": "https://github.com/your-org/new-project.git",
      "sonarProjectKey": "your-org_new-project",
      "displayName": "New Project",
      "branch": "main",
      "configured": true,
      "lastSync": "2025-11-20T10:00:00Z"
    }
  ]
}
```

### 5. Field Guidelines

**githubUrl**
- Must end with `.git`
- Must be a valid GitHub URL
- Format: `https://github.com/[username]/[repo-name].git`

**sonarProjectKey**
- Should match your SonarQube project configuration
- Typically follows the format: `username_repo-name`
- Must be unique across all repositories
- Check SonarQube dashboard for the exact project key

**displayName**
- User-friendly name shown in reports and notifications
- Can contain spaces and special characters
- Should be descriptive and concise

**branch**
- Usually "main" or "master"
- Can be any branch you want to monitor
- Must exist in the repository

**configured**
- Set to `true` to enable monitoring
- Set to `false` to temporarily disable without removing the entry

**lastSync**
- ISO 8601 timestamp format: `YYYY-MM-DDTHH:mm:ssZ`
- Will be automatically updated by the system
- Initial value can be set to current date/time

### 6. Validation Checklist

Before saving, verify:
- [ ] JSON syntax is valid (no missing commas or brackets)
- [ ] GitHub URL is correct and accessible
- [ ] SonarQube project key matches the SonarQube configuration
- [ ] Branch name is correct
- [ ] Display name is unique and descriptive
- [ ] All required fields are present

### 7. After Adding the Repository

1. Save the `sonar-repos.json` file
2. Restart the bot if it's currently running
3. Verify the repository appears in the monitoring list
4. Check that the first sync completes successfully
5. Review any security findings in the dashboard

## Troubleshooting

**Repository not loading / "No repositories configured" message**
- **Check file location**: Ensure `public/config/sonar-repos.json` exists for production deployments
- **Verify git tracking**: Run `git ls-files public/config/sonar-repos.json` to confirm file is tracked
- **Check deployment logs**:
  - Vercel: View function logs in Vercel dashboard
  - Azure: Check Application Insights or Log Stream
  - Look for `[Config] Successfully loaded N repositories` message
- **Browser console**: Open DevTools (F12) and look for `[ChatApp] Loaded N configured repositories`
- **Verify JSON validity**: Use `cat public/config/sonar-repos.json | jq` to validate JSON syntax

**Repository not syncing**
- Verify the GitHub URL is correct
- Check that the branch name exists
- Ensure you have access permissions to the repository
- Confirm `"configured": true` is set in the JSON

**SonarCloud data not appearing**
- Confirm the sonarProjectKey matches exactly with SonarCloud
- Verify the project exists in your SonarCloud organization
- Check SonarCloud authentication credentials in environment variables
- Ensure SonarCloud API token has correct permissions

**JSON parsing errors**
- Validate JSON syntax using a JSON validator (https://jsonlint.com)
- Check for missing commas between entries
- Ensure all strings are properly quoted
- Watch for trailing commas (not allowed in JSON)
- Verify all brackets and braces are balanced

**Path-related issues on Vercel/Azure**
- Ensure config file is in `public/config/` NOT `app/config/`
- Check build logs for `[Config] Config file not found at any location!`
- Verify `.gitignore` includes `!public/config/sonar-repos.json` to track the file
- Confirm file exists after deployment using Vercel/Azure file explorer

## Best Practices

1. **Test in Development**: Add new repositories in a development environment first
2. **Backup Configuration**: Keep a backup of `sonar-repos.json` before making changes
3. **Use Descriptive Names**: Choose display names that clearly identify the project
4. **Monitor Initial Sync**: Watch the first synchronization to catch any issues early
5. **Document Custom Configurations**: Note any special settings or branch configurations

## Getting Help

If you encounter issues:
- Check the bot logs for error messages
- Verify all credentials and access permissions
- Consult the main documentation
- Contact the system administrator

## Deployment Environment Configuration

### Vercel Deployment

For Vercel deployments:

1. **File Location**: Place configuration in `public/config/sonar-repos.json`
2. **Git Tracking**: Ensure the file is committed to your repository
3. **Build Process**: Vercel automatically includes files from the `public/` directory
4. **Verification**: Check Vercel build logs for `[Config] Successfully loaded N repositories`

**Vercel-Specific Notes:**
- The `public/` directory is served as static assets and accessible at runtime
- Environment variables for SonarCloud credentials should be set in Vercel dashboard
- Check function logs in Vercel dashboard under "Functions" tab for detailed config loading logs

### Azure Deployment

For Azure App Service or Azure Static Web Apps:

1. **File Location**: Use `public/config/sonar-repos.json`
2. **Deployment**: Ensure the file is included in your deployment package
3. **Application Settings**: Configure SonarCloud API tokens in Azure Portal under "Configuration"
4. **Logging**: Enable Application Insights to view config loading logs

**Azure-Specific Notes:**
- For Azure Static Web Apps, files in `public/` are automatically deployed
- For Azure App Service, verify the file exists in the deployment using Kudu console
- Check logs via Azure Portal > Log Stream or Application Insights

### Local Development

For local development:

1. **File Location**: Can use either `public/config/sonar-repos.json` OR `app/config/sonar-repos.json`
2. **Priority**: Application checks `public/config/` first, then falls back to `app/config/`
3. **Environment Variables**: Create `.env.local` file for SonarCloud credentials
4. **Verification**: Check console output for `[Config] Current working directory: ...` logs

**Development Best Practices:**
- Keep sensitive data in `.env.local` (ignored by git)
- Use `public/config/sonar-repos.json` to match production setup
- Test with actual production configuration before deploying

### Configuration File Path Resolution

The application uses intelligent path resolution with fallback:

```javascript
// Priority order:
1. public/config/sonar-repos.json  (Primary - for production)
2. app/config/sonar-repos.json     (Fallback - for local dev)
```

**Debugging Path Issues:**

If repositories are not loading, check the logs for:
- `[Config] Current working directory: /path/to/app`
- `[Config] Using primary path: /path/to/app/public/config/sonar-repos.json`
- `[Config] Successfully loaded N repositories`

If you see errors:
- `[Config] Primary path not found` - File missing from `public/config/`
- `[Config] Config file not found at any location!` - File missing from both locations
- `[Config] Failed to load sonar-repos.json` - JSON syntax error or file permissions issue

### Migration Between Environments

**From `app/config/` to `public/config/` (Recommended for Production):**

```bash
# Create public/config directory
mkdir -p public/config

# Copy configuration file
cp app/config/sonar-repos.json public/config/sonar-repos.json

# Update .gitignore to track the new location
# (should already be configured with: !public/config/sonar-repos.json)

# Commit changes
git add public/config/sonar-repos.json .gitignore
git commit -m "Move config to public directory for production deployment"
git push
```

**Verification After Migration:**

1. **Local Testing:**
   ```bash
   npm run build
   npm start
   # Check console for: [Config] Using primary path: .../public/config/sonar-repos.json
   ```

2. **Production Verification:**
   - Deploy to Vercel/Azure
   - Open browser console (F12)
   - Look for: `[ChatApp] Loaded N configured repositories`
   - Check deployment logs for `[Config] Successfully loaded N repositories`

## Related Configuration Files

- `public/config/sonar-repos.json` - Repository configuration (Production)
- `app/config/sonar-repos.json` - Repository configuration (Development fallback)
- `.env.local` - Local environment variables (not tracked in git)
- `.env.production` - Production environment variables
- `vercel.json` - Vercel deployment configuration
- Environment variables for SonarCloud credentials
- GitHub authentication tokens

## Example: Adding Multiple Repositories at Once

```json
{
  "repositories": [
    {
      "githubUrl": "https://github.com/org/frontend-app.git",
      "sonarProjectKey": "org_frontend-app",
      "displayName": "Frontend Application",
      "branch": "main",
      "configured": true,
      "lastSync": "2025-11-20T10:00:00Z"
    },
    {
      "githubUrl": "https://github.com/org/backend-api.git",
      "sonarProjectKey": "org_backend-api",
      "displayName": "Backend API",
      "branch": "develop",
      "configured": true,
      "lastSync": "2025-11-20T10:00:00Z"
    },
    {
      "githubUrl": "https://github.com/org/mobile-app.git",
      "sonarProjectKey": "org_mobile-app",
      "displayName": "Mobile Application",
      "branch": "main",
      "configured": false,
      "lastSync": "2025-11-20T10:00:00Z"
    }
  ]
}
```

Note: In the example above, the mobile application is configured but disabled (`"configured": false`), allowing you to enable it later without re-entering all the details.
