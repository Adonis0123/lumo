#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DAEMON_NAME="lumo-daemon"
INSTALL_DIR="$HOME/.lumo/bin"
LOG_DIR="$HOME/.lumo/logs"
SERVICE_DIR="$HOME/.config/systemd/user"

echo -e "${GREEN}=== Lumo Daemon Installation (Linux) ===${NC}"
echo ""

# Check if running on Linux
if [[ "$(uname)" != "Linux" ]]; then
    echo -e "${RED}Error: This script only works on Linux${NC}"
    exit 1
fi

# Check if systemctl is available
if ! command -v systemctl &>/dev/null; then
    echo -e "${RED}Error: systemctl not found. systemd is required.${NC}"
    exit 1
fi

# Get the project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Project root: $PROJECT_ROOT"
echo ""

# Step 1: Build daemon in release mode
echo -e "${YELLOW}[1/5]${NC} Building daemon..."
cd "$PROJECT_ROOT"
cargo build --release -p lumo-daemon

if [ ! -f "target/release/$DAEMON_NAME" ]; then
    echo -e "${RED}Error: Build failed - binary not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Build complete"
echo ""

# Step 2: Copy binary to ~/.lumo/bin
echo -e "${YELLOW}[2/5]${NC} Installing binary to $INSTALL_DIR..."
mkdir -p "$INSTALL_DIR" "$LOG_DIR"
cp "target/release/$DAEMON_NAME" "$INSTALL_DIR/$DAEMON_NAME"
chmod +x "$INSTALL_DIR/$DAEMON_NAME"
echo -e "${GREEN}✓${NC} Binary installed: $INSTALL_DIR/$DAEMON_NAME"
echo ""

# Step 3: Install systemd user service
echo -e "${YELLOW}[3/5]${NC} Installing systemd user service..."
mkdir -p "$SERVICE_DIR"

sed -e "s|{{DAEMON_PATH}}|$INSTALL_DIR/$DAEMON_NAME|g" \
    -e "s|{{LOG_DIR}}|$LOG_DIR|g" \
    -e "s|{{HOME}}|$HOME|g" \
    "$PROJECT_ROOT/src-tauri/resources/lumo-daemon.service.template" > "$SERVICE_DIR/lumo-daemon.service"

echo -e "${GREEN}✓${NC} Service installed: $SERVICE_DIR/lumo-daemon.service"
echo ""

# Step 4: Reload systemd and start service
echo -e "${YELLOW}[4/5]${NC} Starting daemon..."

# Stop existing service if running
systemctl --user stop lumo-daemon 2>/dev/null || true

systemctl --user daemon-reload
systemctl --user enable --now lumo-daemon

# Wait a moment for it to start
sleep 2

# Step 5: Verify it's running
echo -e "${YELLOW}[5/5]${NC} Verifying..."
if systemctl --user is-active --quiet lumo-daemon; then
    echo -e "${GREEN}✓${NC} Daemon started successfully"
else
    echo -e "${RED}✗${NC} Failed to start daemon"
    echo "Check logs:"
    echo "  journalctl --user -u lumo-daemon --no-pager -n 20"
    echo "  cat $LOG_DIR/stderr.log"
    exit 1
fi

echo ""
echo -e "${GREEN}=== Installation Complete ===${NC}"
echo ""
echo "Daemon Details:"
echo "  Binary:   $INSTALL_DIR/$DAEMON_NAME"
echo "  Service:  $SERVICE_DIR/lumo-daemon.service"
echo "  Logs:     $LOG_DIR"
echo "  Endpoint: http://localhost:4318/v1/traces"
echo "  Health:   http://localhost:4318/health"
echo ""
echo "Useful commands:"
echo "  Check status:  systemctl --user status lumo-daemon"
echo "  View logs:     tail -f $LOG_DIR/stdout.log"
echo "  Stop daemon:   systemctl --user stop lumo-daemon"
echo "  Start daemon:  systemctl --user start lumo-daemon"
echo "  Restart:       systemctl --user restart lumo-daemon"
echo "  Uninstall:     ./scripts/uninstall-daemon-linux.sh"
echo ""
echo "Test the daemon:"
echo "  curl http://localhost:4318/health"
echo ""
