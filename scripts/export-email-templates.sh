#!/bin/bash

# Export Email Templates Script
# This script exports React Email templates to HTML and copies them to Supabase templates folder

set -e

echo "🎨 Exporting email templates for Nabostylisten..."

# Navigate to the transactional directory
cd "$(dirname "$0")/../transactional"

echo "📧 Running email export..."
bun run export

echo "📁 Creating Supabase templates directory if it doesn't exist..."
mkdir -p "../supabase/templates"

echo "📋 Copying exported templates to Supabase templates folder..."
cp -r out/* "../supabase/templates/"

echo "✅ Email templates exported successfully!"
echo "📁 Templates are now available in: supabase/templates/"
echo ""
echo "Next steps:"
echo "1. Update supabase/config.toml to reference the templates"
echo "2. Restart Supabase with: supabase stop && supabase start"