#!/bin/bash

# Script to sync email templates to production Supabase
# Usage: ./scripts/sync-email-template.sh

# Check if required environment variables are set
if [ -z "$SUPABASE_ACCESS_TOKEN" ] || [ -z "$SUPABASE_PROJECT_ID" ]; then
    echo "Error: Please set SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_ID environment variables"
    echo "Get your access token from: https://supabase.com/dashboard/account/tokens"
    echo "Get your project ref from your Supabase dashboard URL"
    exit 1
fi

# Read the HTML template file
TEMPLATE_CONTENT=$(cat transactional/out/nabostylisten-otp-code.html | jq -Rs .)

# Update both magic link and confirmation email templates in production
# Both should use the same OTP template since we're using OTP flow for both login and signup
curl -X PATCH "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_ID/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
      \"mailer_subjects_magic_link\": \"Din innloggingskode til COMPANY_NAME\",
      \"mailer_templates_magic_link_content\": $TEMPLATE_CONTENT,
      \"mailer_subjects_confirmation\": \"Din innloggingskode til COMPANY_NAME\",
      \"mailer_templates_confirmation_content\": $TEMPLATE_CONTENT
  }"

echo "Email templates synced to production!"
echo "Updated templates:"
echo "  - Magic Link (login)"
echo "  - Confirmation (signup)"