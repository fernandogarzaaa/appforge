#!/bin/bash
# =============================================================================
# Clawd Hybrid RTX 2060 Setup Script for Linux/WSL
# Requires: NVIDIA GPU with CUDA support, Docker with NVIDIA runtime
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_VERSION="3.10"
CUDA_VERSION="11.8"
REQUIRED_VRAM=6144  # 6GB in MB
MIN_DRIVER_VERSION=520

# -----------------------------------------------------------------------------
# Helper Functions
# -----------------------------------------------------------------------------
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        return 1
    fi
    return 0
}

# -----------------------------------------------------------------------------
# Print Banner
# -----------------------------------------------------------------------------
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         CLAWD HYBRID RTX 2060 - Linux/WSL Setup               ║"
echo "║         CUDA 11.8 Optimized Deployment                         ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# -----------------------------------------------------------------------------
# Check if running as root (discourage but allow with warning)
# -----------------------------------------------------------------------------
if [[ $EUID -eq 0 ]]; then
    log_warn "Running as root. Some operations may have permission issues."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# -----------------------------------------------------------------------------
# Detect OS
# -----------------------------------------------------------------------------
log_step "[1/10] Detecting operating system..."
if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    OS=$NAME
    VERSION=$VERSION_ID
    log_info "Detected: $OS $VERSION"
else
    log_warn "Could not detect OS"
    OS="Unknown"
fi

# Check if WSL
if grep -q Microsoft /proc/version 2>/dev/null || grep -q WSL /proc/version 2>/dev/null; then
    IS_WSL=true
    log_info "Running in WSL environment"
else
    IS_WSL=false
fi

# -----------------------------------------------------------------------------
# Check for NVIDIA GPU
# -----------------------------------------------------------------------------
log_step "[2/10] Detecting NVIDIA GPU..."
if ! check_command nvidia-smi; then
    log_error "nvidia-smi not found. Please install NVIDIA drivers."
    echo "Download from: https://www.nvidia.com/Download/index.aspx"
    exit 1
fi

GPU_INFO=$(nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader 2>/dev/null || true)
if [[ -z "$GPU_INFO" ]]; then
    log_error "Failed to query GPU information. Is an NVIDIA GPU present?"
    exit 1
fi

log_info "Detected GPU: $GPU_INFO"

# Check for RTX 2060
if echo "$GPU_INFO" | grep -qi "RTX 2060"; then
    log_info "✓ RTX 2060 detected - Optimal configuration will be applied"
    IS_RTX2060=true
else
    log_warn "GPU is not RTX 2060 - Script will continue but may need manual tuning"
    IS_RTX2060=false
fi

# Check VRAM
VRAM_STR=$(echo "$GPU_INFO" | awk -F',' '{print $2}' | tr -d ' ' | grep -o '[0-9]*')
if [[ -n "$VRAM_STR" ]]; then
    VRAM_MB=$VRAM_STR
    if [[ $VRAM_MB -lt $REQUIRED_VRAM ]]; then
        log_warn "GPU has less than 6GB VRAM ($VRAM_MB MB). Performance may be limited."
    else
        log_info "✓ VRAM sufficient: $VRAM_MB MB"
    fi
fi

# -----------------------------------------------------------------------------
# Check NVIDIA Driver Version
# -----------------------------------------------------------------------------
log_step "[3/10] Checking NVIDIA driver version..."
DRIVER_VERSION=$(echo "$GPU_INFO" | awk -F',' '{print $3}' | tr -d ' ')
DRIVER_MAJOR=$(echo "$DRIVER_VERSION" | cut -d. -f1)

if [[ $DRIVER_MAJOR -lt $MIN_DRIVER_VERSION ]]; then
    log_warn "Driver version $DRIVER_VERSION may be outdated."
    log_warn "Recommended: $MIN_DRIVER_VERSION or later for CUDA 11.8"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    log_info "✓ Driver version: $DRIVER_VERSION"
fi

# -----------------------------------------------------------------------------
# Check CUDA Installation
# -----------------------------------------------------------------------------
log_step "[4/10] Checking CUDA installation..."
if check_command nvcc; then
    CUDA_VERSION_DETECTED=$(nvcc --version | grep "release" | awk '{print $6}' | cut -c2-)
    log_info "CUDA found: $CUDA_VERSION_DETECTED"
    
    # Check if CUDA version matches expected
    if [[ ! "$CUDA_VERSION_DETECTED" =~ ^11\.8 ]]; then
        log_warn "CUDA version $CUDA_VERSION_DETECTED detected, but 11.8 is recommended for RTX 2060"
        log_info "Docker will use CUDA 11.8 runtime regardless"
    fi
else
    log_warn "CUDA toolkit not in PATH - will use Docker's CUDA runtime"
fi

# -----------------------------------------------------------------------------
# Check Docker Installation
# -----------------------------------------------------------------------------
log_step "[5/10] Checking Docker installation..."
if ! check_command docker; then
    log_error "Docker not found. Please install Docker."
    echo "Installation guide: https://docs.docker.com/engine/install/"
    exit 1
fi

# Check Docker daemon
if ! docker info > /dev/null 2>&1; then
    log_error "Docker daemon is not running or user lacks permissions"
    echo "Try: sudo systemctl start docker"
    echo "Or add user to docker group: sudo usermod -aG docker $USER"
    exit 1
fi
log_info "✓ Docker is installed and running"

# Check Docker Compose
if docker compose version > /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
    log_info "✓ Docker Compose V2 available"
elif check_command docker-compose; then
    DOCKER_COMPOSE="docker-compose"
    log_info "✓ Docker Compose V1 available"
else
    log_error "Docker Compose not found"
    exit 1
fi

# ----------------------------------------------------------------------------
# Check NVIDIA Docker Runtime
# ----------------------------------------------------------------------------
log_step "[6/10] Checking NVIDIA Container Toolkit..."
if docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi > /dev/null 2>&1; then
    log_info "✓ NVIDIA Container Toolkit is working"
else
    log_warn "NVIDIA Container Toolkit not configured or not working"
    echo ""
    echo "To install NVIDIA Container Toolkit:"
    echo "  $ distribution=$(. /etc/os-release;echo $ID$VERSION_ID)"
    echo "  $ curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -"
    echo "  $ curl -s -L https://nvidia.github.io/nvidia-docker/\$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list"
    echo "  $ sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit"
    echo "  $ sudo nvidia-ctk runtime configure --runtime=docker"
    echo "  $ sudo systemctl restart docker"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# -----------------------------------------------------------------------------
# Install System Dependencies
# -----------------------------------------------------------------------------
log_step "[7/10] Installing system dependencies..."
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    sudo apt-get update -qq
    sudo apt-get install -y -qq curl wget git build-essential
    log_info "✓ System dependencies installed"
elif [[ "$OS" == *"Fedora"* ]] || [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"RHEL"* ]]; then
    sudo dnf install -y -q curl wget git gcc gcc-c++ make
    log_info "✓ System dependencies installed"
else
    log_warn "Unknown OS - please ensure curl, wget, git, and build tools are installed"
fi

# -----------------------------------------------------------------------------
# Check / Create Environment File
# -----------------------------------------------------------------------------
log_step "[8/10] Checking environment configuration..."
if [[ ! -f ".env" ]]; then
    if [[ -f ".env.example" ]]; then
        log_info "Creating .env from .env.example..."
        cp ".env.example" ".env"
        log_warn "IMPORTANT: Please edit .env file and add your API keys"
    else
        log_warn ".env.example not found - creating minimal .env"
        cat > .env << 'EOF'
# Clawd Hybrid RTX Configuration
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
HUGGINGFACE_TOKEN=your_hf_token_here
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=admin
EOF
    fi
else
    log_info "✓ .env file exists"
fi

# -----------------------------------------------------------------------------
# Create Required Directories
# -----------------------------------------------------------------------------
log_step "[9/10] Creating directory structure..."
mkdir -p models cache logs metrics
mkdir -p monitoring/prometheus
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources
log_info "✓ Directories created"

# -----------------------------------------------------------------------------
# Generate Monitoring Configs
# -----------------------------------------------------------------------------
log_step "[10/10] Generating monitoring configurations..."

# Prometheus config
cat > monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'clawd-hybrid'
    static_configs:
      - targets: ['clawd-hybrid:9090']
    metrics_path: /metrics
    scrape_interval: 5s
EOF

# Grafana datasource
cat > monitoring/grafana/datasources/prometheus.yml << 'EOF'
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
EOF

log_info "✓ Monitoring configurations created"

# -----------------------------------------------------------------------------
# Build and Start
# -----------------------------------------------------------------------------
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  BUILDING AND STARTING CLAWD HYBRID RTX 2060"
echo "═══════════════════════════════════════════════════════════════"
echo ""

log_info "Building Docker images (this may take several minutes)..."
$DOCKER_COMPOSE build --no-cache
if [[ $? -ne 0 ]]; then
    log_error "Docker build failed"
    exit 1
fi
log_info "✓ Build completed"

echo ""
log_info "Starting services..."
$DOCKER_COMPOSE up -d
if [[ $? -ne 0 ]]; then
    log_error "Failed to start services"
    exit 1
fi

# -----------------------------------------------------------------------------
# Wait for services to be ready
# -----------------------------------------------------------------------------
echo ""
log_info "Waiting for services to be ready..."
sleep 5

# Check health
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
if [[ "$HEALTH_STATUS" == "200" ]]; then
    log_info "✓ Clawd API is healthy"
else
    log_warn "Clawd API health check returned $HEALTH_STATUS (may still be starting)"
fi

# -----------------------------------------------------------------------------
# Display Status
# -----------------------------------------------------------------------------
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  SETUP COMPLETE!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}Services are now running:${NC}"
echo "  - Clawd API:       http://localhost:8000"
echo "  - Health Check:    http://localhost:8000/health"
echo "  - Metrics (Prom):  http://localhost:9091"
echo "  - Dashboard:       http://localhost:3000  (admin/admin)"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "  - View logs:       $DOCKER_COMPOSE logs -f"
echo "  - Stop services:   $DOCKER_COMPOSE down"
echo "  - Restart:         $DOCKER_COMPOSE restart"
echo "  - GPU status:      docker compose exec clawd-hybrid nvidia-smi"
echo ""
echo -e "${YELLOW}Remember to edit .env file with your actual API keys!${NC}"
echo ""
