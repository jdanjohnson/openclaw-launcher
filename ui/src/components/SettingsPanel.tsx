import { useState } from "react";
import { X, Settings as SettingsIcon, Trash2, AlertTriangle, Wifi, Terminal, ChevronDown, ChevronUp, Activity } from "lucide-react";
import type { BackendState } from "../lib/api";
import { api } from "../lib/api";

interface Props {
  agentState: BackendState;
  systemInfo: { hostname: string; ip: string; ollamaOnline: boolean; openclawInstalled: boolean };
  onClose: () => void;
  onUpdate: (state: Partial<BackendState>) => void;
  onReset: () => void;
}

export default function SettingsPanel({ agentState, systemInfo, onClose, onUpdate, onReset }: Props) {
  const [toggling, setToggling] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sshHost, setSshHost] = useState(() => {
    try {
      // Migrate old key to new key
      const old = localStorage.getItem("stationed-ssh");
      if (old && !localStorage.getItem("atomic-claw-ssh")) {
        localStorage.setItem("atomic-claw-ssh", old);
        localStorage.removeItem("stationed-ssh");
      }
      const s = localStorage.getItem("atomic-claw-ssh");
      return s ? JSON.parse(s).host || "" : "";
    } catch { return ""; }
  });
  const [sshUser, setSshUser] = useState(() => {
    try { const s = localStorage.getItem("atomic-claw-ssh"); return s ? JSON.parse(s).user || "" : ""; } catch { return ""; }
  });
  const [sshSaved, setSshSaved] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    const action = agentState.gatewayRunning ? "stop" : "start";
    const res = await api.toggleGateway(action);
    if (res.ok && res.data.state) {
      onUpdate({ gatewayRunning: res.data.gatewayRunning });
    }
    setToggling(false);
  };

  const handleReset = () => {
    onReset();
    setConfirmReset(false);
  };

  const handleSaveSsh = () => {
    localStorage.setItem("atomic-claw-ssh", JSON.stringify({ host: sshHost, user: sshUser }));
    setSshSaved(true);
    setTimeout(() => setSshSaved(false), 2000);
  };

  return (
    <div className="fixed inset-4 sm:inset-auto sm:bottom-20 sm:right-4 sm:w-[420px] sm:max-h-[600px] bg-zinc-900 border border-zinc-700 rounded-2xl flex flex-col z-30 shadow-2xl shadow-black/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-4 h-4 text-zinc-400" />
          <span className="font-medium text-zinc-200 text-sm">Settings</span>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Device Info */}
        <section className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
          <div className="flex items-center gap-2 mb-3">
            <Wifi className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-zinc-300">Device</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Hostname</span>
              <span className="text-zinc-300 font-mono">{systemInfo.hostname}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">IP Address</span>
              <span className="text-zinc-300 font-mono">{systemInfo.ip}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Ollama</span>
              <span className={systemInfo.ollamaOnline ? "text-emerald-400" : "text-zinc-500"}>
                {systemInfo.ollamaOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </section>

        {/* Agent Info */}
        <section className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
          <h3 className="text-sm font-semibold text-zinc-300 mb-3">Your Agent</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Name</span>
              <span className="text-zinc-200 font-medium">{agentState.agentName || "Not set"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Your name</span>
              <span className="text-zinc-200">{agentState.userName || "Not set"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Brain</span>
              <span className="text-zinc-200 capitalize">
                {agentState.modelProvider === "local" ? `Local (${agentState.localModel})` : agentState.cloudProvider || "Not set"}
              </span>
            </div>
          </div>
        </section>

        {/* OpenClaw Gateway — always visible */}
        <section className={`rounded-xl p-4 border ${agentState.gatewayRunning ? "bg-emerald-950/20 border-emerald-800/40" : "bg-zinc-800/50 border-zinc-700/50"}`}>
          <div className="flex items-center gap-2 mb-2">
            <Activity className={`w-4 h-4 ${agentState.gatewayRunning ? "text-emerald-400" : "text-orange-400"}`} />
            <h3 className="text-sm font-semibold text-zinc-300">{"🦞"} OpenClaw Gateway</h3>
          </div>
          <p className="text-xs text-zinc-500 mb-3">
            Agent orchestration engine — multi-step workflows, tool use, and real-time streaming.
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${agentState.gatewayRunning ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`} />
              <p className={`text-sm font-medium ${agentState.gatewayRunning ? "text-emerald-400" : "text-zinc-500"}`}>
                {agentState.gatewayRunning ? "Running" : "Stopped"}
              </p>
            </div>
            <button
              onClick={handleToggle}
              disabled={toggling || !systemInfo.openclawInstalled}
              title={!systemInfo.openclawInstalled ? "OpenClaw CLI not installed" : undefined}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                agentState.gatewayRunning
                  ? "bg-zinc-700 text-zinc-400 hover:bg-zinc-600"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              } disabled:opacity-50`}
            >
              {toggling ? "..." : agentState.gatewayRunning ? "Stop" : "Start"}
            </button>
          </div>
          {!systemInfo.openclawInstalled && (
            <p className="text-xs text-amber-500/70 mt-2">
              OpenClaw CLI not installed. Install it to enable the gateway.
            </p>
          )}
        </section>

        {/* SSH Configuration */}
        <section className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-zinc-300">SSH Access</h3>
          </div>
          <p className="text-xs text-zinc-500 mb-3">Configure SSH to remotely manage this Pi.</p>
          <div className="space-y-2">
            <input
              type="text"
              value={sshHost}
              onChange={(e) => setSshHost(e.target.value)}
              placeholder="Host (e.g. 192.168.1.100 or my-pi.local)"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-sm"
            />
            <input
              type="text"
              value={sshUser}
              onChange={(e) => setSshUser(e.target.value)}
              placeholder="Username (e.g. pi)"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-sm"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveSsh}
                disabled={!sshHost.trim()}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white transition-colors"
              >
                {sshSaved ? "Saved!" : "Save"}
              </button>
              {sshHost && sshUser && (
                <code className="text-xs text-zinc-500 font-mono truncate flex-1">
                  ssh {sshUser}@{sshHost}
                </code>
              )}
            </div>
          </div>
        </section>

        {/* Advanced Mode Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between px-4 py-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <span className="font-medium">Advanced</span>
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvanced && (
          <>
            {/* Reset */}
            <section className="bg-zinc-800/50 rounded-xl p-4 border border-red-900/20">
              <div className="flex items-center gap-2 mb-3">
                <Trash2 className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-semibold text-zinc-300">Start Over</h3>
              </div>
              <p className="text-xs text-zinc-500 mb-3">
                Reset everything. Useful when handing this Pi to another person.
              </p>
              {!confirmReset ? (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-zinc-700 text-red-400 hover:bg-red-900/30 transition-all"
                >
                  Reset Everything
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-red-950/30 rounded-lg p-3 border border-red-900/30">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-xs text-red-300 flex-1">Cannot be undone.</p>
                  <button onClick={handleReset} className="px-2 py-1 rounded-lg bg-red-600 text-white text-xs hover:bg-red-500">
                    Confirm
                  </button>
                  <button onClick={() => setConfirmReset(false)} className="px-2 py-1 rounded-lg bg-zinc-700 text-zinc-400 text-xs hover:bg-zinc-600">
                    Cancel
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
