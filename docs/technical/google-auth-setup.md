# Google OAuth Setup Guide

This guide walks you through setting up Google Sign-In authentication for your Next.js application using Supabase Auth.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Google Cloud Platform Setup](#google-cloud-platform-setup)
- [Configure Supabase](#configure-supabase)
- [Local Development Setup](#local-development-setup)
- [Production Setup](#production-setup)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [How It Works](#how-it-works)

## Overview

The application uses Google OAuth 2.0 for authentication via Supabase Auth. When users click "Sign in with Google," they:

1. Are redirected to Google's consent screen
2. Grant permissions to your application
3. Are redirected back with an authorization code
4. The code is exchanged for a Supabase session
5. User data is stored in your Supabase database

**Implementation Location:**

- Sign-in button: `components/auth/google-sign-in-button.tsx`
- Auth flow logic: `components/auth/use-auth-form.ts`
- OAuth callback handler: `app/auth/oauth/route.ts`
- Middleware protection: `lib/supabase/middleware.ts`

## Prerequisites

Before you begin, ensure you have:

- A Google Cloud Platform account
- A Supabase project created
- Supabase CLI installed and configured (`supabase` command)
- Access to your Supabase project's settings

## Google Cloud Platform Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter a project name (e.g., "your-app")
4. Click "Create"

### Step 2: Configure OAuth Consent Screen

1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type (unless you have a Google Workspace)
3. Click "Create"

#### App Information

Fill in the required fields:

- **App name**: Your application name (shown to users)
- **User support email**: Your support email
- **App logo**: Upload your app logo (optional but recommended)
- **Application home page**: `https://yourdomain.com`
- **Application privacy policy**: `https://yourdomain.com/privacy`
- **Application terms of service**: `https://yourdomain.com/terms-of-service`
- **Authorized domains**: Add your domain (e.g., `yourdomain.com`)
- **Developer contact information**: Your email address

Click "Save and Continue"

#### Scopes Configuration

Add the following OAuth scopes (required for Supabase Auth):

1. Go to "Data Access"
2. Click "Add or Remove Scopes"
3. Filter and select these scopes:
   - `openid` (add manually if not listed)
   - `.../auth/userinfo.email` (should be selected by default)
   - `.../auth/userinfo.profile` (should be selected by default)
4. Click "Update" → "Save and Continue"

**Important:** Only request these basic scopes. Additional scopes may require Google verification which can take weeks.

#### Test Users for development (Optional)

**Important:** This is only really necessary if you're developing an app that requires a test group of users before publishing. Usually, you can skip this for public apps.

1. Add test user emails (your Gmail account and team members)
2. Click "Save and Continue"
3. Review and click "Back to Dashboard"

### Step 3: Create OAuth Credentials

1. Navigate to **APIs & Services** → **Credentials**
2. Click "Create Credentials" → "OAuth client ID"
3. Choose **Web application**

#### Configure Web Client

**Name:** Give it a descriptive name (e.g., "your-app-oauth")

**Authorized JavaScript origins:**

```txt
http://localhost:3000
http://localhost:54321
https://yourdomain.com
https://your-generated-railway-custom-domain.up.railway.app
```

**Authorized redirect URIs:**

For local development:

```txt
http://localhost:54321/auth/v1/callback
http://127.0.0.1:54321/auth/v1/callback
https://your-project-ref.supabase.co/auth/v1/callback
```

4. Click "Create"
5. **Save the Client ID and Client Secret** - you'll need these next

## Configure Supabase

You can configure Supabase Google Auth in two ways:

### Option A: Using the Configuration Script (Recommended)

The project includes an automated script that uses the Supabase Management API.

#### 1. Generate Supabase Access Token

1. Go to [Supabase Account Tokens](https://supabase.com/dashboard/account/tokens)
2. Click "Generate new token"
3. Name it "Google Auth Configuration"
4. Set expiration (recommended: 30 days)
5. Copy the token

#### 2. Get Your Project Reference

1. Go to your Supabase project
2. Navigate to **Project Settings** → **General**
3. Copy the "Reference ID" (looks like `abcdefghijklmnop`)

#### 3. Set Environment Variables

Create or update `.env.local` with these values:

```bash
# Supabase Management API
SUPABASE_ACCESS_TOKEN=sbp_xxx...
SUPABASE_PROJECT_REF=your-project-ref

# Google OAuth Credentials
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=123456789-xxx.apps.googleusercontent.com
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET=GOCSPX-xxx...
```

#### 4. Run the Configuration Script

```bash
bun run auth:google
```

You should see:

```
✅ Google OAuth provider configured successfully!
```

### Option B: Manual Configuration via Dashboard

1. Go to your Supabase project
2. Navigate to **Authentication** → **Providers**
3. Find "Google" and click to expand
4. Toggle "Enable Sign in with Google"
5. Enter your **Client ID** and **Client Secret**
6. Click "Save"

## Local Development Setup

### Step 1: Update Supabase Config

Edit `supabase/config.toml`:

```toml
[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET)"
skip_nonce_check = false
```

### Step 2: Update Environment Variables

In `.env.local`:

```bash
# Public Supabase Config
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your-anon-key

# Google OAuth (from Google Cloud Console)
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=123456789-xxx.apps.googleusercontent.com
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET=GOCSPX-xxx...
```

### Step 3: Restart Supabase

```bash
bun db:reset
```

This restarts Supabase with the new Google OAuth configuration.

### Step 4: Update Google Cloud Console

Make sure your OAuth client has these redirect URIs:

```
http://localhost:54321/auth/v1/callback
```

And authorized JavaScript origin:

```
http://localhost:3000
```

## Production Setup

### Step 1: Update Redirect URIs in Google Cloud Console

1. Go to your OAuth client in Google Cloud Console
2. Add production redirect URI:

   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```

3. Add production JavaScript origin:

   ```
   https://yourdomain.com
   ```

4. Click "Save"

### Step 2: Configure Production Environment Variables

In your production environment (Railway, Vercel, etc.):

```bash
# Supabase Production Config
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your-production-anon-key
SUPABASE_SECRET_KEY=your-service-role-key

# Google OAuth
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=123456789-xxx.apps.googleusercontent.com
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET=GOCSPX-xxx...
```

### Step 3: Verify Supabase Configuration

Run the configuration script with production tokens if needed, or verify in the Supabase Dashboard that Google auth is enabled.

## Link Local to Remote (Important!)

After configuring Google OAuth in both local and remote environments, you must link your local Supabase instance to the remote project. This ensures:

- Configuration stays in sync between local and remote
- Database migrations can be pushed to production
- OAuth settings are properly tested locally against the remote project

### Link Your Project

Run the following command to link your local Supabase to the remote project:

```bash
supabase link --project-ref your-project-ref
```

**Finding Your Project Reference:**

1. Go to your Supabase project in the Dashboard
2. Navigate to **Project Settings** → **General**
3. Copy the "Reference ID" (e.g., `lqapcmyqpkjoqkqrjqpt`)

**Example Output:**

```bash
❯ supabase link --project-ref lqapcmyqpkjoqkqrjqpt
Initialising login role...
Connecting to remote database...
Finished supabase link.
```

**What This Does:**

- Creates a `.supabase/` directory with project configuration
- Connects your local development to the remote database
- Enables `supabase db push` to push migrations to production
- Allows pulling remote database schemas with `supabase db pull`

**Important Notes:**

- You only need to do this once per local development setup
- If you clone the project on a new machine, you'll need to link again
- The `.supabase/` directory is gitignored (contains project-specific config)

### Verify the Link

After linking, verify the connection:

```bash
# Check project status
supabase status

# Should show your remote project ref
```

## Testing

### Local Testing

1. Start your development server:

   ```bash
   bun dev
   ```

2. Navigate to your auth page (e.g., `http://localhost:3000/auth/login`)

3. Click the "Continue with Google" button

4. You should be redirected to Google's consent screen

5. After granting permissions, you should be redirected back and logged in

### Production Testing

1. Deploy your application to production

2. Navigate to your production auth page

3. Click "Continue with Google"

4. Verify the consent screen shows your correct app name and logo

5. After authentication, verify you're redirected correctly

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Problem:** The redirect URI doesn't match what's configured in Google Cloud Console.

**Solution:**

1. Check the error message for the actual redirect URI being used
2. Add that exact URI to your Google OAuth client's "Authorized redirect URIs"
3. Make sure there are no trailing slashes or typos

### Error: "Access blocked: Authorization Error"

**Problem:** Your app isn't verified or the user isn't added as a test user.

**Solution:**

- For development: Add the user's email to "Test users" in OAuth consent screen
- For production: Complete brand verification or publish your app

### Error: "Invalid client"

**Problem:** Client ID or Client Secret is incorrect.

**Solution:**

1. Verify the credentials in your `.env.local` or production environment
2. Check for extra spaces or newlines in the credentials
3. Regenerate the credentials in Google Cloud Console if needed

### Error: "The user already exists"

**Problem:** User tried to sign up with Google but email already exists with password auth.

**Solution:**

- This is expected behavior for security
- User should use "Sign in with Google" instead
- Or link accounts in profile settings

### Google Sign-In Button Not Working

**Problem:** Button doesn't do anything when clicked.

**Solution:**

1. Check browser console for errors
2. Verify `NEXT_PUBLIC_SUPABASE_URL` is set correctly
3. Check that Google OAuth is enabled in Supabase Dashboard
4. Verify network requests in browser DevTools

### Users Redirected to Wrong Page After Login

**Problem:** After Google auth, users land on the wrong page.

**Solution:**

1. Check the `redirectTo` prop in `GoogleSignInButton` component
2. Verify the `next` parameter in the OAuth callback route
3. Check middleware redirect logic in `lib/supabase/middleware.ts`

## How It Works

### Authentication Flow

1. **User Clicks "Sign in with Google"**

   - Component: `components/auth/google-sign-in-button.tsx`
   - Calls `supabase.auth.signInWithOAuth()` with provider: 'google'
   - Sets `redirectTo` to the OAuth callback route

2. **Redirect to Google**

   - Supabase redirects user to Google's consent screen
   - User sees your app name, logo, and requested permissions
   - User grants or denies access

3. **Google Redirects Back**

   - Google redirects to: `https://your-app.com/auth/oauth?code=xxx`
   - Route handler: `app/auth/oauth/route.ts`
   - Extracts authorization code and `next` parameter

4. **Code Exchange**

   - The route handler calls `supabase.auth.exchangeCodeForSession(code)`
   - Supabase exchanges code for access/refresh tokens
   - Session is saved to cookies

5. **Profile Creation**

   - Supabase auth webhook triggers profile creation
   - Database function: `supabase/schemas/03-functions.sql`
   - Creates profile with Google data (name, avatar)

6. **Final Redirect**
   - User is redirected to the `next` URL or home page
   - Middleware authenticates all subsequent requests
   - User is now logged in

### Components Reference

#### GoogleSignInButton

Location: `components/auth/google-sign-in-button.tsx`

The main Google sign-in button component:

```typescript
<GoogleSignInButton
  redirectTo="/dashboard"  // Where to go after successful auth
  disabled={false}         // Disable during loading states
  size="default"          // Button size
  variant="outline"       // Button style
/>
```

**Key Features:**

- Handles OAuth initiation
- Shows loading state during redirect
- Error handling with toast notifications
- Customizable appearance

#### OAuth Callback Route

Location: `app/auth/oauth/route.ts`

Handles the OAuth callback from Google:

```typescript
// Exchanges authorization code for session
const { error } = await supabase.auth.exchangeCodeForSession(code);

// Saves session to cookies
// Redirects to requested page or home
```

**Key Features:**

- PKCE flow code exchange
- Cookie-based session storage
- Handles redirect with `next` parameter
- Error handling and fallback redirects

#### Authentication Middleware

Location: `lib/supabase/middleware.ts`

Protects routes and manages sessions:

```typescript
// Public routes that don't require auth
const publicRoutes = [
  "/",
  "/auth",
  "/auth/oauth", // OAuth callback must be public
  // ...
];
```

**Key Features:**

- Session validation on every request
- Automatic redirect to login for protected routes
- Cookie management for SSR
- OAuth callback exemption

#### Auth Form Integration

Location: `components/auth/auth-form.tsx` and `components/auth/use-auth-form.ts`

The main authentication form that includes Google sign-in:

**Features:**

- Combined email/password and OAuth flow
- Development mode for password testing
- OTP verification for email sign-in
- Google OAuth button integration

### Security Considerations

1. **PKCE Flow**: The application uses PKCE (Proof Key for Code Exchange) for added security
2. **Session Cookies**: Sessions are stored in HTTP-only cookies, not accessible to JavaScript
3. **CSRF Protection**: Supabase handles CSRF tokens automatically
4. **Token Refresh**: Refresh tokens are securely stored and rotated
5. **Redirect Validation**: Only allowed redirect URLs are accepted

### Database Schema

When a user signs in with Google, Supabase automatically creates:

**auth.users table:**

- Basic user information
- Email (from Google)
- Email verified status (always true for OAuth)
- Provider information

**public.profiles table:**

- Extended user profile
- Full name (from Google)
- Avatar URL (from Google profile picture)
- Role (default: 'user')
- Created/updated timestamps

The profile is created automatically via a database trigger on user signup.

## Additional Resources

- [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Next.js Authentication Patterns](https://nextjs.org/docs/app/building-your-application/authentication)

## Support

If you encounter issues not covered in this guide:

1. Check the browser console for errors
2. Verify all environment variables are set correctly
3. Test with a different Google account
4. Review Supabase Auth logs in the Dashboard
5. Check the Google Cloud Console for API errors
