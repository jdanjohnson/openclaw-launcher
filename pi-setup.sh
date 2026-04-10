#!/usr/bin/env bash
# ============================================================================
# OpenClaw Launcher — Raspberry Pi 5 Setup Script
# One-command bootstrap: curl -fsSL <raw-url>/pi-setup.sh | bash
# ============================================================================
set -euo pipefail

REPO_URL="https://github.com/jdanjohnson/openclaw-launcher.git"
INSTALL_DIR="$HOME/openclaw-launcher"

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
echo "  [1/8] Installing system dependencies..."
sudo apt-get update -qq
sudo apt-get install -y -qq git curl avahi-daemon > /dev/null 2>&1
echo "         Done."

# ------------------------------------------------------------------
# 3. OpenClaw CLI (official installer — handles Node.js automatically)
# ------------------------------------------------------------------
# The official installer detects the OS, installs/upgrades Node.js if
# needed, and installs the openclaw CLI under ~/.npm-global/bin/.
OPENCLAW_BIN=""

# Check if openclaw is already available
if command -v openclaw &> /dev/null; then
  echo "  [2/8] OpenClaw CLI already installed: $(openclaw --version 2>/dev/null || echo 'unknown')"
  OPENCLAW_BIN="$(command -v openclaw)"
elif [ -x "$HOME/.npm-global/bin/openclaw" ]; then
  echo "  [2/8] OpenClaw CLI found at ~/.npm-global/bin/openclaw"
  OPENCLAW_BIN="$HOME/.npm-global/bin/openclaw"
else
  echo "  [2/8] Installing OpenClaw CLI (this may take a few minutes)..."
  echo "         Using the official installer from https://openclaw.ai/install.sh"
  echo ""
  curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard 2>&1 | while IFS= read -r line; do
    echo "         $line"
  done || {
    echo ""
    echo "         Warning: OpenClaw installer failed."
    echo "         The launcher will run in demo mode."
    echo "         You can install manually later:"
    echo "           curl -fsSL https://openclaw.ai/install.sh | bash"
  }

  # Check where it was installed
  if command -v openclaw &> /dev/null; then
    OPENCLAW_BIN="$(command -v openclaw)"
  elif [ -x "$HOME/.npm-global/bin/openclaw" ]; then
    OPENCLAW_BIN="$HOME/.npm-global/bin/openclaw"
  fi
fi

if [ -n "$OPENCLAW_BIN" ]; then
  echo "         OpenClaw binary: $OPENCLAW_BIN"
else
  echo "         OpenClaw not found — launcher will run in demo mode."
fi

# Ensure Node.js is available (the OpenClaw installer installs it,
# but if it was skipped we need it for the launcher)
if ! command -v node &> /dev/null; then
  echo "  [3/8] Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - > /dev/null 2>&1
  sudo apt-get install -y -qq nodejs > /dev/null 2>&1
  echo "         Installed: $(node -v)"
else
  echo "  [3/8] Node.js already installed: $(node -v)"
fi

# ------------------------------------------------------------------
# 4. Install Ollama (local LLM runtime)
# ------------------------------------------------------------------
if command -v ollama &> /dev/null; then
  echo "  [4/8] Ollama already installed."
else
  echo "  [4/8] Installing Ollama (local AI runtime)..."
  curl -fsSL https://ollama.com/install.sh | sh 2>/dev/null || {
    echo "         Warning: Could not install Ollama."
    echo "         Chat will run in demo mode."
  }
fi

# ------------------------------------------------------------------
# 5. Pre-pull default model (Phi-3 Mini)
# ------------------------------------------------------------------
if command -v ollama &> /dev/null; then
  echo "  [5/8] Pulling Phi-3 Mini model (this may take a few minutes)..."
  ollama pull phi3:mini 2>/dev/null || {
    echo "         Warning: Could not pull phi3:mini."
    echo "         You can pull it later with: ollama pull phi3:mini"
  }
else
  echo "  [5/8] Skipping model pull (Ollama not available)."
fi

# ------------------------------------------------------------------
# 6. Clone / update the launcher repo
# ------------------------------------------------------------------
if [ -d "$INSTALL_DIR/.git" ]; then
  echo "  [6/8] Updating launcher..."
  cd "$INSTALL_DIR"
  git pull --ff-only 2>/dev/null || true
else
  echo "  [6/8] Cloning launcher..."
  git clone "$REPO_URL" "$INSTALL_DIR" 2>/dev/null
  cd "$INSTALL_DIR"
fi

# ------------------------------------------------------------------
# 7. Install dependencies & build UI
# ------------------------------------------------------------------
echo "  [7/8] Installing dependencies & building UI..."
npm install --omit=dev 2>/dev/null
cd ui
npm install 2>/dev/null
npm run build 2>/dev/null
cd ..
echo "         Done."

# ------------------------------------------------------------------
# 8. Create systemd service
# ------------------------------------------------------------------
echo "  [8/8] Creating systemd service..."

# Build the PATH for the service — include common openclaw install locations
SERVICE_PATH="/usr/local/bin:/usr/bin:/bin"
if [ -d "$HOME/.npm-global/bin" ]; then
  SERVICE_PATH="$HOME/.npm-global/bin:$SERVICE_PATH"
fi
# Also include other users' npm-global dirs in case openclaw was installed
# by a different user (e.g. a setup/deploy user)
for dir in /home/*/.npm-global/bin; do
  if [ -d "$dir" ]; then
    SERVICE_PATH="$dir:$SERVICE_PATH"
  fi
done

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
Environment=OLLAMA_BASE=http://localhost:11434
Environment=PATH=$SERVICE_PATH

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable openclaw-launcher
sudo systemctl restart openclaw-launcher
echo "         Service started."

# ------------------------------------------------------------------
# 9. Set up mDNS hostname
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
if [ -n "$OPENCLAW_BIN" ]; then
  echo "  OpenClaw CLI: $OPENCLAW_BIN"
  echo "  Mode: LIVE (real agent commands)"
else
  echo "  OpenClaw CLI: not installed"
  echo "  Mode: DEMO (simulated responses)"
  echo ""
  echo "  To install OpenClaw and switch to live mode:"
  echo "    curl -fsSL https://openclaw.ai/install.sh | bash"
  echo "    sudo systemctl restart openclaw-launcher"
fi
echo ""
echo "  Useful commands:"
echo "    sudo systemctl status openclaw-launcher"
echo "    sudo systemctl restart openclaw-launcher"
echo "    journalctl -u openclaw-launcher -f"
echo ""
