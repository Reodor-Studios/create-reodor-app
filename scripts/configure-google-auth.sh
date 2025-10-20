#!/bin/bash

# Configure Google Auth Script
# This script configures Google OAuth provider for Supabase using the Management API

set -e

echo "🔐 Configuring Google Auth..."

# Check required environment variables
if [[ -z "$SUPABASE_ACCESS_TOKEN" ]]; then
    echo "❌ Error: SUPABASE_ACCESS_TOKEN environment variable is required"
    echo "   Generate one at: https://supabase.com/dashboard/account/tokens"
    exit 1
fi

if [[ -z "$SUPABASE_PROJECT_REF" ]]; then
    echo "❌ Error: SUPABASE_PROJECT_REF environment variable is required"
    echo "   Find it in your Supabase project settings"
    exit 1
fi

if [[ -z "$SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID" ]]; then
    echo "❌ Error: SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID environment variable is required"
    echo "   Get it from Google Cloud Console OAuth credentials"
    exit 1
fi

if [[ -z "$SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET" ]]; then
    echo "❌ Error: SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET environment variable is required"
    echo "   Get it from Google Cloud Console OAuth credentials"
    exit 1
fi

echo "📋 Project Ref: $SUPABASE_PROJECT_REF"
echo "🔑 Client ID: ${SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID:0:20}..."

# Configure Google OAuth provider
echo "🚀 Enabling Google OAuth provider..."

curl -X PATCH \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "external_google_enabled": true,
    "external_google_client_id": "'"$SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID"'",
    "external_google_secret": "'"$SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET"'"
  }' \
  "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/config/auth"

if [[ $? -eq 0 ]]; then
    echo "✅ Google OAuth provider configured successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Verify configuration in Supabase Dashboard > Authentication > Providers"
    echo "2. Test Google sign-in in your application"
    echo "3. Ensure redirect URIs are configured in Google Cloud Console"
else
    echo "❌ Failed to configure Google OAuth provider"
    exit 1
fi