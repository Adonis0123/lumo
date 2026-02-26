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

echo -e "${YELLOW}=== Lumo Daemon Uninstallation (Linux) ===${NC}"
echo ""

# Check if running on Linux
if [[ "$(uname)" != "Linux" ]]; then
    echo -e "${RED}Error: This script only works on Linux${NC}"
    exit 1
fi

# Step 1: Stop and disable service
echo -e "${YELLOW}[1/3]${NC} Stopping daemon..."
if systemctl --user is-active --quiet lumo-daemon 2>/dev/null; then
    systemctl --user disable --now lumo-daemon
    echo -e "${GREEN}✓${NC} Daemon stopped and disabled"
else
    systemctl --user disable lumo-daemon 2>/dev/null || true
    echo -e "${YELLOW}ℹ${NC} Daemon was not running"
fi

# Remove service file
if [ -f "$SERVICE_DIR/lumo-daemon.service" ]; then
    rm "$SERVICE_DIR/lumo-daemon.service"
    systemctl --user daemon-reload
    echo -e "${GREEN}✓${NC} Service file removed"
else
    echo -e "${YELLOW}ℹ${NC} Service file not found (skipping)"
fi
echo ""

# Step 2: Remove binary
if [ -f "$INSTALL_DIR/$DAEMON_NAME" ]; then
    echo -e "${YELLOW}[2/3]${NC} Removing binary..."
    rm "$INSTALL_DIR/$DAEMON_NAME"
    echo -e "${GREEN}✓${NC} Binary removed"
else
    echo -e "${YELLOW}[2/3]${NC} Binary not found (skipping)"
fi
echo ""

# Step 3: Ask about logs
echo -e "${YELLOW}[3/3]${NC} Logs and data:"
if [ -d "$LOG_DIR" ]; then
    echo "Log directory exists: $LOG_DIR"
    read -p "Remove logs? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$LOG_DIR"
        echo -e "${GREEN}✓${NC} Logs removed"
    else
        echo -e "${YELLOW}ℹ${NC} Logs preserved at: $LOG_DIR"
    fi
else
    echo -e "${YELLOW}ℹ${NC} No logs found"
fi
echo ""

echo -e "${GREEN}=== Uninstallation Complete ===${NC}"
echo ""
echo "The daemon has been removed. To reinstall:"
echo "  ./scripts/install-daemon-linux.sh"
echo ""
