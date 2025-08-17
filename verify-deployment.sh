#!/bin/bash

echo "🚀 AI Workflow Platform - Deployment Verification"
echo "================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Check if services are up
echo "📋 Checking service status..."

services=("ai_workflow_db" "ai_workflow_backend" "ai_workflow_frontend")
all_running=true

for service in "${services[@]}"; do
    if docker ps --format "table {{.Names}}" | grep -q "$service"; then
        echo "✅ $service is running"
    else
        echo "❌ $service is not running"
        all_running=false
    fi
done

if [ "$all_running" = true ]; then
    echo ""
    echo "🎉 All services are running successfully!"
    echo ""
    echo "📱 Access your application:"
    echo "   Frontend:  http://localhost:3030"
    echo "   Backend:   http://localhost:3001/health"
    echo "   Database:  localhost:5433 (PostgreSQL)"
    echo ""
    echo "🔑 To enable AI chat functionality:"
    echo "   1. Get an API key from https://openrouter.ai"
    echo "   2. Add it to .env file: OPENROUTER_API_KEY=your-key"
    echo "   3. Restart: docker compose down && docker compose up -d"
    echo ""
    echo "📚 Documentation: ./backend/API_CONTRACT.md"
else
    echo ""
    echo "⚠️  Some services are not running. Try:"
    echo "   docker compose down"
    echo "   docker compose up -d"
fi