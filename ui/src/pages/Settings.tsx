import { useState } from "react";
import { Settings as SettingsIcon, Brain, MessageCircle, Power, Trash2, AlertTriangle } from "lucide-react";
import type { AgentState } from "../App";
import { api } from "../lib/api";

interface Props {
  agentState: AgentState;
  updateState: (u: Partial<AgentState>) => void;
  resetState: () => void;
}

export default function Settings({ agentState, updateState, resetState }: Props) {
  const [toggling, setToggling] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    const action = agentState.gatewayRunning ? "stop" : "start";
    const res = await api.toggleGateway(action);
    if (res.ok && res.data.state) {
      updateState({ gatewayRunning: res.data.gatewayRunning });
    }
    setToggling(false);
  };

  const handleReset = () => {
    resetState();
    setConfirmReset(false);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <SettingsIcon className="w-6 h-6 text-zinc-400" />
          <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
        </div>
        <p className="text-zinc-400">Manage your agent and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Your Agent */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide mb-4">Your Agent</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Name</span>
              <span className="text-zinc-200 font-medium">{agentState.agentName || "Not set"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Active skills</span>
              <span className="text-zinc-200 capitalize">
                {agentState.templateId ? agentState.templateId.replace(/-/g, " ") : "None"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Your role</span>
              <span className="text-zinc-200">{agentState.userRole || "Not set"}</span>
            </div>
          </div>
        </section>

        {/* AI Brain */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">AI Brain</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Provider</span>
              <span className="text-zinc-200 capitalize">{agentState.apiProvider || "Not configured"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Key</span>
              <span className={agentState.apiKeySet ? "text-emerald-400" : "text-zinc-500"}>
                {agentState.apiKeySet ? "Configured" : "Not set"}
              </span>
            </div>
          </div>
          <p className="text-xs text-zinc-600 mt-3">Your key is stored only on this device and never leaves it.</p>
        </section>

        {/* Messaging */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">Messaging</h2>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Telegram</span>
            <span className={agentState.telegramConnected ? "text-emerald-400" : "text-zinc-500"}>
              {agentState.telegramConnected ? "Connected" : "Not connected"}
            </span>
          </div>
        </section>

        {/* Agent Status */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Power className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">Agent Status</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${agentState.gatewayRunning ? "text-emerald-400" : "text-zinc-500"}`}>
                {agentState.gatewayRunning ? "Running" : "Stopped"}
              </p>
              <p className="text-xs text-zinc-600">
                {agentState.gatewayRunning ? "Your agent is online and listening" : "Your agent is offline"}
              </p>
            </div>
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                agentState.gatewayRunning
                  ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              } disabled:opacity-50`}
            >
              {toggling ? "..." : agentState.gatewayRunning ? "Stop" : "Start"}
            </button>
          </div>
        </section>

        {/* Start Over */}
        <section className="bg-zinc-900 border border-red-900/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 className="w-4 h-4 text-red-400" />
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">Start Over</h2>
          </div>
          <p className="text-sm text-zinc-500 mb-4">
            Reset everything and start fresh. This will erase your agent's name, settings, and all progress.
            Useful when handing this Pi to another person.
          </p>
          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-800 text-red-400 hover:bg-red-900/30 transition-all"
            >
              Reset Everything
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-red-950/30 rounded-lg p-3 border border-red-900/30">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-sm text-red-300 flex-1">This cannot be undone.</p>
              <button onClick={handleReset} className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-500 transition-colors">
                Confirm
              </button>
              <button onClick={() => setConfirmReset(false)} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-sm hover:bg-zinc-700 transition-colors">
                Cancel
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
