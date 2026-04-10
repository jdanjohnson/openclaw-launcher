const express = require("express");
const { execFileSync } = require("child_process");
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const app = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_BASE = process.env.OLLAMA_BASE || "http://localhost:11434";
const GATEWAY_WS = process.env.OPENCLAW_GATEWAY_WS || "ws://127.0.0.1:18789";

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
      // V2 Agentic OS fields
      onboardingComplete: false,
      agentMood: "sleeping",
      modelProvider: "local",
      localModel: "phi3:mini",
      cloudProvider: "",
      cloudKeySet: false,
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

// HTTP request helper for Ollama (local HTTP)
function ollamaRequest(method, urlPath, body, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, OLLAMA_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      timeout: timeoutMs,
      headers: { "Content-Type": "application/json" },
    };
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, data: JSON.parse(data), status: res.statusCode });
        } catch {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, data: data, status: res.statusCode });
        }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
    if (body) { req.write(typeof body === "string" ? body : JSON.stringify(body)); }
    req.end();
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

// -------------------------------------------------------------------
// API Routes
// -------------------------------------------------------------------

// Get current onboarding state + system info (V2: now includes Ollama status)
app.get("/api/status", async (_req, res) => {
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

  // Check Ollama status
  let ollamaOnline = false;
  let ollamaModels = [];
  try {
    const ollamaResult = await ollamaRequest("GET", "/api/tags", null, 3000);
    if (ollamaResult.ok && ollamaResult.data && ollamaResult.data.models) {
      ollamaOnline = true;
      ollamaModels = ollamaResult.data.models.map((m) => ({ name: m.name, size: m.size, modified: m.modified_at }));
    }
  } catch { /* Ollama not running */ }

  state.gatewayRunning = gatewayRunning;
  saveState(state);

  res.json({
    state,
    system: {
      hostname, ip, openclawInstalled: clawInstalled,
      gatewayRunning, ollamaOnline, ollamaModels,
    },
  });
});

// -------------------------------------------------------------------
// V2: Quick onboarding (30-second flow)
// -------------------------------------------------------------------
app.post("/api/onboard", (req, res) => {
  const { userName, agentName } = req.body;
  if (!agentName || agentName.trim().length === 0) {
    return res.status(400).json({ error: "Agent name is required" });
  }
  const state = loadState();
  state.userName = (userName || "").trim();
  state.agentName = agentName.trim();
  state.onboardingComplete = true;
  state.agentMood = "happy";
  state.currentStep = Math.max(state.currentStep, 5);
  if (!state.completedSteps.includes("onboarded")) { state.completedSteps.push("onboarded"); }
  unlockAchievement(state, "named", 10);
  unlockAchievement(state, "gateway-live", 40);
  saveState(state);
  res.json({ success: true, state });
});

// -------------------------------------------------------------------
// OpenClaw Gateway WebSocket chat helper
// Sends a message via the gateway's chat.send method.
// Returns the assistant reply text or null on failure.
// -------------------------------------------------------------------
let gatewayReqId = 0;
function gatewayChatSend(message, timeoutMs = 120000) {
  return new Promise((resolve) => {
    let ws;
    const timer = setTimeout(() => {
      try { ws.close(); } catch { /* ignore */ }
      resolve(null);
    }, timeoutMs);

    try {
      ws = new WebSocket(GATEWAY_WS);
    } catch {
      clearTimeout(timer);
      return resolve(null);
    }

    let handshakeDone = false;
    let reqId = `launcher-${++gatewayReqId}`;
    let collectedText = "";

    ws.on("error", () => { clearTimeout(timer); resolve(null); });

    ws.on("open", () => {
      // Wait for challenge (gateway sends connect.challenge first)
    });

    ws.on("message", (raw) => {
      let data;
      try { data = JSON.parse(raw.toString()); } catch { return; }

      // Step 1: Respond to connect.challenge with a connect request
      if (data.type === "event" && data.event === "connect.challenge") {
        ws.send(JSON.stringify({
          type: "req", id: `connect-${gatewayReqId}`, method: "connect",
          params: {
            minProtocol: 3, maxProtocol: 3,
            client: { id: "stationed-launcher", version: "1.0.0", platform: "pi", mode: "webchat" },
            role: "operator",
            scopes: ["operator.admin"],
            caps: [],
            userAgent: "stationed-launcher/1.0.0",
            locale: "en-US",
          },
        }));
        return;
      }

      // Step 2: After connect response, send the chat message
      if (data.type === "res" && !handshakeDone) {
        if (data.error) {
          clearTimeout(timer);
          ws.close();
          return resolve(null);
        }
        handshakeDone = true;
        ws.send(JSON.stringify({
          type: "req", id: reqId, method: "chat.send",
          params: {
            sessionKey: "default",
            message: message,
            thinking: "",
            deliver: false,
            timeoutMs: timeoutMs - 5000,
            idempotencyKey: `run-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          },
        }));
        return;
      }

      // Step 3: Collect streaming tokens and final response
      if (data.type === "event" && data.event === "chat.token") {
        const token = data.payload && data.payload.token;
        if (token) collectedText += token;
        return;
      }

      // Final response to our chat.send request
      if (data.type === "res" && data.id === reqId) {
        clearTimeout(timer);
        const payload = data.payload || {};
        // The reply can be in payload.response, payload.text, or collected from tokens
        const text = payload.response || payload.text || payload.content || collectedText;
        ws.close();
        return resolve(text || null);
      }
    });

    ws.on("close", () => {
      clearTimeout(timer);
      if (collectedText) return resolve(collectedText);
      resolve(null);
    });
  });
}

// -------------------------------------------------------------------
// V2: Chat — routes through OpenClaw Gateway first, falls back to Ollama
// -------------------------------------------------------------------
app.post("/api/chat", async (req, res) => {
  const { message, model } = req.body;
  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: "Message is required" });
  }
  const state = loadState();
  const agentName = state.agentName || "Agent";
  const userName = state.userName || "User";
  const useModel = model || state.localModel || "phi3:mini";

  // Try OpenClaw Gateway first (the primary agent)
  if (isOpenClawInstalled() || state.gatewayRunning) {
    try {
      const gatewayReply = await gatewayChatSend(message.trim());
      if (gatewayReply) {
        const freshState = loadState();
        freshState.agentMood = "happy";
        if (!freshState.achievements.includes("first-message")) { unlockAchievement(freshState, "first-message", 50); }
        saveState(freshState);
        return res.json({ response: gatewayReply, provider: "openclaw", model: "gateway" });
      }
    } catch { /* Gateway unavailable, fall through to Ollama */ }
  }

  // Fallback: direct Ollama
  const systemPrompt = `You are ${agentName}, a personal AI assistant running locally on a Raspberry Pi 5. You are helpful, friendly, and concise. Your owner's name is ${userName}. You live on their device and are always available. Keep responses under 3 sentences unless asked for more detail.`;

  if (state.modelProvider === "cloud" && state.cloudKeySet) {
    return res.json({ response: "Cloud mode is active. Chat is handled directly by the cloud provider.", provider: "cloud", cloudProvider: state.cloudProvider });
  }

  try {
    const ollamaRes = await ollamaRequest("POST", "/api/generate", {
      model: useModel, prompt: message.trim(), system: systemPrompt,
      stream: false, options: { temperature: 0.7, num_predict: 256 },
    }, 120000);
    if (ollamaRes.ok && ollamaRes.data && ollamaRes.data.response) {
      const freshState = loadState();
      freshState.agentMood = "happy";
      if (!freshState.achievements.includes("first-message")) { unlockAchievement(freshState, "first-message", 50); }
      saveState(freshState);
      return res.json({
        response: ollamaRes.data.response, model: useModel, provider: "ollama",
        eval_duration: ollamaRes.data.eval_duration,
        tokens_per_second: ollamaRes.data.eval_count && ollamaRes.data.eval_duration
          ? (ollamaRes.data.eval_count / (ollamaRes.data.eval_duration / 1e9)).toFixed(1) : null,
      });
    }
    return res.status(502).json({ error: "Ollama returned an unexpected response", details: ollamaRes.data });
  } catch (err) {
    const fallbackResponses = [
      `Hey ${userName}! I'm ${agentName}. Neither OpenClaw Gateway nor Ollama are running. Start the gateway from Settings or run: ollama serve`,
      `I'm ${agentName}, running in demo mode. Start the OpenClaw Gateway from Settings to unlock my full capabilities!`,
      `${userName}, I need either the OpenClaw Gateway or Ollama to think properly. Start the gateway from Settings!`,
    ];
    return res.json({ response: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)], provider: "demo", ollamaError: err.message });
  }
});

// V2: Ollama status & models
app.get("/api/ollama/status", async (_req, res) => {
  try {
    const result = await ollamaRequest("GET", "/api/tags", null, 5000);
    if (result.ok && result.data && result.data.models) {
      return res.json({ online: true, models: result.data.models.map((m) => ({ name: m.name, size: m.size, modified: m.modified_at, digest: m.digest })) });
    }
    return res.json({ online: false, models: [] });
  } catch { return res.json({ online: false, models: [] }); }
});

// V2: Update agent mood
app.post("/api/mood", (req, res) => {
  const { mood } = req.body;
  const validMoods = ["idle", "happy", "thinking", "talking", "sleeping"];
  if (!validMoods.includes(mood)) { return res.status(400).json({ error: "Invalid mood" }); }
  const state = loadState();
  state.agentMood = mood;
  saveState(state);
  res.json({ success: true, mood });
});

// V2: Switch model provider (local vs cloud)
app.post("/api/brain/switch", (req, res) => {
  const { provider, localModel, cloudProvider, apiKey } = req.body;
  const state = loadState();
  if (provider === "local") {
    state.modelProvider = "local";
    if (localModel) state.localModel = localModel;
    unlockAchievement(state, "brain-connected", 30);
  } else if (provider === "cloud") {
    const validProviders = ["google", "anthropic", "openai"];
    if (!cloudProvider || !validProviders.includes(cloudProvider)) {
      return res.status(400).json({ error: "Invalid cloud provider" });
    }
    if (!apiKey || apiKey.trim().length < 10) {
      return res.status(400).json({ error: "Valid API key required" });
    }
    state.modelProvider = "cloud";
    state.cloudProvider = cloudProvider;
    state.cloudKeySet = true;
    state.apiProvider = cloudProvider;
    state.apiKeySet = true;
    if (isOpenClawInstalled()) {
      runSafeCommand(openclawBin || "openclaw", ["models", "auth", "paste-token", "--provider", cloudProvider, "--token", apiKey.trim()]);
    }
    const envVarMap = { google: "GOOGLE_API_KEY", anthropic: "ANTHROPIC_API_KEY", openai: "OPENAI_API_KEY" };
    const home = process.env.HOME || "/home/pi";
    const envFile = path.join(home, ".openclaw", "env");
    try {
      fs.mkdirSync(path.join(home, ".openclaw"), { recursive: true });
      let envContent = "";
      if (fs.existsSync(envFile)) { envContent = fs.readFileSync(envFile, "utf8"); }
      const envVar = envVarMap[cloudProvider];
      if (envVar) {
        const line = `${envVar}=${apiKey.trim().replace(/[\r\n]/g, "")}`;
        if (envContent.includes(envVar)) { envContent = envContent.replace(new RegExp(`${envVar}=.*`), () => line); }
        else { envContent += `\n${line}`; }
        fs.writeFileSync(envFile, envContent.trim() + "\n");
      }
    } catch { /* Non-fatal */ }
    unlockAchievement(state, "brain-connected", 30);
  } else {
    return res.status(400).json({ error: "Invalid provider. Must be 'local' or 'cloud'." });
  }
  saveState(state);
  res.json({ success: true, state });
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
  console.log(`\n  OpenClaw Launcher (Agentic OS)`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  OpenClaw CLI: ${isOpenClawInstalled() ? "installed" : "not found (demo mode)"}`);
  console.log(`  Ollama: ${OLLAMA_BASE}\n`);
});
