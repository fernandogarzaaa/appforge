# Quick Redis Setup Script for Windows

Write-Host "🔧 Redis Setup for BullMQ" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is available
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue

if ($dockerInstalled) {
    Write-Host "✓ Docker found" -ForegroundColor Green
    
    # Check if Redis container exists
    $redisContainer = docker ps -a --filter "name=appforge-redis" --format "{{.Names}}"
    
    if ($redisContainer -eq "appforge-redis") {
        Write-Host "✓ Redis container exists" -ForegroundColor Green
        
        # Check if it's running
        $running = docker ps --filter "name=appforge-redis" --format "{{.Names}}"
        if ($running -eq "appforge-redis") {
            Write-Host "✓ Redis is already running" -ForegroundColor Green
        } else {
            Write-Host "▶ Starting Redis container..." -ForegroundColor Yellow
            docker start appforge-redis
            Start-Sleep -Seconds 2
            Write-Host "✓ Redis started" -ForegroundColor Green
        }
    } else {
        Write-Host "📦 Creating new Redis container..." -ForegroundColor Yellow
        docker run -d --name appforge-redis -p 6379:6379 redis:7-alpine
        Start-Sleep -Seconds 3
        Write-Host "✓ Redis container created and running" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "✅ Redis is ready at localhost:6379" -ForegroundColor Green
    Write-Host ""
    Write-Host "To stop Redis: docker stop appforge-redis" -ForegroundColor Gray
    Write-Host "To remove Redis: docker rm -f appforge-redis" -ForegroundColor Gray
    
} else {
    Write-Host "⚠ Docker not found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Redis installation options:" -ForegroundColor Cyan
    Write-Host "1. Install Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor White
    Write-Host "2. Install Redis via WSL2:" -ForegroundColor White
    Write-Host "   wsl --install" -ForegroundColor Gray
    Write-Host "   sudo apt update && sudo apt install redis-server" -ForegroundColor Gray
    Write-Host "   sudo service redis-server start" -ForegroundColor Gray
    Write-Host "3. Install via Chocolatey:" -ForegroundColor White
    Write-Host "   choco install redis-64" -ForegroundColor Gray
    Write-Host "   redis-server" -ForegroundColor Gray
    Write-Host ""
}
