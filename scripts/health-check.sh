#!/bin/bash
set -e

# Health Check Script
# Monitor all services and send alerts if unhealthy

SLACK_WEBHOOK="${SLACK_WEBHOOK_URL:-}"
EMAIL="${ALERT_EMAIL:-}"

check_service() {
    local service=$1
    local url=$2
    
    if curl -f -s -o /dev/null "$url"; then
        echo "✅ $service is healthy"
        return 0
    else
        echo "❌ $service is unhealthy"
        return 1
    fi
}

send_alert() {
    local message=$1
    
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK"
    fi
    
    if [ -n "$EMAIL" ]; then
        echo "$message" | mail -s "AppForge Health Alert" "$EMAIL"
    fi
}

echo "Running health checks..."

FAILED=0

# Check Backend
if ! check_service "Backend API" "http://localhost:5000/api/health"; then
    FAILED=1
    send_alert "⚠️ Backend API is down!"
fi

# Check Frontend
if ! check_service "Frontend" "http://localhost:5173"; then
    FAILED=1
    send_alert "⚠️ Frontend is down!"
fi

# Check MongoDB
if ! docker exec appforge-mongodb mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "❌ MongoDB is unhealthy"
    FAILED=1
    send_alert "⚠️ MongoDB is down!"
else
    echo "✅ MongoDB is healthy"
fi

# Check Redis
if ! docker exec appforge-redis redis-cli ping > /dev/null 2>&1; then
    echo "❌ Redis is unhealthy"
    FAILED=1
    send_alert "⚠️ Redis is down!"
else
    echo "✅ Redis is healthy"
fi

if [ $FAILED -eq 0 ]; then
    echo "✅ All services are healthy"
    exit 0
else
    echo "❌ Some services are unhealthy"
    exit 1
fi
