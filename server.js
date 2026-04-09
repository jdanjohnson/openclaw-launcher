const express = require("express");
const { execFileSync, execFile } = require("child_process");
const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve the built React workspace UI
const distPath = path.join(__dirname, "ui", "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// State file for tracking progress
const STATE_FILE = path.join(__dirname, "state.json");

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return {
      currentStep: 0,
      agentName: "",
      userName: "",
      userRole: "",
      interests: [],
      goals: "",
      commStyle: "",
      templateId: "",
      apiProvider: "",
      apiKeySet: false,
      telegramConnected: false,
      gatewayRunning: false,
      achievements: [],
      completedSteps: [],
      xp: 0,
      level: 0,
      startedAt: new Date().toISOString(),
    };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function unlockAchievement(state, id, xpGain) {
  if (!state.achievements.includes(id)) {
    state.achievements.push(id);
    state.xp = (state.xp || 0) + xpGain;
    state.level =
      state.xp >= 175 ? 3 : state.xp >= 80 ? 2 : state.xp > 0 ? 1 : 0;
  }
  return state;
}

// Safe command execution using execFileSync (no shell interpretation)
function runSafeCommand(file, args, timeoutMs = 30000) {
  try {
    return {
      success: true,
      output: execFileSync(file, args, {
        timeout: timeoutMs,
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim(),
    };
  } catch (err) {
    return {
      success: false,
      output: err.stderr || err.message || "Command failed",
    };
  }
}

// Safe HTTPS GET (replaces shelling out to curl)
function httpsGet(url, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: timeoutMs }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
  });
}

// Resolve the full path to the openclaw binary.
// The official installer places it under ~/.npm-global/bin, which may not
// be on PATH when running as a systemd service.
function resolveOpenClawBin() {
  // 1. Check if it's already on PATH
  const whichResult = runSafeCommand("which", ["openclaw"]);
  if (whichResult.success) return whichResult.output.trim();

  // 2. Search common install locations
  const homeDir = process.env.HOME || "/home";
  const candidates = [
    path.join(homeDir, ".npm-global", "bin", "openclaw"),
    "/usr/local/bin/openclaw",
    "/usr/bin/openclaw",
  ];

  // Also check other users' npm-global dirs (e.g. installed as different user)
  try {
    const homes = fs.readdirSync("/home");
    for (const h of homes) {
      candidates.push(path.join("/home", h, ".npm-global", "bin", "openclaw"));
    }
  } catch { /* /home not readable, skip */ }

  for (const candidate of candidates) {
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return candidate;
    } catch { /* not found or not executable */ }
  }

  return null;
}

// Cache the resolved binary path (re-resolved on each server start)
let openclawBin = resolveOpenClawBin();

// Check if OpenClaw CLI is available
function isOpenClawInstalled() {
  if (openclawBin) return true;
  // Re-check in case it was installed after server start
  openclawBin = resolveOpenClawBin();
  return !!openclawBin;
}

// Async command execution for long-running commands (e.g. openclaw agent)
function runSafeCommandAsync(file, args, timeoutMs = 120000) {
  return new Promise((resolve) => {
    try {
      const proc = execFile(
        file,
        args,
        { timeout: timeoutMs, encoding: "utf8", maxBuffer: 1024 * 1024 },
        (err, stdout, stderr) => {
          if (err) {
            resolve({ success: false, output: stderr || err.message || "Command failed" });
          } else {
            resolve({ success: true, output: (stdout || "").trim() });
          }
        }
      );
      proc.on("error", (err) => {
        resolve({ success: false, output: err.message || "Command failed" });
      });
    } catch (err) {
      resolve({ success: false, output: err.message || "Command failed" });
    }
  });
}

// HTTP GET for local gateway API — returns { statusCode, body }
function httpGet(url, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ statusCode: res.statusCode, body: data }));
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
  });
}

// -------------------------------------------------------------------
// API Routes
// -------------------------------------------------------------------

// Get current onboarding state + system info
app.get("/api/status", (_req, res) => {
  const state = loadState();
  const clawInstalled = isOpenClawInstalled();

  let gatewayRunning = false;
  if (clawInstalled) {
    const statusResult = runSafeCommand(openclawBin || "openclaw", ["status"]);
    gatewayRunning =
      statusResult.success &&
      statusResult.output.toLowerCase().includes("running");
  }

  const hostnameResult = runSafeCommand("hostname", []);
  const hostname = hostnameResult.success ? hostnameResult.output : "openclaw-pi";

  const ipResult = runSafeCommand("hostname", ["-I"]);
  const ip = ipResult.success ? ipResult.output.split(" ")[0] : "unknown";

  state.gatewayRunning = gatewayRunning;
  saveState(state);

  res.json({
    state,
    system: {
      hostname,
      ip,
      openclawInstalled: clawInstalled,
      gatewayRunning,
    },
  });
});

// Step 0 -> 1: Save personal context (About You)
app.post("/api/setup/profile", (req, res) => {
  const { userName, agentName, role } = req.body;
  if (!agentName || agentName.trim().length === 0) {
    return res.status(400).json({ error: "Agent name is required" });
  }

  const state = loadState();
  state.userName = (userName || "").trim();
  state.agentName = agentName.trim();
  state.userRole = (role || "").trim();
  state.currentStep = Math.max(state.currentStep, 1);
  if (!state.completedSteps.includes("about-you")) {
    state.completedSteps.push("about-you");
  }
  unlockAchievement(state, "named", 10);
  saveState(state);

  res.json({ success: true, state });
});

// Step 1 -> 2: Save world context (interests, goals, comm style, template)
app.post("/api/setup/context", (req, res) => {
  const { interests, goals, commStyle, templateId } = req.body;

  const validTemplates = ["chief-of-staff", "marketing-operator", "blank"];

  const state = loadState();
  state.interests = interests || [];
  state.goals = (goals || "").trim();
  state.commStyle = (commStyle || "").trim();

  if (templateId && validTemplates.includes(templateId)) {
    state.templateId = templateId;

    // Copy template files to OpenClaw workspace
    const templateMap = {
      "chief-of-staff": "preloaded",
      "marketing-operator": "chadfarquad",
      blank: "blank",
    };

    const templateDir = templateMap[templateId];
    if (templateDir) {
      const home = process.env.HOME || "/home/pi";
      const workspace = path.join(home, ".openclaw", "workspace");

      try {
        fs.mkdirSync(path.join(workspace, "memory", "research"), {
          recursive: true,
        });
        fs.mkdirSync(path.join(workspace, "memory", "meetings"), {
          recursive: true,
        });
        fs.mkdirSync(path.join(workspace, "memory", "drafts"), {
          recursive: true,
        });
        fs.mkdirSync(path.join(workspace, "memory", "digests"), {
          recursive: true,
        });
      } catch {
        // dirs may already exist
      }

      // Write user context file (soul file)
      const userContextPath = path.join(workspace, "user.md");
      const contextContent = [
        `# User Profile`,
        ``,
        `**Name:** ${state.userName || "Not provided"}`,
        `**Role:** ${state.userRole || "Not provided"}`,
        `**Agent Name:** ${state.agentName}`,
        ``,
        `## Interests`,
        (state.interests || []).map((i) => `- ${i}`).join("\n") || "- Not specified",
        ``,
        `## Goals`,
        state.goals || "Not specified",
        ``,
        `## Communication Style`,
        state.commStyle || "Not specified",
        ``,
      ].join("\n");

      try {
        fs.writeFileSync(userContextPath, contextContent);
      } catch {
        // Non-fatal
      }

      // Create task board if missing
      const taskBoard = path.join(workspace, "memory", "task-board.md");
      if (!fs.existsSync(taskBoard)) {
        try {
          fs.writeFileSync(
            taskBoard,
            "--- TASK BOARD ---\nDOING\n\nNEXT UP\n\nBLOCKED\n\nBACKLOG\n\nDONE (last 7 days)\n"
          );
        } catch {
          // Non-fatal
        }
      }
    }
  }

  state.currentStep = Math.max(state.currentStep, 2);
  if (!state.completedSteps.includes("your-world")) {
    state.completedSteps.push("your-world");
  }
  unlockAchievement(state, "template-chosen", 20);
  saveState(state);

  res.json({ success: true, state });
});

// Step 2 -> 3: Configure AI provider API key
app.post("/api/setup/api-key", (req, res) => {
  const { provider, apiKey } = req.body;
  const validProviders = ["google", "anthropic", "openai"];

  if (!validProviders.includes(provider)) {
    return res.status(400).json({ error: "Invalid provider" });
  }
  if (!apiKey || apiKey.trim().length < 10) {
    return res.status(400).json({ error: "Invalid API key" });
  }

  // Configure via OpenClaw CLI if available
  if (isOpenClawInstalled()) {
    runSafeCommand(openclawBin || "openclaw", [
      "models",
      "auth",
      "paste-token",
      "--provider",
      provider,
      "--token",
      apiKey.trim(),
    ]);
  }

  // Also save as env var fallback
  const envVarMap = {
    google: "GOOGLE_API_KEY",
    anthropic: "ANTHROPIC_API_KEY",
    openai: "OPENAI_API_KEY",
  };

  const home = process.env.HOME || "/home/pi";
  const envFile = path.join(home, ".openclaw", "env");
  try {
    fs.mkdirSync(path.join(home, ".openclaw"), { recursive: true });
    let envContent = "";
    if (fs.existsSync(envFile)) {
      envContent = fs.readFileSync(envFile, "utf8");
    }
    const envVar = envVarMap[provider];
    const line = `${envVar}=${apiKey.trim().replace(/[\r\n]/g, "")}`;
    if (envContent.includes(envVar)) {
      envContent = envContent.replace(
        new RegExp(`${envVar}=.*`),
        () => line
      );
    } else {
      envContent += `\n${line}`;
    }
    fs.writeFileSync(envFile, envContent.trim() + "\n");
  } catch {
    // Non-fatal
  }

  const state = loadState();
  state.apiProvider = provider;
  state.apiKeySet = true;
  state.currentStep = Math.max(state.currentStep, 3);
  if (!state.completedSteps.includes("agent-brain")) {
    state.completedSteps.push("agent-brain");
  }
  unlockAchievement(state, "brain-connected", 30);
  saveState(state);

  res.json({ success: true, state });
});

// Step 3 -> 4: Configure Telegram
app.post("/api/setup/telegram", async (req, res) => {
  const { botToken, userId, skip } = req.body;

  const state = loadState();

  if (skip) {
    state.telegramConnected = false;
    state.currentStep = Math.max(state.currentStep, 4);
    if (!state.completedSteps.includes("stay-connected")) {
      state.completedSteps.push("stay-connected");
    }
    saveState(state);
    return res.json({ success: true, state });
  }

  if (!botToken || botToken.trim().length < 20) {
    return res.status(400).json({ error: "Invalid bot token" });
  }

  // Verify with Telegram API (using native https, not shell curl)
  let botInfo = null;
  try {
    const rawResponse = await httpsGet(
      `https://api.telegram.org/bot${botToken.trim()}/getMe`
    );
    const parsed = JSON.parse(rawResponse);
    if (!parsed.ok) {
      return res
        .status(400)
        .json({ error: "Invalid bot token - Telegram rejected it" });
    }
    botInfo = parsed.result;
  } catch {
    return res.status(400).json({ error: "Could not verify bot token" });
  }

  // Add channel via CLI if available
  if (isOpenClawInstalled()) {
    runSafeCommand(openclawBin || "openclaw", [
      "channels",
      "add",
      "--channel",
      "telegram",
      "--token",
      botToken.trim(),
    ]);

    if (userId && userId.trim().length > 0) {
      const safeUserId = userId.trim().replace(/[^0-9]/g, "");
      if (safeUserId.length > 0) {
        runSafeCommand(openclawBin || "openclaw", [
          "config",
          "set",
          "channels.telegram.dmPolicy",
          "allowlist",
        ]);
        runSafeCommand(openclawBin || "openclaw", [
          "config",
          "set",
          "channels.telegram.allowFrom",
          JSON.stringify([safeUserId]),
        ]);
      }
    }
  }

  state.telegramConnected = true;
  state.telegramBot = botInfo;
  state.currentStep = Math.max(state.currentStep, 4);
  if (!state.completedSteps.includes("stay-connected")) {
    state.completedSteps.push("stay-connected");
  }
  unlockAchievement(state, "channel-active", 25);
  saveState(state);

  res.json({ success: true, botInfo, state });
});

// Step 4 -> 5: Launch / activate the agent
app.post("/api/activate", (_req, res) => {
  if (isOpenClawInstalled()) {
    // Try to restart the gateway
    runSafeCommand(openclawBin || "openclaw", ["restart"]);

    // Give it a moment to start, then re-load fresh state
    setTimeout(() => {
      try {
        const state = loadState();
        const statusResult = runSafeCommand(openclawBin || "openclaw", ["status"]);
        const running =
          statusResult.success &&
          statusResult.output.toLowerCase().includes("running");

        state.gatewayRunning = running;
        state.currentStep = Math.max(state.currentStep, 5);
        if (!state.completedSteps.includes("launched")) {
          state.completedSteps.push("launched");
        }
        unlockAchievement(state, "gateway-live", 40);
        unlockAchievement(state, "first-message", 50);
        saveState(state);

        res.json({ success: true, gatewayRunning: running, state });
      } catch (err) {
        res.status(500).json({ error: "Failed to check agent status" });
      }
    }, 5000);
  } else {
    // OpenClaw not installed — mark as complete anyway for dev/demo
    const state = loadState();
    state.gatewayRunning = false;
    state.currentStep = Math.max(state.currentStep, 5);
    if (!state.completedSteps.includes("launched")) {
      state.completedSteps.push("launched");
    }
    unlockAchievement(state, "gateway-live", 40);
    unlockAchievement(state, "first-message", 50);
    saveState(state);

    res.json({
      success: true,
      gatewayRunning: false,
      demoMode: true,
      message: "OpenClaw CLI not installed. Running in demo mode.",
      state,
    });
  }
});

// Toggle gateway on/off
app.post("/api/gateway/toggle", (req, res) => {
  const { action } = req.body;

  if (isOpenClawInstalled()) {
    if (action === "start") {
      runSafeCommand(openclawBin || "openclaw", ["restart"]);
    } else {
      runSafeCommand(openclawBin || "openclaw", ["stop"]);
    }

    // Re-load fresh state after the delay to avoid overwriting concurrent changes
    setTimeout(() => {
      try {
        const state = loadState();
        const statusResult = runSafeCommand(openclawBin || "openclaw", ["status"]);
        const running =
          statusResult.success &&
          statusResult.output.toLowerCase().includes("running");
        state.gatewayRunning = running;
        saveState(state);
        res.json({ success: true, gatewayRunning: running, state });
      } catch (err) {
        res.status(500).json({ error: "Failed to check gateway status" });
      }
    }, 3000);
  } else {
    const state = loadState();
    state.gatewayRunning = action === "start";
    saveState(state);
    res.json({ success: true, gatewayRunning: state.gatewayRunning, state });
  }
});

// -------------------------------------------------------------------
// Chat — talk to the real OpenClaw agent
// -------------------------------------------------------------------
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: "Message is required" });
  }

  // Limit message length to prevent abuse
  const safeMessage = message.trim().slice(0, 2000);

  if (isOpenClawInstalled()) {
    // Use openclaw agent to send message and get response
    const result = await runSafeCommandAsync(
      openclawBin || "openclaw",
      ["agent", "--message", safeMessage, "--json"],
      120000
    );

    if (result.success) {
      try {
        const parsed = JSON.parse(result.output);
        return res.json({
          success: true,
          reply: parsed.reply || parsed.content || parsed.message || result.output,
          raw: parsed,
        });
      } catch {
        // Non-JSON output — return as plain text
        return res.json({
          success: true,
          reply: result.output,
        });
      }
    } else {
      return res.json({
        success: false,
        reply: "I'm having trouble connecting to the agent. Make sure the gateway is running and an API key is configured.",
        error: result.output,
        demoMode: false,
      });
    }
  } else {
    // Demo mode — return helpful demo response
    const demoResponses = [
      "Hey there! I'm your personal AI agent running right here on your Raspberry Pi. What can I help you with?",
      "I can help with task management, research, scheduling, and much more. Since I'm running locally on your Pi, everything stays private.",
      "Great question! I'm connected to cloud AI models for reasoning, but all my orchestration happens right here on your hardware.",
      "I can help you set up automations, manage your tasks, draft content, analyze data, and coordinate across your connected channels.",
      "Sure! Try asking me to help plan something, research a topic, or just have a conversation. I'm here 24/7 on your Pi.",
    ];
    const state = loadState();
    const msgCount = (state._demoMsgCount || 0) + 1;
    state._demoMsgCount = msgCount;
    saveState(state);

    return res.json({
      success: true,
      reply: demoResponses[(msgCount - 1) % demoResponses.length],
      demoMode: true,
    });
  }
});

// -------------------------------------------------------------------
// Gateway health — check if the gateway is actually responding
// -------------------------------------------------------------------
app.get("/api/gateway/health", async (_req, res) => {
  if (!isOpenClawInstalled()) {
    return res.json({
      installed: false,
      running: false,
      healthy: false,
      demoMode: true,
    });
  }

  // Check if gateway process is running
  const statusResult = runSafeCommand(
    openclawBin || "openclaw",
    ["gateway", "status"],
    10000
  );
  const statusOutput = statusResult.output.toLowerCase();
  const running = statusResult.success && (
    statusOutput.includes("running") ||
    statusOutput.includes("active")
  );

  // Try to reach the gateway's HTTP health endpoint
  let healthy = false;
  let dashboardUrl = null;
  if (running) {
    try {
      const healthData = await httpGet("http://127.0.0.1:18789/api/health", 3000);
      healthy = healthData.statusCode >= 200 && healthData.statusCode < 300;
      dashboardUrl = "http://127.0.0.1:18789";
      if (healthy) {
        try {
          const parsed = JSON.parse(healthData.body);
          healthy = parsed.ok !== false;
        } catch { /* raw 2xx response is fine */ }
      }
    } catch {
      // Gateway not responding on HTTP
      healthy = false;
    }
  }

  res.json({
    installed: true,
    running,
    healthy,
    dashboardUrl,
    statusOutput: statusResult.output.slice(0, 500),
  });
});

// Update template/skills
app.post("/api/setup/template", (req, res) => {
  const { templateId } = req.body;
  const validTemplates = ["chief-of-staff", "marketing-operator", "blank"];

  if (!validTemplates.includes(templateId)) {
    return res.status(400).json({ error: "Invalid template" });
  }

  const state = loadState();
  state.templateId = templateId;
  if (!state.completedSteps.includes("template")) {
    state.completedSteps.push("template");
  }
  unlockAchievement(state, "template-chosen", 20);
  saveState(state);

  res.json({ success: true, state });
});

// Get all achievements
app.get("/api/achievements", (_req, res) => {
  const state = loadState();
  const allAchievements = [
    { id: "named", title: "Identity Created", description: "Named your AI agent", xp: 10 },
    { id: "template-chosen", title: "Personality Loaded", description: "Chose an agent template", xp: 20 },
    { id: "brain-connected", title: "Brain Connected", description: "AI provider API key configured", xp: 30 },
    { id: "channel-active", title: "Channel Open", description: "Telegram bot connected", xp: 25 },
    { id: "gateway-live", title: "Gateway Live", description: "Agent running on Pi", xp: 40 },
    { id: "first-message", title: "First Contact", description: "Talked to your agent", xp: 50 },
  ];

  res.json({
    achievements: allAchievements.map((a) => ({
      ...a,
      unlocked: state.achievements.includes(a.id),
    })),
    totalXP: 175,
    earnedXP: state.xp || 0,
    level: state.level || 0,
  });
});

// Reset (for reuse between workshop sessions)
app.post("/api/reset", (_req, res) => {
  try {
    fs.unlinkSync(STATE_FILE);
  } catch {
    // fine
  }
  res.json({ success: true });
});

// SPA fallback — serve index.html for all non-API routes
app.get("*", (_req, res) => {
  const indexPath = path.join(distPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send(
      "Workspace UI not built. Run: cd ui && npm install && npm run build"
    );
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n  OpenClaw Launcher`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  OpenClaw CLI: ${isOpenClawInstalled() ? "installed" : "not found (demo mode)"}\n`);
});
