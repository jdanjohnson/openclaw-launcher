import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";
import { api } from "./lib/api";
import type { BackendState } from "./lib/api";
import BootSequence from "./components/BootSequence";
import QuickOnboarding from "./components/QuickOnboarding";
import TamagotchiAgent from "./components/TamagotchiAgent";
import DesktopDock from "./components/DesktopDock";
import type { PanelId } from "./components/DesktopDock";
import ChatPanel from "./components/ChatPanel";
import BrainPanel from "./components/BrainPanel";
import SkillsPanel from "./components/SkillsPanel";
import SettingsPanel from "./components/SettingsPanel";

// Re-export for backward compat with old pages that may import from App
export type Page = "dashboard" | "onboarding" | "chat" | "templates" | "achievements" | "settings";
export interface AgentState {
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
  currentStep: number;
  level: number;
  xp: number;
  maxXp: number;
}

type AppPhase = "boot" | "onboarding" | "desktop";

const DEFAULT_BACKEND_STATE: Partial<BackendState> = {
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
  currentStep: 0,
  level: 0,
  xp: 0,
  onboardingComplete: false,
  agentMood: "sleeping",
  modelProvider: "local",
  localModel: "phi3:mini",
  cloudProvider: "",
  cloudKeySet: false,
};

function App() {
  const [phase, setPhase] = useState<AppPhase>("boot");
  const [agentState, setAgentState] = useState<BackendState>(DEFAULT_BACKEND_STATE as BackendState);
  const [systemInfo, setSystemInfo] = useState({ hostname: "", ip: "", ollamaOnline: false });
  const [activePanel, setActivePanel] = useState<PanelId>(null);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [bootAnimDone, setBootAnimDone] = useState(false);
  const apiStateRef = useRef<BackendState | null>(null);

  // Fetch state from backend on mount
  useEffect(() => {
    api.getStatus().then((res) => {
      if (res.ok && res.data.state) {
        const s = res.data.state;
        const merged = { ...DEFAULT_BACKEND_STATE, ...s } as BackendState;
        setAgentState(merged);
        apiStateRef.current = merged;
        setSystemInfo({
          hostname: res.data.system?.hostname || "",
          ip: res.data.system?.ip || "",
          ollamaOnline: res.data.system?.ollamaOnline || false,
        });
      }
      setApiLoaded(true);
    }).catch(() => {
      setApiLoaded(true);
    });
  }, []);

  // Transition out of boot only when BOTH animation is done AND API has responded
  useEffect(() => {
    if (bootAnimDone && apiLoaded && phase === "boot") {
      const state = apiStateRef.current;
      if (state?.onboardingComplete) {
        setPhase("desktop");
      } else {
        setPhase("onboarding");
      }
    }
  }, [bootAnimDone, apiLoaded, phase]);

  const handleBootComplete = useCallback(() => {
    setBootAnimDone(true);
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    // Re-fetch state after onboarding
    api.getStatus().then((res) => {
      if (res.ok && res.data.state) {
        setAgentState({ ...DEFAULT_BACKEND_STATE, ...res.data.state } as BackendState);
      }
    });
    setPhase("desktop");
  }, []);

  const updateState = useCallback((updates: Partial<BackendState>) => {
    setAgentState((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleMoodChange = useCallback((mood: string) => {
    setAgentState((prev) => ({ ...prev, agentMood: mood as BackendState["agentMood"] }));
    api.setMood(mood);
  }, []);

  const handleReset = useCallback(() => {
    api.reset();
    localStorage.removeItem("openclaw-state");
    setAgentState(DEFAULT_BACKEND_STATE as BackendState);
    setPhase("onboarding");
    setActivePanel(null);
  }, []);

  const handlePanelToggle = useCallback((panel: PanelId) => {
    setActivePanel(panel);
  }, []);

  // Boot phase
  if (phase === "boot") {
    return <BootSequence onComplete={handleBootComplete} />;
  }

  // Onboarding phase
  if (phase === "onboarding") {
    return <QuickOnboarding onComplete={handleOnboardingComplete} />;
  }

  // Desktop phase
  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 overflow-hidden flex flex-col relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900/30 to-zinc-950 pointer-events-none" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-2 bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-200 tracking-wide">STATIONED AGENTS</span>
          <span className="text-[10px] text-zinc-500">powered by</span>
          <span className="text-xs text-orange-400">{"\uD83E\uDD9E"}OpenClaw</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-600">
          <span>{agentState.userName && `${agentState.userName}'s Pi`}</span>
          <div className={`w-1.5 h-1.5 rounded-full ${systemInfo.ollamaOnline ? "bg-emerald-400" : "bg-zinc-600"}`} />
        </div>
      </div>

      {/* Main desktop area - agent center stage */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
        <TamagotchiAgent
          mood={agentState.agentMood || "idle"}
          name={agentState.agentName || "Agent"}
          onClick={() => handlePanelToggle(activePanel === "chat" ? null : "chat")}
        />

        {/* XP bar */}
        {agentState.xp > 0 && (
          <div className="mt-4 w-40">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
              <span>Level {agentState.level}</span>
              <span>{agentState.xp} XP</span>
            </div>
            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (agentState.xp / 175) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Quick hint */}
        <p className="mt-6 text-xs text-zinc-600 animate-pulse">
          {activePanel === null ? "Tap me to chat" : ""}
        </p>
      </div>

      {/* Panels */}
      {activePanel === "chat" && (
        <ChatPanel
          agentName={agentState.agentName || "Agent"}
          onClose={() => setActivePanel(null)}
          onMoodChange={handleMoodChange}
        />
      )}
      {activePanel === "brain" && (
        <BrainPanel
          agentState={agentState}
          onClose={() => setActivePanel(null)}
          onUpdate={updateState}
        />
      )}
      {activePanel === "skills" && (
        <SkillsPanel
          agentState={agentState}
          onClose={() => setActivePanel(null)}
          onUpdate={updateState}
        />
      )}
      {activePanel === "settings" && (
        <SettingsPanel
          agentState={agentState}
          systemInfo={systemInfo}
          onClose={() => setActivePanel(null)}
          onUpdate={updateState}
          onReset={handleReset}
        />
      )}

      {/* Desktop dock */}
      <DesktopDock activePanel={activePanel} onPanelToggle={handlePanelToggle} />
    </div>
  );
}

export default App;
