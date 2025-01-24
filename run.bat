@echo off

REM Check if docker-compose is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo Docker Desktop is not installed or not available in PATH.
    echo Please install Docker (https://www.docker.com/products/docker-desktop/) and try again.
    exit /b 1
)

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo Git is not installed or not available in PATH.
    echo Please install Git (https://git-scm.com/downloads/win) and try again.
    exit /b 1
)

REM Stop the running containers and remove them
docker compose down

REM Pull the latest changes from the git repository
git pull

REM Build and start the containers
docker compose up --build
