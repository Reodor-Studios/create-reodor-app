#!/bin/bash

# Railway Setup Script
# This script helps new developers set up their Railway deployment
# by ensuring the Railway CLI is installed and linking the project.

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
info "Railway Setup Script for create-reodor-app"
echo ""

# Step 1: Check if Railway CLI is installed
info "Checking if Railway CLI is installed..."
if command -v railway &> /dev/null; then
    success "Railway CLI is already installed"
    RAILWAY_VERSION=$(railway --version 2>&1 || echo "unknown")
    info "Version: $RAILWAY_VERSION"
else
    warning "Railway CLI is not installed"
    info "Installing Railway CLI via npm..."

    # Check if npm is available
    if ! command -v npm &> /dev/null; then
        error "npm is not installed. Please install Node.js and npm first."
        exit 1
    fi

    # Install Railway CLI globally
    if npm install -g @railway/cli; then
        success "Railway CLI installed successfully"
    else
        error "Failed to install Railway CLI"
        error "Please try installing manually: npm install -g @railway/cli"
        exit 1
    fi
fi

echo ""

# Step 2: Authenticate with Railway
info "Authenticating with Railway..."
info "This will open a browser window for you to log in"
echo ""

if railway whoami &> /dev/null; then
    RAILWAY_USER=$(railway whoami 2>&1)
    success "Already authenticated as: $RAILWAY_USER"
else
    warning "Not authenticated with Railway"
    info "Running 'railway login'..."
    echo ""

    if railway login --browserless; then
        success "Authentication successful"
    else
        error "Authentication failed"
        exit 1
    fi
fi

echo ""

# Step 3: Link to Railway project
info "Linking to Railway project..."
echo ""

if [ -f ".railway/config.json" ]; then
    warning "Project appears to be already linked"
    info "Existing configuration found at .railway/config.json"
    echo ""
    read -p "Do you want to re-link the project? (y/N): " -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Skipping project linking"
    else
        if railway link; then
            success "Project linked successfully"
        else
            error "Failed to link project"
            exit 1
        fi
    fi
else
    info "Running 'railway link'..."
    info "Select your team, project, and environment when prompted"
    echo ""

    if railway link; then
        success "Project linked successfully"
    else
        error "Failed to link project"
        exit 1
    fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
success "Railway setup completed successfully!"
echo "═══════════════════════════════════════════════════════════"
echo ""
info "Next steps:"
echo ""
echo "  1. Set up environment variables:"
echo "     ${BLUE}bun run railway:push-env${NC}"
echo ""
echo "  2. Deploy your application:"
echo "     ${BLUE}railway up${NC}"
echo ""
echo "  3. View your deployment:"
echo "     ${BLUE}railway open${NC}"
echo ""
info "For more information, see docs/technical/railway-deployment.md"
echo ""
