# Railway Custom Domain Setup Guide

This guide walks you through setting up a custom domain for your Next.js application deployed on Railway, including SSL certificates, DNS configuration, and provider-specific instructions.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Port Configuration](#port-configuration)
- [Railway-Provided Domain](#railway-provided-domain)
- [Custom Domain Setup](#custom-domain-setup)
- [Root Domain Configuration](#root-domain-configuration)
- [Cloudflare-Specific Setup](#cloudflare-specific-setup)
- [Wildcard Domains](#wildcard-domains)
- [Target Ports](#target-ports)
- [SSL Certificates](#ssl-certificates)
- [TCP Proxying](#tcp-proxying)
- [Troubleshooting](#troubleshooting)

## Overview

Railway makes it easy to expose your application to the internet with automatic SSL certificate provisioning. You can use either a Railway-provided domain (e.g., `your-app.up.railway.app`) or configure your own custom domain.

**Key Features:**

- Automatic Let's Encrypt SSL certificates
- Support for custom domains and wildcard domains
- CNAME flattening for root domains
- Multiple domains per service
- Target port configuration for multi-port applications

## Prerequisites

Before setting up a custom domain, ensure:

- Your application is deployed and running on Railway
- Your application is listening on the correct port (see [Port Configuration](#port-configuration))
- You have access to your DNS provider (Cloudflare, Namecheap, DNSimple, etc.)
- You own the domain you want to use

## Port Configuration

Railway needs your application to listen on the correct port to route traffic properly.

### Railway-Provided Port (Recommended)

As long as you haven't defined a `PORT` variable, Railway will provide and expose one for you automatically.

**Ensure your application listens on `0.0.0.0:$PORT`:**

**Node.js/Next.js:**

```javascript
const port = process.env.PORT || 3000;

app.listen(port, '0.0.0.0', () => {
  console.log(`App listening on port: ${port}`);
});
```

**Python:**

```python
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=os.getenv("PORT", default=5000))
```

**Bun:**

```typescript
Bun.serve({
  port: process.env.PORT || 3000,
  hostname: "0.0.0.0",
  fetch(req) {
    // Your request handler
  },
});
```

### User-Defined Port

If you prefer to explicitly set a port:

1. Set the `PORT` variable in your Railway service variables
2. Railway will direct traffic to this port
3. Your application must listen on this port

**Note:** For dual-stack (public + private network), your server must support binding to `::`. Most servers handle this automatically, but some (like Uvicorn) require explicit configuration.

## Railway-Provided Domain

Railway services don't get a domain automatically, but it's easy to set one up.

### Generate a Railway Domain

1. Go to your service's **Settings**
2. Find **Networking** → **Public Networking**
3. Click **Generate Domain**

Railway will provide a domain like `your-app.up.railway.app`.

### Automated Prompt

If Railway detects your service is listening correctly, you'll see a prompt on the service tile offering to generate a domain automatically.

**Troubleshooting:** If you don't see the "Generate Domain" button, check if you have a TCP Proxy assigned. Remove the TCP Proxy first (click the trash icon), then you can add a domain.

## Custom Domain Setup

Custom domains allow you to use your own domain (e.g., `yourdomain.com`) instead of the Railway-provided domain.

### Step 1: Add Custom Domain in Railway

1. Navigate to your service's **Settings**
2. Click **+ Custom Domain** in the **Public Networking** section
3. Enter your custom domain (e.g., `yourdomain.com` or `api.yourdomain.com`)
4. Railway will provide a **CNAME value** (e.g., `g05ns7.up.railway.app`)

### Step 2: Add DNS Record

In your DNS provider, create a CNAME record:

- **Name/Host:** Your domain or subdomain
  - For `yourdomain.com`: use `@` or leave blank (depends on provider)
  - For `api.yourdomain.com`: use `api`
- **Type:** CNAME
- **Value/Target:** The CNAME provided by Railway (e.g., `g05ns7.up.railway.app`)
- **TTL:** Auto or 3600 (1 hour)

### Step 3: Wait for Verification

Railway will verify your domain. When verified, you'll see a green checkmark next to the domain.

**Note:** DNS changes can take up to 72 hours to propagate worldwide, but typically happen within a few minutes.

### Important Considerations

- **Freenom domains** are not allowed and not supported
- **Trial Plan:** Limited to 1 custom domain
- **Hobby Plan:** Limited to 2 custom domains per service
- **Pro Plan:** Limited to 20 domains per service (can be increased on request)

## Root Domain Configuration

Adding a root/apex domain (e.g., `yourdomain.com` without `www`) requires special DNS configuration.

### DNS Record Requirements

Root domains typically require an "A" or "AAAA" record, but Railway uses dynamic IPs. Your DNS provider must support one of:

- **CNAME Flattening** (Cloudflare, Namecheap)
- **ALIAS Records** (DNSimple)
- **ANAME Records** (bunny.net)

### Supported DNS Providers for Root Domains

**✅ Supported:**

- **Cloudflare** - CNAME with automatic flattening
- **DNSimple** - Dynamic ALIAS records
- **Namecheap** - CNAME records
- **bunny.net** - ANAME records

**❌ Not Supported:**

- AWS Route 53
- Hostinger
- GoDaddy
- NameSilo
- Hurricane Electric
- SquareSpace

### Workaround for Unsupported Providers

If your DNS provider doesn't support CNAME flattening:

1. Change your domain's nameservers to Cloudflare
2. Follow [Cloudflare's nameserver setup guide](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/)
3. Add CNAME record in Cloudflare for your root domain

## Cloudflare-Specific Setup

Cloudflare is the most popular DNS provider for Railway deployments. Here's how to configure it properly.

### Basic Custom Domain Setup

1. **Create Custom Domain in Railway**
   - Add your domain in Railway settings
   - Copy the CNAME value (e.g., `abc123.up.railway.app`)

2. **Add DNS Record in Cloudflare**
   - **Name:** `@` (for root) or subdomain name (e.g., `api`)
   - **Type:** CNAME
   - **Target:** Railway's CNAME value
   - **Proxy status:** ✅ Proxied (orange cloud)

3. **Configure SSL/TLS**
   - Go to **SSL/TLS** → **Overview**
   - Select **Full** (NOT Full (Strict))
   - Enable **Universal SSL** in Edge Certificates

### Adding Root Domain with www Redirect

To redirect all `www.yourdomain.com` traffic to `yourdomain.com`:

1. **Create Custom Domain in Railway**
   - Add `yourdomain.com` (root domain only)
   - Copy the CNAME value

2. **Add Root Domain CNAME**
   - **Name:** `@`
   - **Target:** Railway's CNAME value
   - **Proxy status:** On (orange cloud)

3. **Add www CNAME**
   - **Name:** `www`
   - **Target:** `@` (Cloudflare changes this to your root domain)
   - **Proxy status:** On (orange cloud)

4. **Configure SSL/TLS**
   - Navigate to **SSL/TLS** → **Overview**
   - Select **Full** (not Full (Strict))

5. **Enable Universal SSL**
   - Go to **SSL/TLS** → **Edge Certificates**
   - Enable **Universal SSL**

6. **Create Bulk Redirect**
   - Go to Cloudflare dashboard → **Bulk Redirects**
   - Click **Create Bulk Redirect List**
   - Name it (e.g., `www-redirect`)
   - Add redirect:
     - **Source URL:** `https://www.yourdomain.com`
     - **Target URL:** `https://yourdomain.com`
     - **Status:** 301
     - Enable all options: ✅ Preserve query string, ✅ Include subdomains, ✅ Subpath matching, ✅ Preserve path suffix
   - Click **Save and Deploy**

### Cloudflare Proxy Requirements

**If proxying is enabled (orange cloud):**

- ✅ SSL/TLS must be set to **Full** (not Full (Strict))
- ✅ First-level subdomains work: `*.yourdomain.com`
- ❌ Nested subdomains require Advanced Certificate Manager: `*.subdomain.yourdomain.com`

**If proxying is disabled (gray cloud):**

- ⚠️ Cloudflare will not associate the domain with Railway
- ⚠️ You may encounter `ERR_TOO_MANY_REDIRECTS`

### Cloudflare Detection

When configured correctly, Railway will show a **"Cloudflare proxy detected"** message with a green cloud icon next to your domain.

## Wildcard Domains

Wildcard domains allow flexible subdomain management (e.g., `*.yourdomain.com`).

### Important Rules

- Wildcards **cannot be nested** (e.g., `*.*.yourdomain.com` is invalid)
- Wildcards work at any level (e.g., `*.example.com` or `*.subdomain.example.com`)
- `_acme-challenge` CNAME must **not be proxied** (required for SSL verification)

### Adding a Wildcard Domain

When you add a wildcard domain in Railway, you'll receive **two CNAME values**:

1. **Wildcard CNAME** (e.g., `*.yourdomain.com` → `abc123.up.railway.app`)
2. **ACME Challenge CNAME** (e.g., `_acme-challenge.yourdomain.com` → `authorize.railwaydns.net`)

**Add both CNAME records to your DNS provider.**

### Cloudflare Configuration

**For Subdomains (e.g., `*.example.com`):**

1. Enable **Universal SSL**
2. Set **Full SSL/TLS** encryption
3. Add both CNAME records
4. Disable proxy on `_acme-challenge` record (gray cloud)

**For Nested Subdomains (e.g., `*.nested.example.com`):**

1. **Disable Universal SSL**
2. Purchase **Cloudflare's Advanced Certificate Manager**
3. Enable **Edge Certificates**
4. Set **Full SSL/TLS** encryption
5. Add both CNAME records
6. Disable proxy on `_acme-challenge` record

## Target Ports

Target Ports (Magic Ports) allow you to expose multiple HTTP ports through different domains.

### Use Case Example

- `https://yourdomain.com/` → Port 8080 (main app)
- `https://management.yourdomain.com/` → Port 9000 (admin panel)

### How It Works

1. **Generate Railway Domain**
   - Railway auto-detects the port if your app listens on a single port
   - For multiple ports, you choose from a list

2. **Add Custom Domain**
   - Select which port handles traffic for this domain
   - Specify a custom port if needed

3. **Edit Anytime**
   - Click the edit icon next to the domain to change the target port

Railway routes traffic from each domain to the corresponding internal port.

## SSL Certificates

Railway automatically provisions **Let's Encrypt SSL certificates** for all custom domains.

### Automatic SSL

- ✅ Issued automatically after domain verification
- ✅ All domains accessible via `https://`
- ✅ Auto-renewal handled by Railway
- ❌ External certificates not supported (Railway provides them for you)

### Verification Process

1. Add custom domain in Railway
2. Add CNAME record in DNS provider
3. Railway verifies DNS configuration
4. Let's Encrypt certificate issued automatically
5. Domain becomes accessible via HTTPS

**Note:** For wildcard domains, the `_acme-challenge` CNAME record must not be proxied.

## TCP Proxying

If your service doesn't support HTTP (e.g., databases, game servers), use TCP Proxy.

### Setting Up TCP Proxy

1. Go to service **Settings**
2. Find **Networking** → **Public Networking**
3. Click **+ TCP Proxy**
4. Enter the port to proxy traffic to
5. Railway generates a domain and port (e.g., `proxy.railway.app:12345`)

All traffic sent to `domain:port` will be proxied to your service.

**Traffic Distribution:**

- Incoming traffic is distributed across all replicas in the closest region
- Uses random algorithm for load balancing

### Using HTTP and TCP Together

Railway supports exposing both HTTP and TCP simultaneously in a single service. If you have a domain assigned, you'll still see the option to enable TCP Proxy, and vice versa.

**Note:** Railway doesn't remove the TCP Proxy option when a domain is present, but most use cases require only one.

## Troubleshooting

### Domain Not Verifying

**Problem:** Green checkmark doesn't appear after adding CNAME.

**Solutions:**

- Verify CNAME record is correct (no typos, trailing dots)
- Check DNS propagation using `dig yourdomain.com CNAME` or [DNS Checker](https://dnschecker.org/)
- Wait up to 72 hours for worldwide propagation
- Clear your local DNS cache:
  - Windows: `ipconfig /flushdns`
  - macOS: `dscacheutil -flushcache`
  - Linux: `sudo systemd-resolve --flush-caches`

### ERR_TOO_MANY_REDIRECTS

**Problem:** Browser shows "too many redirects" error.

**Solutions:**

- **Cloudflare users:** Change SSL/TLS to **Full** (not Full (Strict))
- Ensure Cloudflare proxy is **enabled** (orange cloud)
- Check for redirect loops in your application code

### SSL Certificate Not Issued

**Problem:** Domain not accessible via HTTPS.

**Solutions:**

- For wildcard domains: Ensure `_acme-challenge` CNAME is **not proxied**
- Verify DNS records are correct
- Wait for Railway to complete verification (can take a few minutes)
- Check Railway dashboard for error messages

### "Generate Domain" Button Missing

**Problem:** Can't generate Railway-provided domain.

**Solution:**

- Remove any TCP Proxy assigned to the service (click trash icon)
- The "Generate Domain" button will appear after TCP Proxy removal

### Application Not Accessible

**Problem:** Domain resolves but application doesn't respond.

**Solutions:**

- Verify application is listening on `0.0.0.0:$PORT`
- Check Railway logs for startup errors
- Ensure `PORT` environment variable is correctly configured
- Test with Railway-provided domain first before custom domain
- Verify target port is set correctly for the domain

### Cloudflare Proxy Not Detected

**Problem:** Railway doesn't show "Cloudflare proxy detected" message.

**Solutions:**

- Enable Cloudflare proxy (orange cloud icon)
- Set SSL/TLS to **Full** (not Full (Strict))
- Wait a few minutes for Railway to detect the proxy
- Try disabling and re-enabling the proxy in Cloudflare

### Root Domain Not Working

**Problem:** Root domain (e.g., `yourdomain.com`) doesn't resolve.

**Solutions:**

- Verify your DNS provider supports CNAME flattening or ALIAS records
- Use Cloudflare nameservers if your provider doesn't support it
- For Cloudflare: Ensure the `@` record is proxied (orange cloud)
- Check DNS records with `dig yourdomain.com` (should show CNAME or A record)

### Nested Subdomain SSL Error

**Problem:** Subdomain like `api.staging.yourdomain.com` shows SSL error.

**Solutions:**

- **Cloudflare users:** Purchase Advanced Certificate Manager
- Alternatively, disable Cloudflare proxy (gray cloud) for this domain
- Or use first-level subdomains only (e.g., `api-staging.yourdomain.com`)

## Testing Your Configuration

After setting up your custom domain:

1. **Test DNS Resolution**
   ```bash
   dig yourdomain.com CNAME
   # Should return Railway's CNAME value
   ```

2. **Test HTTPS**
   ```bash
   curl -I https://yourdomain.com
   # Should return 200 OK with SSL certificate
   ```

3. **Verify Certificate**
   - Open `https://yourdomain.com` in browser
   - Click the padlock icon
   - Check certificate is issued by Let's Encrypt

4. **Test in Incognito**
   - Open an incognito/private window
   - Navigate to your domain
   - Ensures no cache interference

## Additional Resources

- [Railway Public Networking Docs](https://docs.railway.app/guides/public-networking)
- [Railway TCP Proxy Guide](https://docs.railway.app/guides/tcp-proxy)
- [Cloudflare DNS Documentation](https://developers.cloudflare.com/dns/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

## Support

- **Railway Support:** [Discord Community](https://discord.gg/railway)
- **Technical Specs:** Check Railway's Public Networking reference page
- **Common Errors:** See Railway's "Fixing Common Errors" guide
