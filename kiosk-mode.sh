#!/usr/bin/env bash
# ============================================================================
# OpenClaw Launcher — Kiosk Mode Setup
# Makes the Pi boot directly into fullscreen Chromium showing the launcher UI.
# Run AFTER pi-setup.sh. Optional — only needed for workshop/demo Pis.
# ============================================================================
set -euo pipefail

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║  Kiosk Mode Setup                        ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""

# ------------------------------------------------------------------
# 1. Install Chromium + window manager
# ------------------------------------------------------------------
echo "  [1/5] Installing Chromium and dependencies..."
sudo apt-get update -qq
sudo apt-get install -y -qq chromium-browser xserver-xorg x11-xserver-utils xinit openbox unclutter > /dev/null 2>&1
echo "         Done."

# ------------------------------------------------------------------
# 2. Configure auto-login (tty1)
# ------------------------------------------------------------------
echo "  [2/5] Configuring auto-login..."
sudo mkdir -p /etc/systemd/system/getty@tty1.service.d
sudo tee /etc/systemd/system/getty@tty1.service.d/autologin.conf > /dev/null <<EOF
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin $USER --noclear %I \$TERM
EOF
echo "         Done."

# ------------------------------------------------------------------
# 3. Configure Openbox autostart (launches Chromium fullscreen)
# ------------------------------------------------------------------
echo "  [3/5] Configuring Chromium kiosk..."
mkdir -p "$HOME/.config/openbox"
cat > "$HOME/.config/openbox/autostart" <<'EOF'
# Hide cursor after 0.5s of inactivity
unclutter -idle 0.5 &

# Disable screen blanking
xset s off
xset s noblank
xset -dpms

# Wait for the launcher service to be ready
sleep 5

# Launch Chromium in kiosk mode
chromium-browser \
  --noerrdialogs \
  --disable-infobars \
  --kiosk \
  --incognito \
  --disable-translate \
  --no-first-run \
  --fast \
  --fast-start \
  --disable-features=TranslateUI \
  --disk-cache-dir=/dev/null \
  --overscroll-history-navigation=0 \
  --disable-pinch \
  http://localhost:3000
EOF
echo "         Done."

# ------------------------------------------------------------------
# 4. Auto-start X on login (via .bash_profile)
# ------------------------------------------------------------------
echo "  [4/5] Configuring X auto-start..."
STARTX_LINE='[[ -z $DISPLAY && $XDG_VTNR -eq 1 ]] && startx -- -nocursor 2>/dev/null'
PROFILE="$HOME/.bash_profile"
if ! grep -qF "startx" "$PROFILE" 2>/dev/null; then
  echo "$STARTX_LINE" >> "$PROFILE"
fi
echo "         Done."

# ------------------------------------------------------------------
# 5. Set hostname to myagent (for mDNS)
# ------------------------------------------------------------------
echo "  [5/5] Setting hostname..."
sudo hostnamectl set-hostname myagent
sudo systemctl restart avahi-daemon 2>/dev/null || true
echo "         Done."

# ------------------------------------------------------------------
# Done!
# ------------------------------------------------------------------
echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║  Kiosk Mode Configured!                  ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""
echo "  On next reboot, the Pi will:"
echo "    1. Auto-login as '$USER'"
echo "    2. Launch fullscreen Chromium"
echo "    3. Open http://localhost:3000 (the launcher)"
echo "    4. Be reachable at http://myagent.local:3000"
echo ""
echo "  Reboot now?  sudo reboot"
echo ""
