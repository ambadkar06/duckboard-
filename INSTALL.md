# Duckboard Installation Guide

## Quick Installation

### Option 1: Automated Setup (Recommended)
```bash
# Unix/Mac/Linux
chmod +x setup.sh
./setup.sh

# Windows
setup.bat
```

### Option 2: Manual Installation
```bash
# Install dependencies
npm install

# Install Playwright browsers (for E2E tests)
npx playwright install --with-deps

# Run development server
npm run dev
```

## Prerequisites

### System Requirements
- **Node.js**: 18.0.0 or higher
- **Package Manager**: npm, yarn, or pnpm
- **Git**: For version control
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 2GB free space

### Browser Requirements
- Chrome 89+ (recommended)
- Firefox 78+
- Safari 14+
- Edge 89+

## Detailed Installation

### Step 1: Install Node.js

#### Using Node Version Manager (Recommended)
```bash
# Unix/Mac (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Windows (nvm-windows)
# Download from: https://github.com/coreybutler/nvm-windows/releases
nvm install 18.0.0
nvm use 18.0.0
```

#### Direct Installation
- Download from [nodejs.org](https://nodejs.org/)
- Choose LTS version (18.x or higher)

### Step 2: Verify Installation
```bash
node --version    # Should show v18.0.0 or higher
npm --version     # Should show 8.0.0 or higher
```

### Step 3: Clone Repository
```bash
git clone https://github.com/yourusername/duckboard.git
cd duckboard
```

### Step 4: Install Dependencies

#### Using npm (Default)
```bash
npm install
```

#### Using yarn
```bash
yarn install
```

#### Using pnpm (Fastest)
```bash
pnpm install
```

### Step 5: Install Playwright Browsers (Optional)
For end-to-end testing:
```bash
npx playwright install --with-deps
```

### Step 6: Verify Installation
```bash
# Run tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint

# Build
npm run build
```

## Platform-Specific Instructions

### macOS
```bash
# Install Node.js with Homebrew
brew install node@18

# Or use nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### Windows
```cmd
# Using Chocolatey
choco install nodejs --version=18.0.0

# Using Scoop
scoop install nodejs-lts

# Using winget
winget install OpenJS.NodeJS.LTS
```

### Linux (Ubuntu/Debian)
```bash
# Using NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### Docker (Alternative)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]
```

## Troubleshooting

### Common Issues

#### 1. Node.js Version Too Old
```bash
# Check current version
node --version

# Update Node.js
nvm install 18
nvm use 18
```

#### 2. Permission Errors (Unix/Mac)
```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

#### 3. Playwright Installation Fails
```bash
# Install dependencies manually
# Ubuntu/Debian
sudo apt-get install -y libgbm-dev libwoff1 libopus0 libwebp7 libwebpdemux2 libenchant1c2a libsecret-1-0 libhyphen0 libgdk-pixbuf2.0-0 libegl1 libnotify4 libxslt1.1 libevent-2.1-7 libgstreamer1.0-0 libgstreamer-plugins-base1.0-0

# macOS
xcode-select --install

# Then retry
npx playwright install --with-deps
```

#### 4. Build Fails
```bash
# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run type-check
```

#### 5. Memory Issues
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### Performance Optimization

#### Speed up installation
```bash
# Use pnpm for faster installs
npm install -g pnpm
pnpm install

# Use npm with cache
npm config set cache-max 86400000
```

#### Reduce bundle size
```bash
# Analyze bundle
npm run build
npx vite-bundle-analyzer dist
```

## Development Setup

### IDE Configuration
- **VS Code** (recommended): Install ESLint and Prettier extensions
- **WebStorm**: Built-in TypeScript and React support
- **Vim/Neovim**: Install TypeScript and React plugins

### Recommended VS Code Extensions
- ESLint
- Prettier
- TypeScript Hero
- Reactjs code snippets
- Auto Rename Tag

### Git Configuration
```bash
# Set up git hooks (optional)
npx husky install

# Configure git
 git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Verification Steps

After installation, verify everything works:

1. **Development Server**
   ```bash
   npm run dev
   ```
   Visit: http://localhost:5173

2. **Build Process**
   ```bash
   npm run build
   ```

3. **Testing**
   ```bash
   npm run test
   npm run test:e2e
   ```

4. **Code Quality**
   ```bash
   npm run lint
   npm run type-check
   npm run format
   ```

## Next Steps

1. **Read the Documentation**
   - [Development Guide](DEVELOPMENT.md)
   - [Architecture Overview](ARCHITECTURE.md)
   - [Dependencies](DEPENDENCIES.md)

2. **Start Development**
   ```bash
   npm run dev
   ```

3. **Run Tests**
   ```bash
   npm run test
   ```

4. **Explore the Codebase**
   - Start with `src/App.tsx`
   - Check `src/store/store.ts` for state management
   - Review `src/components/` for UI components

## Getting Help

- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check docs/ folder for detailed guides
- **Community**: Join discussions in GitHub Discussions

## Uninstallation

To completely remove Duckboard:
```bash
# Remove project folder
cd ..
rm -rf duckboard

# Remove global packages (if installed)
npm uninstall -g duckboard

# Clear npm cache
npm cache clean --force
```