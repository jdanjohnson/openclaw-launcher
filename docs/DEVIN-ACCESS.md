# Giving Devin Deployment Access to Your Pi

This guide explains how to give Devin (AI assistant) full access to your Raspberry Pi so it can deploy, update, and test the OpenClaw Launcher remotely.

## Option A: SSH Access (Recommended)

The simplest approach. Devin connects over SSH on your local network or via port forwarding.

### Steps

1. **Enable SSH on your Pi** (if not already):
   ```bash
   sudo systemctl enable --now ssh
   ```

2. **Create a password for Devin** (or use an existing user):
   ```bash
   # Option 1: Use the default 'pi' user
   sudo passwd pi

   # Option 2: Create a dedicated user
   sudo adduser devin
   sudo usermod -aG sudo devin
   ```

3. **Get your Pi's IP address:**
   ```bash
   hostname -I
   # Example output: 192.168.1.42
   ```

4. **Share with Devin:**
   - IP address (e.g., `192.168.1.42`)
   - Username (e.g., `pi` or `devin`)
   - Password

   Devin will save these as secrets and use them for SSH access.

### For Remote Access (outside your network)

If Devin needs to reach your Pi from outside your local network, use Option B (Tailscale) instead, or set up port forwarding on your router:

```bash
# On your router, forward external port 2222 to your Pi's port 22
# Then share your public IP: ssh -p 2222 pi@<your-public-ip>
```

## Option B: Tailscale Tunnel (Best for Remote)

Tailscale creates a secure tunnel so Devin can reach your Pi from anywhere, no port forwarding needed.

### Steps

1. **Install Tailscale on your Pi:**
   ```bash
   curl -fsSL https://tailscale.com/install.sh | sh
   sudo tailscale up
   ```

2. **Follow the URL** that appears to authenticate in your browser.

3. **Get the Tailscale IP:**
   ```bash
   tailscale ip -4
   # Example output: 100.64.0.42
   ```

4. **Enable SSH:**
   ```bash
   sudo systemctl enable --now ssh
   ```

5. **Share with Devin:**
   - Tailscale IP (e.g., `100.64.0.42`)
   - Username and password (same as Option A)

### Advantages
- Works from anywhere (no port forwarding)
- Encrypted tunnel
- Stable IP that doesn't change
- Free for personal use (up to 100 devices)

## Option C: User Runs Script (No Access Needed)

If you prefer not to give Devin direct access, Devin will provide you with commands to run yourself.

### How It Works

1. Devin generates the exact commands needed
2. You copy-paste them into your Pi's terminal
3. You report the output back to Devin
4. Devin troubleshoots if needed

### Example Workflow

```bash
# Devin says: "Run this on your Pi:"
curl -fsSL https://raw.githubusercontent.com/jdanjohnson/openclaw-launcher/main/pi-setup.sh | bash

# You run it and share the output
# Devin verifies everything worked
```

### When to Use This
- One-time setup (no ongoing access needed)
- You prefer full control over what runs on your Pi
- Your network doesn't allow SSH or Tailscale

## What Devin Does With Access

When Devin has SSH access, it can:

1. **Deploy updates** — Pull latest code, rebuild UI, restart service
2. **Test the launcher** — Verify the server is running, API endpoints work
3. **Configure OpenClaw** — Set up templates, API keys, channels
4. **Debug issues** — Check logs, system status, network connectivity
5. **Set up kiosk mode** — Configure auto-boot for workshop Pis

Devin will **never**:
- Store your credentials in code or logs
- Make changes without explaining what it's doing
- Access anything outside the openclaw-launcher scope

## Quick Reference

| Method | What You Share | Best For |
|--------|---------------|----------|
| **SSH** | IP + user + password | Local network |
| **Tailscale** | Tailscale IP + user + password | Remote access |
| **User Runs** | Nothing | One-time setup |
