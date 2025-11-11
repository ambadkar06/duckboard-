@echo off
REM Duckboard Setup Script for Windows
REM This script sets up the development environment for Duckboard

setlocal enabledelayedexpansion

echo 🦆 Setting up Duckboard development environment...

REM Check Node.js version
echo 📋 Checking Node.js version...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18.0.0 or higher.
    echo    Visit: https://nodejs.org/
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
set NODE_VERSION=%NODE_VERSION:v=%

echo ✅ Node.js version %NODE_VERSION% detected

REM Check for package manager
echo 📦 Checking for package manager...
where npm >nul 2>&1
if %errorlevel% equ 0 (
    set PKG_MANAGER=npm
    set INSTALL_CMD=npm install
    goto :install
)

where yarn >nul 2>&1
if %errorlevel% equ 0 (
    set PKG_MANAGER=yarn
    set INSTALL_CMD=yarn install
    goto :install
)

where pnpm >nul 2>&1
if %errorlevel% equ 0 (
    set PKG_MANAGER=pnpm
    set INSTALL_CMD=pnpm install
    goto :install
)

echo ❌ No package manager found. Please install npm, yarn, or pnpm.
exit /b 1

:install
echo ✅ Using %PKG_MANAGER% as package manager

REM Install dependencies
echo 📥 Installing dependencies...
%INSTALL_CMD%
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

REM Install Playwright browsers if using Playwright
echo 🎭 Setting up Playwright browsers...
where npx >nul 2>&1
if %errorlevel% equ 0 (
    npx playwright install --with-deps
    if %errorlevel% neq 0 (
        echo ⚠️  Playwright browser installation failed, but continuing...
    )
)

REM Create necessary directories
echo 📁 Creating project directories...
if not exist dist mkdir dist
if not exist docs mkdir docs
if not exist .github\workflows mkdir .github\workflows

REM Run initial build to check for issues
echo 🔨 Running initial build...
if "%PKG_MANAGER%"=="npm" (
    npm run build
) else if "%PKG_MANAGER%"=="yarn" (
    yarn build
) else if "%PKG_MANAGER%"=="pnpm" (
    pnpm build
)

if %errorlevel% neq 0 (
    echo ⚠️  Build failed, but setup continues...
)

REM Run tests to verify setup
echo 🧪 Running tests...
if "%PKG_MANAGER%"=="npm" (
    npm run test:unit
) else if "%PKG_MANAGER%"=="yarn" (
    yarn test:unit
) else if "%PKG_MANAGER%"=="pnpm" (
    pnpm test:unit
)

if %errorlevel% neq 0 (
    echo ⚠️  Tests failed, but setup continues...
)

echo.
echo 🎉 Duckboard setup complete!
echo.
echo Available commands:
echo   %PKG_MANAGER% run dev          # Start development server
echo   %PKG_MANAGER% run build        # Build for production
echo   %PKG_MANAGER% run test         # Run unit tests
echo   %PKG_MANAGER% run test:e2e     # Run end-to-end tests
echo   %PKG_MANAGER% run lint         # Run linting
echo   %PKG_MANAGER% run format       # Format code
echo.
echo Visit DEPENDENCIES.md for detailed dependency information
echo Visit docs/ARCHITECTURE.md for architecture documentation
echo.
echo Happy coding! 🦆

endlocal