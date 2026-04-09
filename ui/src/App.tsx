import { useState, useEffect, useCallback } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import Chat from "./pages/Chat";
import Templates from "./pages/Templates";
import Achievements from "./pages/Achievements";
import Settings from "./pages/Settings";
import { api } from "./lib/api";

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

const DEFAULT_STATE: AgentState = {
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
  maxXp: 175,
};

function App() {
  const [page, setPage] = useState<Page>("onboarding");
  const [agentState, setAgentState] = useState<AgentState>(DEFAULT_STATE);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // On mount, fetch state from backend (which persists in state.json on the Pi)
  useEffect(() => {
    api.getStatus().then((res) => {
      if (res.ok && res.data.state) {
        const s = res.data.state;
        const merged: AgentState = {
          ...DEFAULT_STATE,
          agentName: s.agentName || "",
          userName: s.userName || "",
          userRole: s.userRole || "",
          interests: s.interests || [],
          goals: s.goals || "",
          commStyle: s.commStyle || "",
          templateId: s.templateId || "",
          apiProvider: s.apiProvider || "",
          apiKeySet: s.apiKeySet || false,
          telegramConnected: s.telegramConnected || false,
          gatewayRunning: s.gatewayRunning || false,
          achievements: s.achievements || [],
          completedSteps: s.completedSteps || [],
          currentStep: s.currentStep || 0,
          level: s.level || 0,
          xp: s.xp || 0,
          maxXp: 175,
        };
        setAgentState(merged);
        if (merged.currentStep >= 5) {
          setPage("dashboard");
        }
      } else {
        // Backend not reachable — fall back to localStorage
        const saved = localStorage.getItem("openclaw-state");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setAgentState({ ...DEFAULT_STATE, ...parsed });
            if (parsed.currentStep >= 5) {
              setPage("dashboard");
            }
          } catch {
            // ignore
          }
        }
      }
    });
  }, []);

  const updateState = useCallback((updates: Partial<AgentState>) => {
    setAgentState((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem("openclaw-state", JSON.stringify(next));
      return next;
    });
  }, []);

  const unlockAchievement = useCallback((id: string, xpGain: number) => {
    setAgentState((prev) => {
      if (prev.achievements.includes(id)) return prev;
      const next = {
        ...prev,
        achievements: [...prev.achievements, id],
        xp: prev.xp + xpGain,
        level: (prev.xp + xpGain) >= 175 ? 3 : (prev.xp + xpGain) >= 80 ? 2 : (prev.xp + xpGain) > 0 ? 1 : 0,
      };
      localStorage.setItem("openclaw-state", JSON.stringify(next));
      return next;
    });
  }, []);

  const resetState = useCallback(() => {
    api.reset();
    localStorage.removeItem("openclaw-state");
    setAgentState(DEFAULT_STATE);
    setPage("onboarding");
  }, []);

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <Dashboard agentState={agentState} setPage={setPage} />;
      case "onboarding":
        return (
          <Onboarding
            agentState={agentState}
            updateState={updateState}
            unlockAchievement={unlockAchievement}
            setPage={setPage}
          />
        );
      case "chat":
        return <Chat agentState={agentState} />;
      case "templates":
        return (
          <Templates
            agentState={agentState}
            updateState={updateState}
            unlockAchievement={unlockAchievement}
          />
        );
      case "achievements":
        return <Achievements agentState={agentState} />;
      case "settings":
        return (
          <Settings
            agentState={agentState}
            updateState={updateState}
            resetState={resetState}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <Sidebar
        currentPage={page}
        setPage={setPage}
        agentState={agentState}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      <main className="flex-1 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  );
}

export default App
