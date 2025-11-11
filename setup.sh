#!/bin/bash

# Duckboard Setup Script
# This script sets up the development environment for Duckboard

set -e

echo "🦆 Setting up Duckboard development environment..."

# Check Node.js version
echo "📋 Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18.0.0 or higher."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if ! node -e "process.exit(require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION') ? 0 : 1)" 2>/dev/null; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to 18.0.0 or higher."
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION is compatible"

# Check for package manager
echo "📦 Checking for package manager..."
if command -v pnpm &> /dev/null; then
    PKG_MANAGER="pnpm"
    INSTALL_CMD="pnpm install"
elif command -v yarn &> /dev/null; then
    PKG_MANAGER="yarn"
    INSTALL_CMD="yarn install"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
    INSTALL_CMD="npm install"
else
    echo "❌ No package manager found. Please install npm, yarn, or pnpm."
    exit 1
fi

echo "✅ Using $PKG_MANAGER as package manager"

# Install dependencies
echo "📥 Installing dependencies..."
$INSTALL_CMD

# Install Playwright browsers if using Playwright
echo "🎭 Setting up Playwright browsers..."
if command -v npx &> /dev/null; then
    npx playwright install --with-deps || echo "⚠️  Playwright browser installation failed, but continuing..."
fi

# Create necessary directories
echo "📁 Creating project directories..."
mkdir -p dist
mkdir -p docs
mkdir -p .github/workflows

# Run initial build to check for issues
echo "🔨 Running initial build..."
if [ "$PKG_MANAGER" = "npm" ]; then
    npm run build || echo "⚠️  Build failed, but setup continues..."
elif [ "$PKG_MANAGER" = "yarn" ]; then
    yarn build || echo "⚠️  Build failed, but setup continues..."
elif [ "$PKG_MANAGER" = "pnpm" ]; then
    pnpm build || echo "⚠️  Build failed, but setup continues..."
fi

# Run tests to verify setup
echo "🧪 Running tests..."
if [ "$PKG_MANAGER" = "npm" ]; then
    npm run test:unit || echo "⚠️  Tests failed, but setup continues..."
elif [ "$PKG_MANAGER" = "yarn" ]; then
    yarn test:unit || echo "⚠️  Tests failed, but setup continues..."
elif [ "$PKG_MANAGER" = "pnpm" ]; then
    pnpm test:unit || echo "⚠️  Tests failed, but setup continues..."
fi

echo ""
echo "🎉 Duckboard setup complete!"
echo ""
echo "Available commands:"
echo "  $PKG_MANAGER run dev          # Start development server"
echo "  $PKG_MANAGER run build        # Build for production"
echo "  $PKG_MANAGER run test         # Run unit tests"
echo "  $PKG_MANAGER run test:e2e     # Run end-to-end tests"
echo "  $PKG_MANAGER run lint          # Run linting"
echo "  $PKG_MANAGER run format        # Format code"
echo ""
echo "Visit DEPENDENCIES.md for detailed dependency information"
echo "Visit docs/ARCHITECTURE.md for architecture documentation"
echo ""
echo "Happy coding! 🦆"