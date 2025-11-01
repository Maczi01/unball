# Cloudflare Pages Deployment Guide

This document describes how to deploy the Unball application to Cloudflare Pages using GitHub Actions.

## Overview

The project is configured to automatically deploy to Cloudflare Pages when code is pushed to the `master` branch. The deployment process includes:

1. **Quality Checks**: Linting and unit tests
2. **Build**: Astro build with Cloudflare adapter
3. **Deploy**: Automatic deployment to Cloudflare Pages

## Prerequisites

### 1. Cloudflare Account Setup

1. Create a [Cloudflare account](https://dash.cloudflare.com/sign-up) if you don't have one
2. Navigate to **Workers & Pages** in the Cloudflare dashboard
3. Create a new **Pages** project (or note the name of your existing project)
4. Get your **Account ID** from the Cloudflare dashboard (found in the URL or account settings)

### 2. API Token Creation

Create a Cloudflare API token with the following permissions:

1. Go to **My Profile** → **API Tokens**
2. Click **Create Token**
3. Use the **Edit Cloudflare Workers** template or create a custom token with:
   - **Account** → **Cloudflare Pages** → **Edit**
4. Copy the generated token (you won't see it again!)

### 3. GitHub Secrets Configuration

Add the following secrets to your GitHub repository (**Settings** → **Secrets and variables** → **Actions** → **New repository secret**):

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `CLOUDFLARE_API_TOKEN` | Your Cloudflare API token | `abc123...` |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | `a1b2c3d4e5f6...` |
| `CLOUDFLARE_PROJECT_NAME` | Your Cloudflare Pages project name | `unball` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_KEY` | Supabase anon/public key | `eyJhbGc...` |
| `OPENROUTER_API_KEY` | OpenRouter API key | `sk-or-v1-...` |
| `PUBLIC_MAPBOX_ACCESS_TOKEN` | Mapbox access token | `pk.eyJ...` |
| `CRON_SECRET` | Secret for cron job authentication | `base64-encoded-string` |
| `CODECOV_TOKEN` | (Optional) Codecov token for coverage reports | `...` |

## Deployment Workflow

The deployment is triggered automatically when you push to the `master` branch.

### Workflow Steps

1. **Quality Check Job**:
   - Checkout code
   - Install dependencies
   - Run ESLint
   - Run unit tests with coverage
   - Upload coverage to Codecov

2. **Deploy Job** (runs after quality check passes):
   - Checkout code
   - Install dependencies
   - Build project with environment variables
   - Deploy to Cloudflare Pages using Wrangler

### Manual Deployment

To manually trigger a deployment:

```bash
# Push to master branch
git push origin master
```

Or use GitHub's **Actions** tab to manually trigger the workflow (if configured).

## Environment Variables in Cloudflare

After the first deployment, you should also configure environment variables in the Cloudflare dashboard:

1. Go to your Cloudflare Pages project
2. Navigate to **Settings** → **Environment variables**
3. Add the following variables for both **Production** and **Preview** environments:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `OPENROUTER_API_KEY`
   - `PUBLIC_MAPBOX_ACCESS_TOKEN`
   - `CRON_SECRET`

## Local Development with Cloudflare

To test the Cloudflare adapter locally:

```bash
# Build the project
npm run build

# Run Wrangler Pages dev server
npx wrangler pages dev ./dist
```

## Monitoring Deployments

1. **GitHub Actions**: Check the **Actions** tab in your GitHub repository
2. **Cloudflare Dashboard**: View deployments in your Cloudflare Pages project
3. **Build Logs**: Available in both GitHub Actions and Cloudflare dashboard

## Troubleshooting

### Build Fails

- Check that all required secrets are set in GitHub
- Review build logs in GitHub Actions
- Ensure `package.json` dependencies are up to date

### Deployment Fails

- Verify `CLOUDFLARE_API_TOKEN` has correct permissions
- Check `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_PROJECT_NAME` are correct
- Review Wrangler logs in GitHub Actions output

### Runtime Errors

- Check environment variables are set in Cloudflare dashboard
- Review function logs in Cloudflare dashboard (**Workers & Pages** → **Your Project** → **Functions**)
- Test locally with `npx wrangler pages dev ./dist`

## Additional Resources

- [Astro Cloudflare Adapter Docs](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Actions for Cloudflare](https://github.com/cloudflare/wrangler-action)

## Reverting a Deployment

If you need to rollback to a previous deployment:

1. Go to Cloudflare dashboard → **Workers & Pages** → **Your Project**
2. Click on **Deployments**
3. Find the previous successful deployment
4. Click **Rollback to this deployment**
