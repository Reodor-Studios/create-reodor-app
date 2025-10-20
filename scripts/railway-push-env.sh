#!/bin/bash

# Railway Environment Variables Push Script
# This script helps push environment variables from .env.example to Railway

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
info() {
    echo "${BLUE}ℹ${NC} $1"
}

success() {
    echo "${GREEN}✓${NC} $1"
}

warning() {
    echo "${YELLOW}⚠${NC} $1"
}

error() {
    echo "${RED}✗${NC} $1"
}

echo ""
info "Railway Environment Variables Setup"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    error "Railway CLI is not installed"
    info "Please run: bun run railway:setup"
    exit 1
fi

# Check if authenticated
if ! railway whoami &> /dev/null; then
    error "Not authenticated with Railway"
    info "Please run: railway login"
    exit 1
fi

# Check if project is linked by trying to get status
if ! railway status &> /dev/null; then
    error "Project is not linked to Railway"
    info "Please run: bun run railway:setup"
    exit 1
fi

# Check if .env.example exists
if [ ! -f ".env.example" ]; then
    error ".env.example file not found"
    exit 1
fi

# Check if .env.production exists, if not prompt to create it
if [ ! -f ".env.production" ]; then
    echo ""
    warning ".env.production file not found"
    echo ""
    info "Before pushing variables to Railway, you need to create a ${BLUE}.env.production${NC} file"
    info "This file should contain your PRODUCTION external service credentials:"
    echo ""
    echo "  ${YELLOW}Required External Services:${NC}"
    echo "  • Supabase (project URL, anon key, secret key, database URL)"
    echo "  • Google OAuth (client ID and secret)"
    echo "  • Resend (API key for transactional emails)"
    echo "  • CRON_SECRET (generate with: openssl rand -base64 32)"
    echo ""
    info "You can copy .env.example as a starting point:"
    echo "  ${BLUE}cp .env.example .env.production${NC}"
    echo ""
    info "Then fill in your PRODUCTION credentials in .env.production"
    echo ""
    read -p "Would you like to create .env.production now? (Y/n): " -r CREATE_ENV
    echo ""

    # Default to Yes if user just presses Enter
    CREATE_ENV=${CREATE_ENV:-Y}

    if [[ $CREATE_ENV =~ ^[Yy]$ ]]; then
        cp .env.example .env.production
        success "Created .env.production from .env.example"
        echo ""
        warning "Please edit .env.production and add your PRODUCTION credentials"
        info "After updating .env.production, run this script again:"
        echo "  ${BLUE}bun run railway:push-env${NC}"
        exit 0
    else
        info "Please create .env.production manually, then run this script again"
        exit 0
    fi
fi

echo ""
info "Choose how to set environment variables:"
echo ""
echo "  ${GREEN}1.${NC} ${BLUE}Copy from .env.production${NC} - Copy values from existing .env.production file ${GREEN}(default)${NC}"
echo "  ${GREEN}2.${NC} ${BLUE}Interactive mode${NC} - Enter each value manually"
echo ""
read -p "Select option (1 or 2) [1]: " -r MODE
echo ""

# Default to option 1 if user just presses Enter
MODE=${MODE:-1}

if [ "$MODE" == "1" ]; then
    info "Reading variables from .env.production..."
    echo ""

    # Read .env.production and push to Railway
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip empty lines and comments
        if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
            continue
        fi

        # Extract variable name and value
        if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
            VAR_NAME="${BASH_REMATCH[1]}"
            VAR_VALUE="${BASH_REMATCH[2]}"

            # Remove quotes from value if present
            VAR_VALUE="${VAR_VALUE%\"}"
            VAR_VALUE="${VAR_VALUE#\"}"

            # Skip placeholder values
            if [[ "$VAR_VALUE" == your-* || "$VAR_VALUE" == *"your-"* ]]; then
                warning "Skipping $VAR_NAME (placeholder value detected)"
                continue
            fi

            info "Setting: $VAR_NAME"
            if railway variables --set "$VAR_NAME=$VAR_VALUE" &> /dev/null; then
                success "Set $VAR_NAME"
            else
                error "Failed to set $VAR_NAME"
            fi
        fi
    done < .env.production

elif [ "$MODE" == "2" ]; then
    info "Interactive mode - enter values for each variable"
    info "Press Enter to skip a variable"
    echo ""

    # Read .env.example and prompt for each variable
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip empty lines and comments
        if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
            continue
        fi

        # Extract variable name
        if [[ "$line" =~ ^([^=]+)= ]]; then
            VAR_NAME="${BASH_REMATCH[1]}"

            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            info "Variable: ${BLUE}$VAR_NAME${NC}"

            # Show hint from comment if available
            HINT=$(grep -A1 "^$VAR_NAME=" .env.example | tail -n1 | sed 's/^[[:space:]]*#[[:space:]]*//')
            if [[ ! -z "$HINT" && "$HINT" != "$VAR_NAME"* ]]; then
                echo "  Hint: $HINT"
            fi

            # Special handling for specific variables
            case "$VAR_NAME" in
                *_SECRET|*_KEY)
                    echo "  ${YELLOW}⚠ This is a secret value${NC}"
                    ;;
                NEXT_PUBLIC_*)
                    echo "  ${BLUE}ℹ This is a public variable (visible in browser)${NC}"
                    ;;
            esac

            # Prompt for value
            read -p "  Enter value (or press Enter to skip): " -r VAR_VALUE

            if [[ -z "$VAR_VALUE" ]]; then
                warning "Skipped $VAR_NAME"
                continue
            fi

            # Set variable in Railway
            if railway variables --set "$VAR_NAME=$VAR_VALUE" &> /dev/null; then
                success "Set $VAR_NAME"
            else
                error "Failed to set $VAR_NAME"
            fi
        fi
    done < .env.example

else
    error "Invalid option selected"
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
success "Environment variables setup completed!"
echo "═══════════════════════════════════════════════════════════"
echo ""
info "You can view your variables with:"
echo "  ${BLUE}railway variables${NC}"
echo ""
info "To deploy your application:"
echo "  ${BLUE}railway up${NC}"
echo ""
