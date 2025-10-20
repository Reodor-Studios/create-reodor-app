# Supabase Start Troubleshooting Guide

## Common Issue: Timeout When Starting Postgres

If `supabase start` hangs on "Starting database..." and eventually times out, follow these debugging steps.

## Quick Diagnosis

Your system shows:
- ✅ Docker is running (v27.5.1)
- ✅ Disk space is fine (312GB available)
- ✅ Docker resources are adequate (16 CPUs, 15.6GB RAM)
- ✅ Postgres images are already downloaded
- ✅ Ports are not in use

The issue is likely related to Docker containers or volumes.

## Solution Steps

### Step 1: Clean Up Docker Resources

First, clean up unused Docker resources that might be causing conflicts:

```bash
# Stop Supabase
supabase stop

# Clean up unused Docker resources
docker system prune -a --volumes -f
```

**What this does:**
- Removes all stopped containers
- Removes unused images
- Removes unused volumes
- Frees up ~40GB based on your current usage

### Step 2: Reset Supabase Volumes

Corrupted volumes are a common cause of startup issues:

```bash
# List Supabase volumes
docker volume ls | grep supabase

# Remove Supabase volumes (this will delete local data)
docker volume ls | grep supabase | awk '{print $2}' | xargs docker volume rm 2>/dev/null || true

# Or remove specific project volumes
docker volume ls --filter label=com.supabase.cli.project=create-reodor-app -q | xargs docker volume rm
```

**⚠️ Warning:** This deletes your local database data. Make sure you have migrations and seed data backed up.

### Step 3: Restart Docker Desktop

Sometimes Docker Desktop needs a fresh start:

1. Open Docker Desktop
2. Click the gear icon (Settings)
3. Go to "Troubleshoot"
4. Click "Restart Docker Desktop"

Or via command line:

```bash
# On macOS
killall Docker && open -a Docker

# Wait 30 seconds for Docker to restart
sleep 30
```

### Step 4: Increase Docker Resources (if needed)

If you're running multiple services, increase Docker's resources:

1. Open Docker Desktop
2. Settings → Resources
3. Increase:
   - **CPUs**: 8-16 (you have 16)
   - **Memory**: 8-12 GB (you have 15.6GB)
   - **Disk**: At least 50GB
4. Click "Apply & Restart"

### Step 5: Check Docker Proxy Settings

Your Docker has HTTP proxy configured. This can sometimes interfere:

```bash
# Check proxy settings
docker info | grep -i proxy
```

If you don't need the proxy for local development:

1. Docker Desktop → Settings → Resources → Proxies
2. Uncheck "Manual proxy configuration" for local development
3. Click "Apply & Restart"

### Step 6: Try Starting with Debug Output

Start Supabase with increased timeout and debug info:

```bash
# Set longer timeout
export SUPABASE_START_TIMEOUT=300

# Try starting with verbose output
supabase start --debug
```

Watch for error messages in the output.

### Step 7: Check Specific Container Logs

If it still hangs, check the postgres container logs:

```bash
# In another terminal, while supabase start is running
docker ps | grep postgres

# Get the container ID and check logs
docker logs -f <container-id>
```

Common issues in logs:
- Permission errors
- Port binding errors
- Database initialization errors
- Memory issues

### Step 8: Nuclear Option - Complete Reset

If nothing works, completely reset everything:

```bash
# 1. Stop all containers
docker stop $(docker ps -aq) 2>/dev/null || true

# 2. Remove all containers
docker rm $(docker ps -aq) 2>/dev/null || true

# 3. Remove all Supabase volumes
docker volume ls | grep supabase | awk '{print $2}' | xargs docker volume rm 2>/dev/null || true

# 4. Remove Supabase images (will re-download)
docker images | grep supabase | awk '{print $3}' | xargs docker rmi -f 2>/dev/null || true

# 5. Clean up everything
docker system prune -a --volumes -f

# 6. Restart Docker Desktop
killall Docker && open -a Docker
sleep 30

# 7. Start fresh
cd /Users/magnusrodseth/dev/capra/reodor-studios/create-reodor-app
supabase start
```

## Recommended Workflow

After fixing the issue, use this workflow to avoid future problems:

### 1. Regular Cleanup

Add to your development routine:

```bash
# Weekly cleanup (keeps running containers)
docker system prune -f

# Monthly deep clean (when not working)
docker system prune -a --volumes -f
```

### 2. Use Database Seeds

Always maintain your database schema and seed data:

```bash
# After any schema changes
bun db:diff <migration_name>

# Keep seed data updated
bun seed
```

This way, you can safely reset the database without losing work.

### 3. Quick Reset Command

Add to your `package.json`:

```json
{
  "scripts": {
    "db:clean": "supabase stop && docker volume ls | grep supabase | awk '{print $2}' | xargs docker volume rm 2>/dev/null || true",
    "db:fresh": "bun run db:clean && supabase start && bun db:reset"
  }
}
```

## Common Error Messages

### "Error response from daemon: timeout"

**Cause:** Container is taking too long to start.

**Solution:**
1. Check Docker resources
2. Clean up volumes
3. Restart Docker Desktop

### "port is already allocated"

**Cause:** Another service is using Supabase ports (5432, 54321, 54322, etc.).

**Solution:**

```bash
# Find what's using the port
lsof -i :5432
lsof -i :54321

# Kill the process or change Supabase ports in config.toml
```

### "permission denied"

**Cause:** Docker doesn't have permissions to access volumes.

**Solution:**

```bash
# On macOS, grant Docker access in System Preferences
# Or reset Docker Desktop to defaults
```

## Prevention Tips

1. **Don't run too many Docker containers**: Docker Desktop has resource limits
2. **Clean up regularly**: Run `docker system prune` weekly
3. **Maintain migrations**: Always generate migrations for schema changes
4. **Use seed scripts**: Keep your seed data up to date
5. **Restart Docker Desktop**: Restart every few days if doing heavy development

## Still Having Issues?

If none of these solutions work:

1. **Check Docker Desktop Status**:
   - Open Docker Desktop
   - Look for yellow/red indicators
   - Check for updates

2. **Check System Resources**:
   ```bash
   # Check memory usage
   vm_stat

   # Check CPU usage
   top -l 1 | head -n 10
   ```

3. **Update Docker Desktop**:
   - Download latest from [docker.com](https://www.docker.com/products/docker-desktop/)
   - Completely uninstall old version first

4. **Check macOS Logs**:
   ```bash
   # Check for Docker-related errors
   log show --predicate 'process == "Docker"' --last 5m
   ```

5. **Get Community Help**:
   - [Supabase Discord](https://discord.supabase.com/)
   - [Supabase GitHub Discussions](https://github.com/supabase/supabase/discussions)
   - Include: OS version, Docker version, error messages, docker logs

## Expected Startup Time

Normal startup times:
- **First time**: 2-5 minutes (downloads images)
- **After cleanup**: 1-3 minutes (pulls images)
- **Regular start**: 30-60 seconds

If it takes longer than 5 minutes, something is wrong.

## Success Indicators

When Supabase starts successfully, you should see:

```bash
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGc...
service_role key: eyJhbGc...
```

And you can access Studio at `http://localhost:54323`.
