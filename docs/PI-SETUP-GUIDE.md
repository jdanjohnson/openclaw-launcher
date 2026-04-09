# Raspberry Pi 5 Setup Guide

Complete step-by-step instructions for setting up your CanaKit Raspberry Pi 5 with the OpenClaw Launcher.

## What You'll Need

- CanaKit Raspberry Pi 5 Starter Kit PRO (128GB MicroSD, Turbine Black case)
- A monitor with HDMI (or USB-C to HDMI adapter)
- A USB keyboard and mouse
- Wi-Fi network (or Ethernet cable)
- About 15-20 minutes

## Step 1: Unbox and Assemble

1. **Open the CanaKit box** — you'll find the Pi board, Turbine Black case, power supply, MicroSD card (pre-loaded with Raspberry Pi OS), and HDMI cable.
2. **Insert the MicroSD card** into the slot on the bottom of the Pi board (gold contacts facing the board).
3. **Place the Pi in the case** — the Turbine Black case snaps together. Align the ports and press gently.
4. **Connect peripherals:**
   - HDMI cable → monitor
   - USB keyboard and mouse
   - Ethernet cable (optional, Wi-Fi works too)

## Step 2: First Boot

1. **Plug in the USB-C power supply** — the Pi will boot automatically.
2. **Wait for Raspberry Pi OS** to load (about 30 seconds on first boot).
3. **Follow the setup wizard:**
   - Choose your language and timezone
   - Connect to your Wi-Fi network
   - Set a password for the `pi` user (remember this!)
   - Skip the software update for now (we'll install what we need)
4. **Click "Done"** — you'll see the Raspberry Pi desktop.

## Step 3: Open a Terminal

1. Click the **terminal icon** in the taskbar at the top (black rectangle icon), or press `Ctrl+Alt+T`.
2. You should see a command prompt like: `pi@raspberrypi:~ $`

## Step 4: Run the Setup Script

Copy and paste this single command into the terminal:

```bash
curl -fsSL https://raw.githubusercontent.com/jdanjohnson/openclaw-launcher/main/pi-setup.sh | bash
```

This will:
- Install Node.js 20
- Install the OpenClaw CLI
- Clone the launcher repository
- Build the workspace UI
- Start the launcher as a background service

**This takes about 5-10 minutes.** You'll see progress messages as it installs.

## Step 5: Open the Launcher

Once the script finishes, open Chromium (the browser) and go to:

```
http://localhost:3000
```

You should see the OpenClaw Launcher workspace with the onboarding flow!

## Step 6: Complete Onboarding

The launcher walks you through 5 steps:

1. **About You** — Enter your name, name your agent, pick your role
2. **Your World** — Select interests, describe goals, choose communication style
3. **Your Agent's Brain** — Pick an AI provider (Gemini is free to start) and paste your API key
4. **Stay Connected** — Optionally connect Telegram for mobile access
5. **Launch** — Your agent goes live!

## Step 7 (Optional): Kiosk Mode for Workshops

If you want the Pi to boot directly into the launcher (no desktop, no address bar — like a native app):

```bash
cd ~/openclaw-launcher
bash kiosk-mode.sh
sudo reboot
```

After reboot:
- Pi auto-logs in
- Fullscreen Chromium opens
- Launcher fills the screen
- Reachable at `http://myagent.local:3000` from other devices

## Accessing from Other Devices

Once the launcher is running, anyone on the same Wi-Fi can access it:

| From | URL |
|------|-----|
| The Pi itself | `http://localhost:3000` |
| Another device (by IP) | `http://192.168.x.x:3000` (run `hostname -I` to find the IP) |
| Another device (mDNS) | `http://myagent.local:3000` (after kiosk setup) |

## Troubleshooting

### The launcher isn't starting
```bash
# Check the service status
sudo systemctl status openclaw-launcher

# View logs
journalctl -u openclaw-launcher -f

# Restart the service
sudo systemctl restart openclaw-launcher
```

### Node.js not found
```bash
# Reinstall Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### OpenClaw CLI not found
```bash
sudo npm install -g openclaw
```

### Can't reach myagent.local from other devices
```bash
# Make sure avahi-daemon is running (handles mDNS)
sudo systemctl enable --now avahi-daemon

# Verify hostname
hostname
# Should show: myagent
```

### Want to start over?
Use the "Start Over" button in Settings, or:
```bash
cd ~/openclaw-launcher
rm state.json
sudo systemctl restart openclaw-launcher
```
