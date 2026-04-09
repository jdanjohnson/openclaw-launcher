import { useState, useEffect, useCallback } from "react";
import {
  MessageCircle,
  Zap,
  ArrowRight,
  Rocket,
  Target,
  Sparkles,
  Brain,
  Shield,
  Power,
  RefreshCw,
} from "lucide-react";
import type { Page, AgentState } from "../App";
import { api } from "../lib/api";

interface Props {
  agentState: AgentState;
  setPage: (p: Page) => void;
}

export default function Dashboard({ agentState, setPage }: Props) {
  const isSetupComplete = agentState.currentStep >= 5;
  const agentName = agentState.agentName || "Your Agent";

  const [gatewayHealth, setGatewayHealth] = useState<{
    installed: boolean;
    running: boolean;
    healthy: boolean;
    demoMode?: boolean;
  } | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const result = await api.getGatewayHealth();
      if (result.ok) {
        setGatewayHealth(result.data);
      }
    } catch {
      // ignore
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // Poll gateway health every 15 seconds when setup is complete
  useEffect(() => {
    if (!isSetupComplete) return;
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, [isSetupComplete, fetchHealth]);

  const gatewayStatus = gatewayHealth
    ? gatewayHealth.running
      ? gatewayHealth.healthy
        ? "online"
        : "degraded"
      : "offline"
    : agentState.gatewayRunning
      ? "online"
      : "offline";

  const statusLabel = {
    online: "Online and listening",
    degraded: "Running but not responding",
    offline: "Offline",
  }[gatewayStatus];

  const statusColor = {
    online: "text-emerald-400",
    degraded: "text-amber-400",
    offline: "text-zinc-500",
  }[gatewayStatus];

  const statusDot = {
    online: "bg-emerald-400",
    degraded: "bg-amber-400",
    offline: "bg-zinc-600",
  }[gatewayStatus];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Personalized Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 mb-1">
          {isSetupComplete ? `${agentName}'s Workspace` : "Welcome"}
        </h1>
        <p className="text-zinc-400">
          {isSetupComplete
            ? `Your personal AI assistant is ${gatewayStatus === "online" ? "online and ready" : "set up"}`
            : "Set up your agent to get started"}
        </p>
      </div>

      {/* Setup CTA if not complete */}
      {!isSetupComplete && (
        <button
          onClick={() => setPage("onboarding")}
          className="w-full mb-8 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-xl p-5 flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Rocket className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-lg">Continue Setup</p>
              <p className="text-sm text-white/70">
                Step {agentState.currentStep + 1} of 5 — {Math.round((agentState.currentStep / 5) * 100)}% complete
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5" />
        </button>
      )}

      {/* Agent Status Hero */}
      {isSetupComplete && (
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
                <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 ${statusDot} rounded-full border-2 border-zinc-900`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-100">{agentName}</h2>
                <div className="flex items-center gap-2">
                  <p className={`text-sm ${statusColor}`}>{statusLabel}</p>
                  {gatewayHealth?.demoMode && (
                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">Demo</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchHealth}
                disabled={healthLoading}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-40"
                title="Refresh status"
              >
                <RefreshCw className={`w-4 h-4 ${healthLoading ? "animate-spin" : ""}`} />
              </button>
              {gatewayHealth?.installed && (
                <button
                  onClick={async () => {
                    await api.toggleGateway(gatewayStatus === "online" ? "stop" : "start");
                    setTimeout(fetchHealth, 4000);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    gatewayStatus === "online"
                      ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  {gatewayStatus === "online" ? "Stop" : "Start"}
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-zinc-800/50 rounded-xl p-3">
              <Brain className="w-4 h-4 text-blue-400 mb-1" />
              <p className="text-xs text-zinc-500">Brain</p>
              <p className="text-sm font-medium text-zinc-200 capitalize">
                {agentState.apiProvider || "Not set"}
              </p>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-3">
              <Target className="w-4 h-4 text-orange-400 mb-1" />
              <p className="text-xs text-zinc-500">Skills</p>
              <p className="text-sm font-medium text-zinc-200 capitalize">
                {agentState.templateId ? agentState.templateId.replace(/-/g, " ") : "None"}
              </p>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-3">
              <Shield className="w-4 h-4 text-emerald-400 mb-1" />
              <p className="text-xs text-zinc-500">Privacy</p>
              <p className="text-sm font-medium text-zinc-200">On-device</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">
          {isSetupComplete ? "What would you like to do?" : "Quick Actions"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setPage("chat")}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-left hover:border-zinc-700 transition-colors group"
          >
            <MessageCircle className="w-6 h-6 text-blue-400 mb-3" />
            <p className="font-medium text-zinc-200 group-hover:text-white">Chat with {agentName}</p>
            <p className="text-xs text-zinc-500 mt-1">Ask questions, get tasks done, brainstorm ideas</p>
          </button>
          <button
            onClick={() => setPage("templates")}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-left hover:border-zinc-700 transition-colors group"
          >
            <Zap className="w-6 h-6 text-amber-400 mb-3" />
            <p className="font-medium text-zinc-200 group-hover:text-white">Add Skills</p>
            <p className="text-xs text-zinc-500 mt-1">Teach your agent new capabilities</p>
          </button>
          <button
            onClick={() => setPage("settings")}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-left hover:border-zinc-700 transition-colors group"
          >
            <Target className="w-6 h-6 text-emerald-400 mb-3" />
            <p className="font-medium text-zinc-200 group-hover:text-white">Settings</p>
            <p className="text-xs text-zinc-500 mt-1">Change your brain, connect channels</p>
          </button>
        </div>
      </div>

      {/* Journey Progress */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">Your Journey</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-zinc-200">Level {agentState.level}</span>
              <span className="text-xs text-zinc-500">
                {agentState.level === 0 ? "Getting Started" : agentState.level === 1 ? "Novice" : agentState.level === 2 ? "Operator" : "Commander"}
              </span>
            </div>
            <span className="text-xs text-zinc-500">{agentState.xp} / {agentState.maxXp} XP</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-700"
              style={{ width: `${agentState.maxXp > 0 ? Math.round((agentState.xp / agentState.maxXp) * 100) : 0}%` }}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {agentState.achievements.map((a) => (
              <div key={a} className="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-3 py-2">
                <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                <span className="text-xs text-zinc-300 capitalize">{a.replace(/-/g, " ")}</span>
              </div>
            ))}
            {agentState.achievements.length === 0 && (
              <p className="text-xs text-zinc-500 col-span-full text-center py-2">
                Complete setup to earn your first achievements
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
