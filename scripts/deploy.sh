#!/bin/bash

# Skill Marketplace Deployment Script
# Usage: ./scripts/deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}

echo "🚀 Deploying Skill Marketplace to $ENVIRONMENT..."

# Check for required commands
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required but not installed."; exit 1; }

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    echo "📋 Loading environment from .env.$ENVIRONMENT"
    export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)
elif [ -f ".env" ]; then
    echo "📋 Loading environment from .env"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ No .env file found"
    exit 1
fi

# Build Docker image
echo "🏗️  Building Docker image..."
docker build -t skillmarketplace:$ENVIRONMENT .

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

# Start containers
echo "🚀 Starting containers..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for containers to be healthy
echo "⏳ Waiting for containers to be healthy..."
sleep 10

# Check container status
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "✅ Deployment successful!"
    echo ""
    echo "🌐 Application is running at http://localhost:3000"
    echo ""
    echo "📊 View logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "🛑 Stop: docker-compose -f docker-compose.prod.yml down"
else
    echo "❌ Deployment failed. Check logs:"
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi
