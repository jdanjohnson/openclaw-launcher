import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";
import { api } from "./lib/api";
import type { BackendState } from "./lib/api";
import BootSequence from "./components/BootSequence";
import AgentSelection from "./components/AgentSelection";
import ContextOnboarding from "./components/ContextOnboarding";
import Dashboard from "./components/Dashboard";
import ChatPanel from "./components/ChatPanel";
import SettingsPanel from "./components/SettingsPanel";

type AppPhase = "boot" | "select" | "onboarding" | "dashboard";

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
  const [systemInfo, setSystemInfo] = useState({ hostname: "", ip: "", ollamaOnline: false, openclawInstalled: false });
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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
          openclawInstalled: res.data.system?.openclawInstalled || false,
        });
      }
      setApiLoaded(true);
    }).catch(() => {
      setApiLoaded(true);
    });
  }, []);

  // Transition out of boot when both animation and API are done
  useEffect(() => {
    if (bootAnimDone && apiLoaded && phase === "boot") {
      const state = apiStateRef.current;
      if (state?.onboardingComplete || (state?.currentStep ?? 0) >= 5) {
        setPhase("dashboard");
      } else {
        setPhase("select");
      }
    }
  }, [bootAnimDone, apiLoaded, phase]);

  const handleBootComplete = useCallback(() => {
    setBootAnimDone(true);
  }, []);

  const handleAgentSelect = useCallback((type: "context" | "worker") => {
    if (type === "context") {
      setPhase("onboarding");
    } else {
      // Worker agent -- skip onboarding, go to dashboard with defaults
      setPhase("dashboard");
    }
  }, []);

  const handleOnboardingComplete = useCallback((data: { userName: string; agentName: string; userRole?: string; goals?: string; commStyle?: string }) => {
    // ContextOnboarding already calls api.onboard() — just update local state
    setAgentState((prev) => ({
      ...prev,
      userName: data.userName,
      agentName: data.agentName,
      userRole: data.userRole || prev.userRole,
      goals: data.goals || prev.goals,
      commStyle: data.commStyle || prev.commStyle,
      onboardingComplete: true,
      agentMood: "happy" as const,
    }));
    setPhase("dashboard");
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
    setPhase("select");
    setShowChat(false);
    setShowSettings(false);
  }, []);

  // Boot phase
  if (phase === "boot") {
    return <BootSequence onComplete={handleBootComplete} />;
  }

  // Agent selection phase
  if (phase === "select") {
    return <AgentSelection onSelect={handleAgentSelect} />;
  }

  // Context onboarding phase
  if (phase === "onboarding") {
    return <ContextOnboarding onComplete={handleOnboardingComplete} />;
  }

  // Dashboard phase
  return (
    <>
      <Dashboard
        agentName={agentState.agentName || "Agent"}
        userName={agentState.userName || "User"}
        onOpenChat={() => setShowChat(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      {showChat && (
        <ChatPanel
          agentName={agentState.agentName || "Agent"}
          onClose={() => setShowChat(false)}
          onMoodChange={handleMoodChange}
        />
      )}

      {showSettings && (
        <SettingsPanel
          agentState={agentState}
          systemInfo={systemInfo}
          onClose={() => setShowSettings(false)}
          onUpdate={updateState}
          onReset={handleReset}
        />
      )}
    </>
  );
}

export default App;
