# Favicon and Logo Setup Guide

This guide covers the complete process of setting up favicons and logos for your Next.js application using RealFaviconGenerator.

## Overview

RealFaviconGenerator (https://realfavicongenerator.net/) is a comprehensive favicon generation service that creates optimized favicons for all major platforms and devices:

- **Desktop Browsers**: Standard favicon.ico and modern SVG icons
- **iOS/Apple Devices**: Apple touch icons with proper sizing
- **Android/Chrome**: Web app manifest icons (192x192, 512x512)
- **Windows Metro**: Tile icons
- **Safari Pinned Tab**: SVG mask icons
- **And more**: Handles all edge cases and legacy platforms

## Prerequisites

Before starting, you need:
- A logo file in a common format (PNG, SVG, JPG, etc.)
- Minimum recommended size: 512x512 pixels for best results
- Square aspect ratio preferred (1:1)

## Step 1: Generate Favicon Package

### 1.1 Upload Your Logo

1. Visit https://realfavicongenerator.net/
2. Click "Select your Favicon image" or drag and drop your logo
3. Wait for the image to upload

### 1.2 Configure Platform-Specific Settings

RealFaviconGenerator will present customization options for each platform:

#### iOS Web Clip
- Choose background color for iOS home screen icon
- Adjust margins if needed
- Preview how it looks on iOS devices

#### Android Chrome
- Set theme color for address bar
- Configure app name (use your `companyConfig.name` value)
- Choose icon style and background

#### Windows Metro
- Select tile background color
- Configure tile appearance

#### macOS Safari
- Choose theme color for pinned tab icon
- Adjust SVG path if needed

#### Favicon for Desktop Browsers
- Standard favicon.ico will be generated automatically
- Choose compression settings if needed

### 1.3 Generate Package

1. Scroll to "Favicon Generator Options" section
2. Configure generation settings:
   - **Path**: Leave as default (root) for Next.js
   - **Version/Refresh**: Optional, useful for cache busting
   - **Compression**: Choose appropriate quality (recommended: high quality)
3. Click "Generate your Favicons and HTML code"
4. Download the generated package

## Step 2: Install Favicon Files in Next.js

RealFaviconGenerator will provide installation instructions with download URLs. Follow this process:

### 2.1 Download Files to Correct Directories

The generated package includes multiple files that need to be placed in specific directories:

#### Files for `app/` Directory

These files go in your Next.js app directory (`app/`):

```bash
# Download these to app/
curl -o app/icon1.png [GENERATED_URL]/icon1.png
curl -o app/icon0.svg [GENERATED_URL]/icon0.svg
curl -o app/favicon.ico [GENERATED_URL]/favicon.ico
curl -o app/apple-icon.png [GENERATED_URL]/apple-icon.png
curl -o app/manifest.json [GENERATED_URL]/manifest.json
```

**Why `app/` directory?**
- Next.js 13+ App Router automatically serves files from `app/` directory as favicon files
- Files are automatically discovered and served at the root path
- No additional configuration needed for basic favicon functionality

#### Files for `public/` Directory

These files go in your public directory (`public/`):

```bash
# Ensure public directory exists
mkdir -p public

# Download web app manifest icons
curl -o public/web-app-manifest-192x192.png [GENERATED_URL]/web-app-manifest-192x192.png
curl -o public/web-app-manifest-512x512.png [GENERATED_URL]/web-app-manifest-512x512.png
```

**Why `public/` directory?**
- Web app manifest icons are referenced from `manifest.json`
- Public directory serves static assets at root URL path
- Required for Progressive Web App (PWA) functionality

### 2.2 Verify File Structure

After downloading, your directory structure should look like:

```
create-reodor-app/
├── app/
│   ├── favicon.ico          # Standard favicon
│   ├── icon0.svg            # SVG icon (dark/light mode support)
│   ├── icon1.png            # PNG icon fallback
│   ├── apple-icon.png       # iOS home screen icon
│   └── manifest.json        # Web app manifest
├── public/
│   ├── web-app-manifest-192x192.png  # Android icon (small)
│   └── web-app-manifest-512x512.png  # Android icon (large)
```

Verify all files were downloaded:

```bash
ls -lh app/*.{png,svg,ico,json} public/*.png
```

## Step 3: Configure Metadata in Layout

Update your root layout file (`app/layout.tsx`) to include Apple-specific metadata:

### 3.1 Update Metadata Export

The metadata should already include `appleWebApp` configuration. Verify it matches your app name:

```typescript
export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  ...createPageMetadata("home"),
  appleWebApp: {
    title: companyConfig.name,  // Your app name for iOS home screen
    statusBarStyle: "black-translucent",
  },
};
```

**Key fields:**
- `title`: Name displayed under iOS home screen icon (should match `companyConfig.name`)
- `statusBarStyle`: iOS status bar appearance
  - `"default"`: Light status bar (black text)
  - `"black"`: Black status bar
  - `"black-translucent"`: Translucent status bar (recommended for immersive apps)

### 3.2 Automatic File Discovery

Next.js automatically discovers and serves these files from the `app/` directory:

- `favicon.ico` → `/favicon.ico`
- `icon0.svg` → Used for light/dark mode adaptive icons
- `icon1.png` → Fallback icon
- `apple-icon.png` → `/apple-touch-icon.png`
- `manifest.json` → `/manifest.json`

No additional `<link>` tags needed in the HTML head!

## Step 4: Customize Web App Manifest

The generated `app/manifest.json` contains PWA configuration. You should customize it for your application:

```json
{
  "name": "Your App Name",
  "short_name": "App",
  "description": "Your app description",
  "icons": [
    {
      "src": "/web-app-manifest-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/web-app-manifest-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#ffffff",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/"
}
```

### Customization Points

1. **Name Fields**:
   - `name`: Full application name (use `companyConfig.name`)
   - `short_name`: Short name for home screen (12 chars max recommended)

2. **Description**:
   - Brief description of your app (use `companyConfig.shortDescription`)

3. **Colors**:
   - `theme_color`: Browser UI color (should match your brand primary color)
   - `background_color`: Splash screen background while app loads
   - Get these from `lib/brand.ts` → `brandColors.light.primary`

4. **Display Mode**:
   - `standalone`: App-like experience (hides browser UI)
   - `fullscreen`: Full screen mode
   - `minimal-ui`: Minimal browser UI
   - `browser`: Standard browser view

5. **Start URL**:
   - URL that opens when launching from home screen
   - Usually `/` for home page
   - Can be `/dashboard` or any other entry point

### Example Customized Manifest

```json
{
  "name": "create-reodor-app",
  "short_name": "Reodor",
  "description": "A comprehensive Next.js starter template",
  "icons": [
    {
      "src": "/web-app-manifest-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/web-app-manifest-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "theme_color": "#a494c4",
  "background_color": "#f8f6ff",
  "display": "standalone",
  "start_url": "/",
  "orientation": "portrait"
}
```

## Step 5: Update Brand Configuration

Ensure your brand configuration in `lib/brand.ts` aligns with your favicon/logo design:

```typescript
export const companyConfig = {
  name: "Your App Name",  // Should match manifest.json name
  // ... rest of config
};

export const brandColors = {
  light: {
    primary: "#a494c4",  // Should match manifest theme_color
    // ... rest of colors
  },
  // ...
};
```

## Step 6: Testing and Verification

### 6.1 Local Testing

Start your development server and test across different scenarios:

```bash
# Start dev server (if not already running)
bun dev
```

**Desktop Browser Testing:**
1. Open `http://localhost:3000` in Chrome/Firefox/Safari
2. Check browser tab for favicon
3. Create bookmark and verify bookmark icon
4. Inspect page source to confirm files are served correctly

**Mobile Testing:**

*iOS (Safari):*
1. Open site in Safari on iPhone/iPad
2. Tap Share → Add to Home Screen
3. Verify icon appearance and name
4. Launch from home screen to test web app mode

*Android (Chrome):*
1. Open site in Chrome on Android device
2. Tap menu → Add to Home Screen
3. Check icon and name in launcher
4. Verify theme color in address bar
5. Launch from home screen

### 6.2 File Accessibility Check

Verify all favicon files are accessible:

```bash
# Test in browser or with curl
curl -I http://localhost:3000/favicon.ico
curl -I http://localhost:3000/apple-touch-icon.png
curl -I http://localhost:3000/manifest.json
curl -I http://localhost:3000/web-app-manifest-192x192.png
curl -I http://localhost:3000/web-app-manifest-512x512.png
```

All should return `200 OK` status.

### 6.3 Manifest Validation

Validate your web app manifest:

1. Open Chrome DevTools (F12)
2. Go to Application tab → Manifest section
3. Check for warnings or errors
4. Verify all icons load correctly
5. Confirm metadata is correct

### 6.4 Lighthouse PWA Audit

Run Lighthouse audit to verify PWA compliance:

1. Open Chrome DevTools (F12)
2. Go to Lighthouse tab
3. Select "Progressive Web App" category
4. Run audit
5. Address any warnings related to icons or manifest

## Step 7: Production Deployment

### 7.1 Pre-deployment Checklist

Before deploying, ensure:

- [ ] All favicon files are committed to git
- [ ] `manifest.json` is customized with production values
- [ ] `companyConfig.name` matches app name in manifest
- [ ] Brand colors align with manifest theme colors
- [ ] Files are optimized (compressed appropriately)
- [ ] No broken links in manifest icon paths

### 7.2 Deployment Verification

After deploying to production:

1. **Test Production URLs**:
   ```bash
   curl -I https://yourapp.com/favicon.ico
   curl -I https://yourapp.com/manifest.json
   ```

2. **Test on Real Devices**:
   - iOS: Add to home screen and test
   - Android: Add to home screen and test
   - Desktop: Check favicon in multiple browsers

3. **Cache Considerations**:
   - Browsers aggressively cache favicons
   - If updating favicon, consider versioning in filename or using cache busting
   - Hard refresh may be needed: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

## Troubleshooting

### Favicon Not Showing

**Issue**: Favicon doesn't appear in browser tab

**Solutions**:
1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Verify file exists at `/favicon.ico`
4. Check browser console for 404 errors
5. Try incognito/private browsing mode
6. Restart development server

### iOS Icon Not Working

**Issue**: Wrong icon or no icon when adding to home screen

**Solutions**:
1. Verify `apple-icon.png` is in `app/` directory
2. Check `metadata.appleWebApp.title` is set correctly
3. Clear Safari cache on iOS device
4. Ensure icon is at least 180x180 pixels
5. Try closing and reopening Safari

### Manifest Errors

**Issue**: Web app manifest not loading or has errors

**Solutions**:
1. Validate JSON syntax in `manifest.json`
2. Ensure icon paths start with `/` (absolute paths)
3. Verify icon files exist in `public/` directory
4. Check manifest is accessible at `/manifest.json`
5. Review Chrome DevTools Application → Manifest section

### Dark Mode Icon Issues

**Issue**: Icon doesn't adapt to dark/light mode

**Solutions**:
1. Ensure `icon0.svg` is properly formatted
2. SVG should use `currentColor` for adaptive coloring
3. Test in both light and dark mode
4. Consider creating separate icons if SVG doesn't work
5. Fall back to PNG icons if needed

### PWA Not Installing

**Issue**: Can't install app on mobile device

**Solutions**:
1. Ensure site is served over HTTPS (required for PWA)
2. Verify `manifest.json` is valid and accessible
3. Check all required icon sizes are present (192x192, 512x512)
4. Confirm `start_url` is valid
5. Test with Lighthouse PWA audit

## Advanced Configuration

### Multiple Icon Sizes

For better quality across devices, generate additional icon sizes:

```typescript
// app/icon.tsx - Dynamic icon generation
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#a494c4',
        }}
      >
        {/* Your icon SVG or content */}
      </div>
    ),
    {
      ...size,
    }
  );
}
```

### Adaptive Icons for Android

Ensure Android icons have proper safe zones:

- Use `"purpose": "any maskable"` in manifest
- Keep important content in center 80% of icon
- Test with Chrome DevTools → Application → Manifest → Icon preview

### Dynamic Manifest Generation

For multi-tenant apps, generate manifest dynamically:

```typescript
// app/manifest.ts
import type { MetadataRoute } from 'next';
import { companyConfig, brandColors } from '@/lib/brand';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: companyConfig.name,
    short_name: companyConfig.name.substring(0, 12),
    description: companyConfig.shortDescription,
    start_url: '/',
    display: 'standalone',
    background_color: brandColors.light.background,
    theme_color: brandColors.light.primary,
    icons: [
      {
        src: '/web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
```

Then remove `app/manifest.json` and Next.js will use the TypeScript version.

## Maintenance and Updates

### When to Regenerate Favicons

Regenerate your favicon package when:

- Logo design changes significantly
- Brand colors are updated
- Company name changes
- Platform requirements change (new iOS/Android versions)
- Icon quality issues are reported

### Update Process

1. Follow steps 1-2 to generate new package
2. Download and replace all files
3. Increment version in manifest for cache busting
4. Test thoroughly before deploying
5. Deploy and verify on production

### Version Control

Always commit favicon files to git:

```bash
git add app/favicon.ico app/icon*.{png,svg} app/apple-icon.png app/manifest.json
git add public/web-app-manifest-*.png
git commit -m "Update favicons and app icons"
```

## Resources

- **RealFaviconGenerator**: https://realfavicongenerator.net/
- **Donation/Support**: https://realfavicongenerator.net/donate
- **Next.js Metadata Docs**: https://nextjs.org/docs/app/api-reference/file-conventions/metadata
- **Web App Manifest Spec**: https://w3c.github.io/manifest/
- **PWA Guidelines**: https://web.dev/progressive-web-apps/

## Quick Reference

### File Locations Summary

| File | Location | Purpose |
|------|----------|---------|
| `favicon.ico` | `app/` | Standard browser favicon |
| `icon0.svg` | `app/` | SVG icon (adaptive) |
| `icon1.png` | `app/` | PNG icon fallback |
| `apple-icon.png` | `app/` | iOS home screen icon |
| `manifest.json` | `app/` | Web app manifest |
| `web-app-manifest-192x192.png` | `public/` | Android small icon |
| `web-app-manifest-512x512.png` | `public/` | Android large icon |

### Commands Reference

```bash
# Download all favicon files at once
curl -o app/icon1.png [URL]/icon1.png && \
curl -o app/icon0.svg [URL]/icon0.svg && \
curl -o app/favicon.ico [URL]/favicon.ico && \
curl -o app/apple-icon.png [URL]/apple-icon.png && \
curl -o app/manifest.json [URL]/manifest.json && \
curl -o public/web-app-manifest-192x192.png [URL]/web-app-manifest-192x192.png && \
curl -o public/web-app-manifest-512x512.png [URL]/web-app-manifest-512x512.png

# Verify all files downloaded
ls -lh app/*.{png,svg,ico,json} public/*.png

# Test file accessibility
curl -I http://localhost:3000/favicon.ico
curl -I http://localhost:3000/manifest.json
```
