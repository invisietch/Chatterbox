#!/bin/bash

# Check if docker-compose is installed
if ! command -v docker &> /dev/null
then
    echo "Docker is not installed or not available in PATH."
    echo "Please install Docker (https://www.docker.com/products/docker-desktop/) and try again."
    exit 1
fi

# Check if git is installed
if ! command -v git &> /dev/null
then
    echo "Git is not installed or not available in PATH."
    echo "Please install Git (https://git-scm.com/downloads/) and try again."
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "No .env file found. Please copy .env.example to .env and add your HF token if desired."
    exit 1
fi

# Stop the running containers and remove them
docker compose down

# Pull the latest changes from the git repository
git pull

# Build and start the containers
docker compose up --build
