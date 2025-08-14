#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Aurora Transit development environment...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if database is already running
if docker-compose ps | grep -q "travel-helper-db.*Up"; then
    echo -e "${GREEN}✅ Database is already running${NC}"
else
    echo -e "${YELLOW}🐳 Starting PostgreSQL database...${NC}"
    docker-compose up -d
    
    # Wait for database to be ready
    echo -e "${YELLOW}⏳ Waiting for database to be ready...${NC}"
    until docker-compose exec -T postgres pg_isready -U postgres -d travel_helper > /dev/null 2>&1; do
        echo -e "${YELLOW}.${NC}" 
        sleep 1
    done
    echo -e "${GREEN}✅ Database is ready!${NC}"
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please update your .env file with actual values before continuing${NC}"
fi

# Generate Prisma client and run migrations if needed
echo -e "${YELLOW}🔧 Setting up database schema...${NC}"
yarn prisma generate > /dev/null 2>&1
yarn prisma migrate dev --name init > /dev/null 2>&1

echo -e "${GREEN}🌟 Starting Next.js development server...${NC}"
echo -e "${GREEN}📱 App will be available at: http://localhost:3000${NC}"
echo -e "${GREEN}🗄️  Database running on: localhost:15432${NC}"

# Start Next.js dev server
yarn next dev
