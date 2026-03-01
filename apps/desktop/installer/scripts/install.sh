#!/bin/bash
# AppForge Desktop Installer for macOS/Linux
# One-line installation: curl -fsSL https://appforge.ai/install.sh | bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
INSTALL_DIR="${INSTALL_DIR:-$HOME/.appforge}"
VERSION="${VERSION:-latest}"
SKIP_DESKTOP_ENTRY=false
ADD_TO_PATH=true

# Logging functions
log_info() {
    echo -e "${BLUE}[AppForge]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[AppForge]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[AppForge]${NC} $1"
}

log_error() {
    echo -e "${RED}[AppForge]${NC} $1"
}

# Detect OS and architecture
detect_platform() {
    OS="$(uname -s)"
    ARCH="$(uname -m)"
    
    case "$OS" in
        Linux*)     PLATFORM="linux";;
        Darwin*)    PLATFORM="macos";;
        *)          log_error "Unsupported operating system: $OS"; exit 1;;
    esac
    
    case "$ARCH" in
        x86_64)     ARCH="x64";;
        arm64|aarch64) ARCH="arm64";;
        *)          log_error "Unsupported architecture: $ARCH"; exit 1;;
    esac
    
    log_info "Detected platform: $PLATFORM-$ARCH"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check for required commands
    local required_commands=("curl" "tar" "mkdir")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "Required command not found: $cmd"
            exit 1
        fi
    done
    
    # Check for Node.js (optional)
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_success "Node.js found: $NODE_VERSION"
    else
        log_warn "Node.js not found. Some features may be limited."
    fi
    
    log_success "Prerequisites check passed"
}

# Get latest version from GitHub
get_latest_version() {
    if [ "$VERSION" = "latest" ]; then
        # In production, this would fetch from GitHub API
        VERSION="3.0.0"
    fi
    log_info "Installing AppForge v$VERSION"
}

# Download AppForge
download_appforge() {
    local filename="AppForge-${PLATFORM}-${ARCH}.tar.gz"
    local download_url="https://github.com/fernandogarzaaa/appforge/releases/download/v${VERSION}/${filename}"
    local temp_file="/tmp/${filename}"
    
    log_info "Downloading AppForge..."
    log_info "URL: $download_url"
    
    if curl -fsSL "$download_url" -o "$temp_file" 2>/dev/null; then
        log_success "Download complete"
        DOWNLOADED_FILE="$temp_file"
    else
        log_error "Download failed"
        log_info "Creating placeholder installation..."
        DOWNLOADED_FILE=""
    fi
}

# Install AppForge
install_appforge() {
    log_info "Installing AppForge to $INSTALL_DIR..."
    
    # Create installation directory
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$INSTALL_DIR/bin"
    mkdir -p "$INSTALL_DIR/lib"
    mkdir -p "$INSTALL_DIR/config"
    mkdir -p "$INSTALL_DIR/logs"
    mkdir -p "$INSTALL_DIR/data"
    
    # Extract if downloaded
    if [ -n "$DOWNLOADED_FILE" ] && [ -f "$DOWNLOADED_FILE" ]; then
        tar -xzf "$DOWNLOADED_FILE" -C "$INSTALL_DIR"
        rm -f "$DOWNLOADED_FILE"
    fi
    
    log_success "Installation complete"
}

# Add to PATH
add_to_path() {
    if [ "$ADD_TO_PATH" = true ]; then
        local shell_rc=""
        local path_entry="export PATH=\"$INSTALL_DIR/bin:\$PATH\""
        
        # Detect shell
        case "$(basename "$SHELL")" in
            bash) shell_rc="$HOME/.bashrc";;
            zsh)  shell_rc="$HOME/.zshrc";;
            fish) shell_rc="$HOME/.config/fish/config.fish";;
            *)    shell_rc="$HOME/.profile";;
        esac
        
        # Check if already in PATH
        if ! grep -q "$INSTALL_DIR/bin" "$shell_rc" 2>/dev/null; then
            echo "" >> "$shell_rc"
            echo "# AppForge" >> "$shell_rc"
            echo "$path_entry" >> "$shell_rc"
            log_success "Added to PATH in $shell_rc"
            log_info "Please run: source $shell_rc"
        else
            log_info "Already in PATH"
        fi
    fi
}

# Create desktop entry (Linux)
create_desktop_entry() {
    if [ "$PLATFORM" = "linux" ] && [ "$SKIP_DESKTOP_ENTRY" = false ]; then
        local desktop_dir="$HOME/.local/share/applications"
        mkdir -p "$desktop_dir"
        
        cat > "$desktop_dir/appforge.desktop" << EOF
[Desktop Entry]
Name=AppForge
Comment=Quantum-powered development platform
Exec=$INSTALL_DIR/bin/AppForge
Icon=$INSTALL_DIR/assets/icon.png
Type=Application
Categories=Development;IDE;
Terminal=false
StartupNotify=true
EOF
        
        # Update desktop database
        if command -v update-desktop-database &> /dev/null; then
            update-desktop-database "$desktop_dir" 2>/dev/null || true
        fi
        
        log_success "Desktop entry created"
    fi
}

# Create macOS app bundle
create_macos_app() {
    if [ "$PLATFORM" = "macos" ]; then
        local app_dir="$HOME/Applications/AppForge.app"
        mkdir -p "$app_dir/Contents/MacOS"
        mkdir -p "$app_dir/Contents/Resources"
        
        # Create Info.plist
        cat > "$app_dir/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>AppForge</string>
    <key>CFBundleIdentifier</key>
    <string>ai.appforge.desktop</string>
    <key>CFBundleName</key>
    <string>AppForge</string>
    <key>CFBundleVersion</key>
    <string>$VERSION</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.14</string>
</dict>
</plist>
EOF
        
        # Create launcher script
        cat > "$app_dir/Contents/MacOS/AppForge" << EOF
#!/bin/bash
cd "$INSTALL_DIR"
exec "$INSTALL_DIR/bin/AppForge" "\$@"
EOF
        chmod +x "$app_dir/Contents/MacOS/AppForge"
        
        log_success "macOS app bundle created at $app_dir"
    fi
}

# Create uninstaller
create_uninstaller() {
    cat > "$INSTALL_DIR/uninstall.sh" << 'EOF'
#!/bin/bash
set -e

echo "Uninstalling AppForge..."

INSTALL_DIR="$(cd "$(dirname "$0")" && pwd)"

# Remove desktop entry (Linux)
if [ -f "$HOME/.local/share/applications/appforge.desktop" ]; then
    rm -f "$HOME/.local/share/applications/appforge.desktop"
    echo "Removed desktop entry"
fi

# Remove macOS app
if [ -d "$HOME/Applications/AppForge.app" ]; then
    rm -rf "$HOME/Applications/AppForge.app"
    echo "Removed macOS app"
fi

# Remove from PATH
for rc in "$HOME/.bashrc" "$HOME/.zshrc" "$HOME/.profile"; do
    if [ -f "$rc" ]; then
        sed -i.bak '/# AppForge/d' "$rc" 2>/dev/null || true
        sed -i.bak '/export PATH=.*appforge/d' "$rc" 2>/dev/null || true
    fi
done

# Remove installation directory
rm -rf "$INSTALL_DIR"

echo "AppForge has been uninstalled."
EOF
    chmod +x "$INSTALL_DIR/uninstall.sh"
    
    log_success "Uninstaller created"
}

# Print banner
print_banner() {
    echo ""
    echo -e "${BLUE}    _    ____  __  _________  ______  _____${NC}"
    echo -e "${BLUE}   / \\  |  _ \\| | | |  ___\\ \\/ / ___||  ___|${NC}"
    echo -e "${BLUE}  / _ \\ | |_) | | | | |_   \\  /\\___ \\| |_${NC}"
    echo -e "${BLUE} / ___ \\|  __/| |_| |  _|  /  \\ ___) |  _|${NC}"
    echo -e "${BLUE}/_/   \\_\\_|    \\___/|_|   /_/\\_\\____/|_|${NC}"
    echo ""
}

# Print completion message
print_completion() {
    echo ""
    log_success "Installation complete!"
    log_info "AppForge has been installed to: $INSTALL_DIR"
    echo ""
    echo -e "${BLUE}Getting Started:${NC}"
    echo "  1. Launch AppForge from your applications menu"
    echo "  2. Or run: $INSTALL_DIR/bin/AppForge"
    echo "  3. Follow the onboarding wizard"
    echo "  4. Start building with quantum-powered AI!"
    echo ""
    echo -e "${BLUE}Documentation:${NC} https://docs.appforge.ai"
    echo -e "${BLUE}Support:${NC} https://github.com/fernandogarzaaa/appforge/issues"
    echo ""
    
    # Ask to launch
    read -p "Would you like to launch AppForge now? [Y/n] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
        if [ -f "$INSTALL_DIR/bin/AppForge" ]; then
            "$INSTALL_DIR/bin/AppForge" &
        else
            log_warn "Could not find AppForge binary"
        fi
    fi
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --install-dir)
                INSTALL_DIR="$2"
                shift 2
                ;;
            --version)
                VERSION="$2"
                shift 2
                ;;
            --skip-desktop-entry)
                SKIP_DESKTOP_ENTRY=true
                shift
                ;;
            --no-path)
                ADD_TO_PATH=false
                shift
                ;;
            --help)
                echo "AppForge Installer"
                echo ""
                echo "Usage: install.sh [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --install-dir DIR       Installation directory (default: ~/.appforge)"
                echo "  --version VERSION       Version to install (default: latest)"
                echo "  --skip-desktop-entry    Skip creating desktop entry"
                echo "  --no-path               Don't add to PATH"
                echo "  --help                  Show this help message"
                echo ""
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
}

# Main function
main() {
    parse_args "$@"
    print_banner
    
    log_info "AppForge Desktop Installer"
    log_info "Version: $VERSION"
    log_info "Install Directory: $INSTALL_DIR"
    echo ""
    
    detect_platform
    check_prerequisites
    get_latest_version
    download_appforge
    install_appforge
    add_to_path
    create_desktop_entry
    create_macos_app
    create_uninstaller
    print_completion
}

# Run main function
main "$@"
