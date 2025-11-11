#!/bin/bash

# Duckboard Dependency Installation Script
# This script handles dependency installation across different environments

set -e

echo "🦆 Duckboard Dependency Installer"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Detect package manager
detect_package_manager() {
    if command_exists pnpm; then
        echo "pnpm"
    elif command_exists yarn; then
        echo "yarn"
    elif command_exists npm; then
        echo "npm"
    else
        echo "none"
    fi
}

# Install Node.js
install_nodejs() {
    print_status "Checking Node.js installation..."
    
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
        
        if [ "$MAJOR_VERSION" -ge 18 ]; then
            print_success "Node.js $NODE_VERSION is installed and compatible"
            return 0
        else
            print_warning "Node.js $NODE_VERSION is too old (minimum 18.0.0)"
        fi
    fi
    
    print_status "Installing Node.js 18..."
    
    # Try nvm first
    if command_exists nvm; then
        print_status "Using nvm to install Node.js 18"
        nvm install 18
        nvm use 18
        return 0
    fi
    
    # Platform-specific installation
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command_exists apt-get; then
            print_status "Installing Node.js via apt-get"
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif command_exists yum; then
            print_status "Installing Node.js via yum"
            curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
            sudo yum install -y nodejs
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        if command_exists brew; then
            print_status "Installing Node.js via Homebrew"
            brew install node@18
        else
            print_error "Please install Homebrew first: https://brew.sh"
            exit 1
        fi
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        print_error "Please install Node.js manually from https://nodejs.org/"
        exit 1
    fi
}

# Install package manager
install_package_manager() {
    local pm=$(detect_package_manager)
    
    if [[ "$pm" == "none" ]]; then
        print_status "Installing npm..."
        install_nodejs
        pm="npm"
    fi
    
    print_success "Using package manager: $pm"
    echo "$pm"
}

# Install dependencies
install_dependencies() {
    local pm=$1
    
    print_status "Installing dependencies with $pm..."
    
    case $pm in
        pnpm)
            pnpm install
            ;;
        yarn)
            yarn install
            ;;
        npm)
            npm install
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Install Playwright browsers
install_playwright() {
    print_status "Installing Playwright browsers for E2E testing..."
    
    if npx playwright install --with-deps; then
        print_success "Playwright browsers installed"
    else
        print_warning "Playwright installation failed, but this is optional"
    fi
}

# Verify installation
verify_installation() {
    print_status "Verifying installation..."
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_error "node_modules directory not found"
        exit 1
    fi
    
    # Check if package-lock.json/yarn.lock/pnpm-lock.yaml exists
    if [ ! -f "package-lock.json" ] && [ ! -f "yarn.lock" ] && [ ! -f "pnpm-lock.yaml" ]; then
        print_warning "Lock file not found"
    fi
    
    # Run type check
    if npm run type-check; then
        print_success "TypeScript compilation successful"
    else
        print_warning "TypeScript compilation failed"
    fi
    
    # Run unit tests
    if npm run test:unit; then
        print_success "Unit tests passed"
    else
        print_warning "Some unit tests failed"
    fi
}

# Main installation process
main() {
    print_status "Starting Duckboard dependency installation..."
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the Duckboard root directory."
        exit 1
    fi
    
    # Install Node.js if needed
    install_nodejs
    
    # Install package manager
    PM=$(install_package_manager)
    
    # Install dependencies
    install_dependencies "$PM"
    
    # Install Playwright (optional)
    read -p "Install Playwright browsers for E2E testing? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_playwright
    fi
    
    # Verify installation
    verify_installation
    
    print_success "🦆 Duckboard installation completed successfully!"
    echo
    echo "Next steps:"
    echo "1. Run 'npm run dev' to start development server"
    echo "2. Visit http://localhost:5173 in your browser"
    echo "3. Check INSTALL.md for detailed setup instructions"
}

# Handle script interruption
trap 'print_error "Installation interrupted"; exit 1' INT

# Run main function
main "$@"