# OpenClaw Launcher

A delightful onboarding experience for launching your personal AI agent on a Raspberry Pi 5 — powered by [OpenClaw](https://github.com/openclaw).

Students power on a Pi, open a browser, and land in a beautiful workspace that walks them through setting up their own private AI agent. No terminal required.

## What It Does

- **5-step personal onboarding**: About You → Your World → AI Brain → Stay Connected → Launch
- **Kiosk mode**: Pi boots directly into fullscreen Chromium — feels like a native app, not a website
- **Real OpenClaw integration**: Frontend calls Express backend, which calls real `openclaw` CLI commands
- **Gamified progress**: XP, levels, achievements — makes setup feel like a journey
- **Workshop-ready**: "Start Over" button lets you reset for the next student

## Architecture

```
┌─────────────────────────────────────────┐
│           Raspberry Pi 5                │
│                                         │
│  ┌──────────┐    ┌──────────────────┐   │
│  │  React   │───▶│  Express Server  │   │
│  │  UI      │    │  (port 3000)     │   │
│  │  (Vite)  │    │                  │   │
│  └──────────┘    │  ┌────────────┐  │   │
│                  │  │ OpenClaw   │  │   │
│                  │  │ CLI        │  │   │
│                  │  └────────────┘  │   │
│                  └──────────────────┘   │
└─────────────────────────────────────────┘
```

- **`server.js`** — Express server serving the UI + REST API wrapping OpenClaw CLI
- **`ui/`** — React + Tailwind workspace UI (built to `ui/dist/`)
- **`pi-setup.sh`** — One-command Pi bootstrap
- **`kiosk-mode.sh`** — Optional fullscreen kiosk configuration

## Quick Start (Raspberry Pi)

### One-Command Setup

On a fresh Raspberry Pi 5 with Raspberry Pi OS:

```bash
curl -fsSL https://raw.githubusercontent.com/jdanjohnson/openclaw-launcher/main/pi-setup.sh | bash
```

This installs Node.js, OpenClaw CLI, clones the repo, builds the UI, and starts the launcher as a systemd service on port 3000.

### Optional: Kiosk Mode (for workshops)

```bash
cd ~/openclaw-launcher
bash kiosk-mode.sh
sudo reboot
```

After reboot, the Pi auto-boots into fullscreen Chromium showing the launcher. No desktop, no address bar — feels like a native app.

### Access

- From the Pi itself: `http://localhost:3000`
- From another device on the same network: `http://<pi-ip>:3000`
- With mDNS (after kiosk setup): `http://myagent.local:3000`

## Development (Local)

```bash
# Install server dependencies
npm install

# Install UI dependencies and build
cd ui && npm install && npm run build && cd ..

# Start the server
node server.js
# → http://localhost:3000
```

For UI development with hot reload:

```bash
# Terminal 1: Start the Express backend
node server.js

# Terminal 2: Start Vite dev server (proxies /api to Express)
cd ui && npm run dev
# → http://localhost:5173
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/status` | Get current state + system info |
| `POST` | `/api/setup/profile` | Save name, agent name, role |
| `POST` | `/api/setup/context` | Save interests, goals, comm style, template |
| `POST` | `/api/setup/api-key` | Configure AI provider API key |
| `POST` | `/api/setup/telegram` | Connect Telegram bot (or skip) |
| `POST` | `/api/activate` | Launch the agent (calls `openclaw restart`) |
| `POST` | `/api/gateway/toggle` | Start/stop the agent |
| `POST` | `/api/setup/template` | Change skill set |
| `GET` | `/api/achievements` | Get all achievements + progress |
| `POST` | `/api/reset` | Reset everything (for workshop reuse) |

## Giving Devin Deployment Access

See [docs/DEVIN-ACCESS.md](docs/DEVIN-ACCESS.md) for instructions on giving Devin full SSH access to your Pi for automated deployment and testing.

## Hardware

Tested on:
- **CanaKit Raspberry Pi 5 Starter Kit PRO** (128GB MicroSD, Turbine Black case)
- Pre-loaded with 64-bit Raspberry Pi OS

Works on any Debian/Ubuntu system with Node.js 18+.

## License

MIT
