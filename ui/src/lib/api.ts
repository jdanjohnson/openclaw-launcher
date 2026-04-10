// API client for communicating with the Express backend
// In production (on the Pi), the UI is served by the same Express server
// In development, Vite proxies /api to localhost:3000

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; data: T; error?: string }> {
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, data, error: data.error || "Request failed" };
    }
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      data: {} as T,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

export interface BackendState {
  currentStep: number;
  agentName: string;
  userName: string;
  userRole: string;
  interests: string[];
  goals: string;
  commStyle: string;
  templateId: string;
  apiProvider: string;
  apiKeySet: boolean;
  telegramConnected: boolean;
  gatewayRunning: boolean;
  achievements: string[];
  completedSteps: string[];
  xp: number;
  level: number;
  startedAt: string;
  telegramBot?: { username: string; first_name: string };
  // V2 Agentic OS fields
  onboardingComplete: boolean;
  agentMood: "idle" | "happy" | "thinking" | "talking" | "sleeping";
  modelProvider: "local" | "cloud";
  localModel: string;
  cloudProvider: string;
  cloudKeySet: boolean;
}

export interface StatusResponse {
  state: BackendState;
  system: {
    hostname: string;
    ip: string;
    openclawInstalled: boolean;
    gatewayRunning: boolean;
    ollamaOnline: boolean;
    ollamaModels: { name: string; size: number; modified: string }[];
  };
}

export interface ChatResponse {
  response: string;
  model?: string;
  provider: "openclaw" | "ollama" | "local" | "cloud" | "demo";
  tokens_per_second?: string | null;
  ollamaError?: string;
  cloudProvider?: string;
}

export interface OllamaStatusResponse {
  online: boolean;
  models: { name: string; size: number; modified: string; digest: string }[];
}

export interface SetupResponse {
  success: boolean;
  state: BackendState;
  demoMode?: boolean;
  message?: string;
  gatewayRunning?: boolean;
  botInfo?: { username: string; first_name: string };
}

export const api = {
  getStatus() {
    return request<StatusResponse>("/api/status");
  },

  saveProfile(userName: string, agentName: string, role: string) {
    return request<SetupResponse>("/api/setup/profile", {
      method: "POST",
      body: JSON.stringify({ userName, agentName, role }),
    });
  },

  saveContext(
    interests: string[],
    goals: string,
    commStyle: string,
    templateId: string
  ) {
    return request<SetupResponse>("/api/setup/context", {
      method: "POST",
      body: JSON.stringify({ interests, goals, commStyle, templateId }),
    });
  },

  saveApiKey(provider: string, apiKey: string) {
    return request<SetupResponse>("/api/setup/api-key", {
      method: "POST",
      body: JSON.stringify({ provider, apiKey }),
    });
  },

  saveTelegram(botToken: string, userId?: string) {
    return request<SetupResponse>("/api/setup/telegram", {
      method: "POST",
      body: JSON.stringify({ botToken, userId }),
    });
  },

  skipTelegram() {
    return request<SetupResponse>("/api/setup/telegram", {
      method: "POST",
      body: JSON.stringify({ skip: true }),
    });
  },

  activate() {
    return request<SetupResponse>("/api/activate", {
      method: "POST",
    });
  },

  toggleGateway(action: "start" | "stop") {
    return request<SetupResponse>("/api/gateway/toggle", {
      method: "POST",
      body: JSON.stringify({ action }),
    });
  },

  updateTemplate(templateId: string) {
    return request<SetupResponse>("/api/setup/template", {
      method: "POST",
      body: JSON.stringify({ templateId }),
    });
  },

  reset() {
    return request<{ success: boolean }>("/api/reset", {
      method: "POST",
    });
  },

  // V2 Agentic OS endpoints
  onboard(userName: string, agentName: string) {
    return request<SetupResponse>("/api/onboard", {
      method: "POST",
      body: JSON.stringify({ userName, agentName }),
    });
  },

  chat(message: string, model?: string) {
    return request<ChatResponse>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message, model }),
    });
  },

  getOllamaStatus() {
    return request<OllamaStatusResponse>("/api/ollama/status");
  },

  setMood(mood: string) {
    return request<{ success: boolean; mood: string }>("/api/mood", {
      method: "POST",
      body: JSON.stringify({ mood }),
    });
  },

  switchBrain(params: { provider: "local" | "cloud"; localModel?: string; cloudProvider?: string; apiKey?: string }) {
    return request<SetupResponse>("/api/brain/switch", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },
};
