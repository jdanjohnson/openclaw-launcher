#!/usr/bin/env bash
# ============================================================================
# OpenClaw Launcher — Raspberry Pi 5 Setup Script
# One-command bootstrap: curl -fsSL <raw-url>/pi-setup.sh | bash
# ============================================================================
set -euo pipefail

REPO_URL="https://github.com/jdanjohnson/openclaw-launcher.git"
INSTALL_DIR="$HOME/openclaw-launcher"
NODE_MAJOR=20

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║     OpenClaw Launcher — Pi Setup         ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""

# ------------------------------------------------------------------
# 1. Detect Raspberry Pi
# ------------------------------------------------------------------
if [ -f /proc/device-tree/model ]; then
  PI_MODEL=$(tr -d '\0' < /proc/device-tree/model)
  echo "  Detected: $PI_MODEL"
else
  echo "  Warning: Not running on a Raspberry Pi (or /proc/device-tree/model missing)"
  echo "  Continuing anyway (works on any Debian/Ubuntu system)..."
  PI_MODEL="Unknown"
fi
echo ""

# ------------------------------------------------------------------
# 2. System packages
# ------------------------------------------------------------------
echo "  [1/6] Installing system dependencies..."
sudo apt-get update -qq
sudo apt-get install -y -qq git curl avahi-daemon > /dev/null 2>&1
echo "         Done."

# ------------------------------------------------------------------
# 3. Node.js (via NodeSource)
# ------------------------------------------------------------------
if command -v node &> /dev/null; then
  NODE_VER=$(node -v)
  echo "  [2/6] Node.js already installed: $NODE_VER"
else
  echo "  [2/6] Installing Node.js $NODE_MAJOR..."
  curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | sudo -E bash - > /dev/null 2>&1
  sudo apt-get install -y -qq nodejs > /dev/null 2>&1
  echo "         Installed: $(node -v)"
fi

# ------------------------------------------------------------------
# 4. OpenClaw CLI
# ------------------------------------------------------------------
if command -v openclaw &> /dev/null; then
  echo "  [3/6] OpenClaw CLI already installed."
else
  echo "  [3/6] Installing OpenClaw CLI..."
  if npm list -g openclaw &> /dev/null; then
    echo "         Already in global npm."
  else
    sudo npm install -g openclaw 2>/dev/null || {
      echo "         Warning: Could not install openclaw globally."
      echo "         The launcher will run in demo mode."
    }
  fi
fi

# ------------------------------------------------------------------
# 5. Clone / update the launcher repo
# ------------------------------------------------------------------
if [ -d "$INSTALL_DIR/.git" ]; then
  echo "  [4/6] Updating launcher..."
  cd "$INSTALL_DIR"
  git pull --ff-only 2>/dev/null || true
else
  echo "  [4/6] Cloning launcher..."
  git clone "$REPO_URL" "$INSTALL_DIR" 2>/dev/null
  cd "$INSTALL_DIR"
fi

# ------------------------------------------------------------------
# 6. Install dependencies & build UI
# ------------------------------------------------------------------
echo "  [5/6] Installing dependencies & building UI..."
npm install --omit=dev 2>/dev/null
cd ui
npm install 2>/dev/null
npm run build 2>/dev/null
cd ..
echo "         Done."

# ------------------------------------------------------------------
# 7. Create systemd service
# ------------------------------------------------------------------
echo "  [6/6] Creating systemd service..."

SERVICE_FILE="/etc/systemd/system/openclaw-launcher.service"
sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=OpenClaw Launcher
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
ExecStart=$(which node) server.js
Restart=on-failure
RestartSec=5
Environment=PORT=3000
Environment=HOME=$HOME

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable openclaw-launcher
sudo systemctl start openclaw-launcher
echo "         Service started."

# ------------------------------------------------------------------
# 8. Set up mDNS hostname
# ------------------------------------------------------------------
CURRENT_HOSTNAME=$(hostname)
if [ "$CURRENT_HOSTNAME" != "myagent" ]; then
  echo ""
  echo "  Optional: Set hostname to 'myagent' so you can reach"
  echo "  this device at http://myagent.local:3000"
  echo ""
  if [ -t 0 ]; then
    read -r -p "  Change hostname to 'myagent'? [y/N] " REPLY
    if [[ "$REPLY" =~ ^[Yy]$ ]]; then
      sudo hostnamectl set-hostname myagent
      echo "         Hostname set to 'myagent'."
    fi
  else
    echo "  (Non-interactive — skipping hostname change. Run manually:"
    echo "   sudo hostnamectl set-hostname myagent)"
  fi
fi

# ------------------------------------------------------------------
# Done!
# ------------------------------------------------------------------
IP_ADDR=$(hostname -I | awk '{print $1}')
echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║  Setup Complete!                         ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""
echo "  Your agent launcher is running at:"
echo ""
echo "    http://$IP_ADDR:3000"
echo "    http://$(hostname).local:3000"
echo ""
echo "  Open that URL in a browser to start onboarding."
echo ""
echo "  Useful commands:"
echo "    sudo systemctl status openclaw-launcher"
echo "    sudo systemctl restart openclaw-launcher"
echo "    journalctl -u openclaw-launcher -f"
echo ""
