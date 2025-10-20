# Railway Deployment Guide

This guide covers deploying the create-reodor-app Next.js application to Railway.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Configuration](#configuration)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Overview

Railway is a modern deployment platform that provides:

- **Zero-config deployments** with automatic HTTPS
- **Built-in CI/CD** from GitHub
- **Easy database provisioning** (though we use Supabase)
- **Environment management** for staging and production
- **Config as Code** via `railway.toml`

Our setup uses Railway for hosting the Next.js application while Supabase handles:

- Database hosting and migrations
- Authentication
- Storage
- Edge Functions

## Prerequisites

Before deploying to Railway, ensure you have:

1. **Node.js and Bun** installed locally
2. **A Railway account** - Sign up at [railway.app](https://railway.app)
3. **GitHub repository** with your code
4. **Supabase project** set up with database and auth configured
5. **Environment variables** ready (from `.env.example`)

## Quick Start

For developers who just want to get started quickly:

```bash
# 1. Install Railway CLI and link project
bun run railway:setup

# 2. Push environment variables
bun run railway:push-env

# 3. Deploy (or push to main branch for automatic deployment)
railway up
```

## Detailed Setup

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app) and create a new project
2. Choose "Deploy from GitHub repo"
3. Select your repository
4. Railway will detect it as a Next.js app

### Step 2: Install and Configure Railway CLI

Run the automated setup script:

```bash
bun run railway:setup
```

This script will:

- Check if Railway CLI is installed (installs via npm if missing)
- Authenticate you with Railway (`railway login`)
- Link your local project to Railway (`railway link`)
- Provide next steps

**Manual Installation (if needed):**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link
```

**Note:** Railway CLI stores configuration globally in `~/.railway/config.json` rather than in your project directory. The `railway status` command can be used to verify your project is linked correctly.

### Step 3: Configure Environment Variables

Environment variables can be set in two ways:

#### Option A: Using the Script (Recommended)

```bash
bun run railway:push-env
```

**Important:** Before running this command, ensure you have a `.env.production` file with your production credentials. If it doesn't exist, the script will prompt you to create it.

The `.env.production` file should contain credentials for:

- Supabase (production project)
- Google OAuth (production credentials)
- Resend (production API key)
- CRON_SECRET (generate with `openssl rand -base64 32`)

This script offers two modes:

1. **Copy from .env.production** (default) - Automatically copy from your `.env.production` file
2. **Interactive mode** - Enter each value manually with helpful prompts

Simply press Enter to use the default option (copy from .env.production).

#### Option B: Manual Configuration

Set variables via the Railway CLI:

```bash
railway variables --set VARIABLE_NAME=value
```

Or through the Railway dashboard:

1. Go to your project in Railway
2. Navigate to Variables tab
3. Add each variable from `.env.example`

### Step 4: Required Environment Variables

Ensure these critical variables are set:

**Supabase Configuration:**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your-anon-key
SUPABASE_SECRET_KEY=your-service-role-key
DATABASE_URL=postgresql://...
```

**Authentication (Optional):**

```bash
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your-google-client-id
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Email Configuration:**

```bash
DEV_EMAIL_FROM="Your App <app@yourdomain.com>"
DEV_EMAIL_TO="dev@yourdomain.com"
PROD_EMAIL_FROM="Your App <app@yourdomain.com>"
RESEND_API_KEY=re_...
```

**Cron Jobs:**

```bash
CRON_SECRET=generate-with-openssl-rand-base64-32
```

Generate a secure CRON_SECRET:

```bash
openssl rand -base64 32
```

## Configuration

### railway.toml

The project includes a `railway.toml` file that configures:

```toml
[build]
builder = "NIXPACKS"              # Supports Bun
buildCommand = "bun run build"    # Next.js production build

[deploy]
startCommand = "bun start"        # Production server
healthcheckPath = "/"             # Health check endpoint
healthcheckTimeout = 100          # 100 seconds for startup
restartPolicyType = "ON_FAILURE"  # Auto-restart on crashes
restartPolicyMaxRetries = 3       # Max restart attempts
```

### Key Configuration Notes

**No Pre-deploy Migrations:**
Database migrations are handled by Supabase GitHub Preview Integration, not Railway. This prevents conflicts and ensures migrations run in the correct order.

**Health Checks:**
Railway checks `/` after deployment to ensure the app is running. The 100-second timeout accounts for cold starts and build processes.

**Restart Policy:**
The app automatically restarts up to 3 times on failure, providing resilience against transient issues.

## Deployment

### Automatic Deployments (Recommended)

Railway automatically deploys when you push to your main branch:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Railway will:

1. Detect the push via GitHub webhook
2. Pull latest code
3. Run `bun run build`
4. Deploy with zero downtime
5. Run health checks

### Manual Deployments

Deploy directly from your local machine:

```bash
# Deploy current directory
railway up

# Deploy with build logs
railway up --verbose

# Deploy and open in browser when ready
railway up && railway open
```

### Environment-specific Deployments

Deploy to specific environments:

```bash
# Deploy to production
railway up --environment production

# Deploy to staging
railway up --environment staging
```

## Monitoring

### View Logs

Real-time deployment and application logs:

```bash
# Deployment logs
railway logs

# Follow logs in real-time
railway logs --follow

# Filter logs
railway logs --filter "error"
```

### View Deployments

```bash
# List recent deployments
railway status

# Open project in Railway dashboard
railway open
```

### Dashboard Monitoring

The Railway dashboard provides:

- **Deployment history** with status and duration
- **Resource usage** (CPU, memory, network)
- **Build logs** for debugging build failures
- **Runtime logs** for application errors
- **Metrics** for performance monitoring

## Troubleshooting

### Common Issues

#### Build Failures

**Issue:** Build fails with "command not found"

```bash
# Solution: Ensure railway.toml specifies correct builder
[build]
builder = "NIXPACKS"  # Required for Bun support
```

**Issue:** Build times out

```bash
# Solution: Increase build timeout in Railway dashboard
# Project Settings -> Deploy -> Build Timeout
```

#### Runtime Issues

**Issue:** App crashes on startup

```bash
# Check logs for errors
railway logs

# Common causes:
# - Missing environment variables
# - Database connection issues
# - Port binding problems (Railway assigns PORT automatically)
```

**Issue:** Environment variables not working

```bash
# Verify variables are set
railway variables

# Re-push variables if needed
bun run railway:push-env
```

**Issue:** Health check failing

```bash
# Verify the root path "/" is accessible
# Check healthcheckTimeout in railway.toml
# Ensure Next.js server is binding to correct port
```

#### Database Connection Issues

**Issue:** Can't connect to Supabase

```bash
# Verify Supabase environment variables
railway variables | grep SUPABASE

# Check Supabase project is running
# Verify DATABASE_URL is correct
# Ensure Supabase accepts connections from Railway IPs
```

### Getting Help

1. **Check logs first:**

   ```bash
   railway logs --follow
   ```

2. **Verify configuration:**

   ```bash
   railway variables
   railway status
   ```

3. **Railway documentation:**

   - [Railway Docs](https://docs.railway.com)
   - [Deployment Guide](https://docs.railway.com/guides/deployments)
   - [Config as Code](https://docs.railway.com/deploy/config-as-code)

4. **Community support:**
   - [Railway Discord](https://discord.gg/railway)
   - [GitHub Discussions](https://github.com/railwayapp/railway/discussions)

## Best Practices

### Security

- ✅ Never commit `.env` files with secrets
- ✅ Use Railway's sealed variables for highly sensitive data
- ✅ Rotate secrets regularly (especially CRON_SECRET)
- ✅ Use Supabase RLS policies to protect data
- ✅ Keep Supabase service role key secure

### Performance

- ✅ Use environment variables for configuration
- ✅ Enable caching in Next.js (already configured)
- ✅ Monitor resource usage in Railway dashboard
- ✅ Use CDN for static assets if needed

### Development Workflow

- ✅ Use separate Railway environments for staging/production
- ✅ Test deployments in staging first
- ✅ Use `railway up` for quick testing before pushing to GitHub
- ✅ Keep `railway.toml` in sync with deployment needs

### Database Migrations

- ✅ Let Supabase handle migrations (GitHub integration)
- ❌ Don't run migrations from Railway pre-deploy hooks
- ✅ Test migrations in Supabase staging first
- ✅ Use `bun db:diff` locally to generate migrations

## Related Documentation

- [Supabase Documentation](./supabase-setup.md)
- [Environment Variables](./environment-variables.md)
- [CI/CD Pipeline](./ci-cd.md)

## Additional Resources

- [Railway Documentation](https://docs.railway.com)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase + Railway](https://supabase.com/partners/integrations/railway)
