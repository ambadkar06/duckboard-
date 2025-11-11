@echo off
REM Duckboard Dependency Installation Script for Windows
REM This script handles dependency installation on Windows systems

setlocal enabledelayedexpansion

echo 🦆 Duckboard Dependency Installer (Windows)
echo ===========================================

REM Colors (limited support in Windows)
set "INFO=[INFO]"
set "SUCCESS=[SUCCESS]"
set "WARNING=[WARNING]"
set "ERROR=[ERROR]"

REM Check if we're in the right directory
if not exist "package.json" (
    echo %ERROR% package.json not found. Please run this script from the Duckboard root directory.
    exit /b 1
)

echo %INFO% Starting Duckboard dependency installation...

REM Check Node.js installation
echo %INFO% Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %ERROR% Node.js not found. Please install Node.js 18+ from https://nodejs.org/
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1 delims=v" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=1 delims=." %%i in ('echo !NODE_VERSION!') do set MAJOR_VERSION=%%i

if !MAJOR_VERSION! lss 18 (
    echo %ERROR% Node.js version !NODE_VERSION! is too old ^(minimum 18.0.0^)
    echo %ERROR% Please install Node.js 18+ from https://nodejs.org/
    exit /b 1
)

echo %SUCCESS% Node.js !NODE_VERSION! is installed and compatible

REM Detect package manager
echo %INFO% Detecting package manager...
set PM=npm

where pnpm >nul 2>&1
if %errorlevel% equ 0 (
    set PM=pnpm
    goto :install_deps
)

where yarn >nul 2>&1
if %errorlevel% equ 0 (
    set PM=yarn
    goto :install_deps
)

:install_deps
echo %INFO% Using package manager: %PM%

REM Install dependencies
echo %INFO% Installing dependencies with %PM%...

if "%PM%"=="pnpm" (
    pnpm install
) else if "%PM%"=="yarn" (
    yarn install
) else (
    npm install
)

if %errorlevel% neq 0 (
    echo %ERROR% Failed to install dependencies
    exit /b 1
)

echo %SUCCESS% Dependencies installed successfully

REM Ask about Playwright installation
set /p INSTALL_PLAYWRIGHT=Install Playwright browsers for E2E testing? (y/N): 
if /i "%INSTALL_PLAYWRIGHT%"=="y" (
    echo %INFO% Installing Playwright browsers...
    npx playwright install --with-deps
    if %errorlevel% equ 0 (
        echo %SUCCESS% Playwright browsers installed
    ) else (
        echo %WARNING% Playwright installation failed, but this is optional
    )
)

REM Verify installation
echo %INFO% Verifying installation...

REM Check if node_modules exists
if not exist "node_modules" (
    echo %ERROR% node_modules directory not found
    exit /b 1
)

REM Run type check
echo %INFO% Running TypeScript compilation check...
npm run type-check
if %errorlevel% equ 0 (
    echo %SUCCESS% TypeScript compilation successful
) else (
    echo %WARNING% TypeScript compilation failed
)

REM Run unit tests
echo %INFO% Running unit tests...
npm run test:unit
if %errorlevel% equ 0 (
    echo %SUCCESS% Unit tests passed
) else (
    echo %WARNING% Some unit tests failed
)

echo.
echo %SUCCESS% 🦆 Duckboard installation completed successfully!
echo.
echo Next steps:
echo 1. Run 'npm run dev' to start development server
echo 2. Visit http://localhost:5173 in your browser
echo 3. Check INSTALL.md for detailed setup instructions

pause