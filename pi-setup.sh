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

# Also try to start OpenClaw gateway on boot if installed
if [ -n "$OPENCLAW_BIN" ]; then
  GATEWAY_SERVICE="/etc/systemd/system/openclaw-gateway.service"
  sudo tee "$GATEWAY_SERVICE" > /dev/null <<GWEOF
[Unit]
Description=OpenClaw Gateway
After=network-online.target openclaw-launcher.service
Wants=network-online.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$HOME
ExecStart=$OPENCLAW_BIN start
Restart=on-failure
RestartSec=10
Environment=HOME=$HOME
Environment=PATH=$SERVICE_PATH

[Install]
WantedBy=multi-user.target
GWEOF
  sudo systemctl daemon-reload
  sudo systemctl enable openclaw-gateway 2>/dev/null || true
  sudo systemctl start openclaw-gateway 2>/dev/null || true
  echo "         OpenClaw Gateway service created."
fi

# ------------------------------------------------------------------
# 9. Chromium kiosk autostart (boot → localhost:3000)
#    Supports both X11 and Wayland (labwc on Raspberry Pi OS Bookworm+)
# ------------------------------------------------------------------
echo "  Setting up Chromium kiosk autostart..."

# Create the kiosk launcher script
KIOSK_SCRIPT="$HOME/.local/bin/openclaw-kiosk.sh"
mkdir -p "$HOME/.local/bin"
cat > "$KIOSK_SCRIPT" << 'KIOSKEOF'
#!/usr/bin/env bash
# Wait for the launcher service to be ready
for i in $(seq 1 30); do
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

# Disable screen blanking on X11 (no-op on Wayland)
if [ "$XDG_SESSION_TYPE" != "wayland" ] && [ -z "$WAYLAND_DISPLAY" ]; then
  xset s off 2>/dev/null || true
  xset -dpms 2>/dev/null || true
  xset s noblank 2>/dev/null || true
fi

# Kill any existing Chromium instances
killall chromium-browser 2>/dev/null || true
killall chromium 2>/dev/null || true
sleep 1

# Clear Chromium crash flags to suppress restore prompts
CHROMIUM_DIR="$HOME/.config/chromium/Default"
if [ -f "$CHROMIUM_DIR/Preferences" ]; then
  sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' "$CHROMIUM_DIR/Preferences" 2>/dev/null || true
  sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' "$CHROMIUM_DIR/Preferences" 2>/dev/null || true
fi

# Launch Chromium in kiosk mode
if command -v chromium-browser &> /dev/null; then
  CHROME_CMD=chromium-browser
elif command -v chromium &> /dev/null; then
  CHROME_CMD=chromium
else
  echo "Chromium not found" && exit 1
fi

# Detect display server and add Wayland flag if needed
CHROME_EXTRA=""
if [ "$XDG_SESSION_TYPE" = "wayland" ] || [ -n "$WAYLAND_DISPLAY" ]; then
  CHROME_EXTRA="--ozone-platform=wayland"
fi

exec $CHROME_CMD \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  --no-first-run \
  --start-fullscreen \
  --autoplay-policy=no-user-gesture-required \
  $CHROME_EXTRA \
  http://localhost:3000
KIOSKEOF
chmod +x "$KIOSK_SCRIPT"

# --- Register autostart for the active desktop environment ---

# 1) XDG autostart (.desktop entry — works with lxsession-xdg-autostart)
AUTOSTART_DIR="$HOME/.config/autostart"
mkdir -p "$AUTOSTART_DIR"
cat > "$AUTOSTART_DIR/openclaw-kiosk.desktop" << DESKEOF
[Desktop Entry]
Type=Application
Name=OpenClaw Kiosk
Comment=Open Stationed Agents in fullscreen on boot
Exec=$KIOSK_SCRIPT
X-GNOME-Autostart-enabled=true
X-MATE-Autostart-enabled=true
DESKEOF

# 2) labwc autostart (Raspberry Pi OS Bookworm+ default compositor)
LABWC_DIR="$HOME/.config/labwc"
if [ -d "$LABWC_DIR" ] || pgrep -x labwc > /dev/null 2>&1; then
  mkdir -p "$LABWC_DIR"
  # Remove any previous kiosk entry, then append
  if [ -f "$LABWC_DIR/autostart" ]; then
    grep -v "openclaw-kiosk" "$LABWC_DIR/autostart" > "$LABWC_DIR/autostart.tmp" || true
    mv "$LABWC_DIR/autostart.tmp" "$LABWC_DIR/autostart"
  fi
  echo "$KIOSK_SCRIPT &" >> "$LABWC_DIR/autostart"
  echo "         labwc autostart entry added."
fi

echo "         Kiosk autostart configured."
echo "         On next boot, Chromium will open http://localhost:3000 in fullscreen."

# ------------------------------------------------------------------
# 10. Set up mDNS hostname
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
