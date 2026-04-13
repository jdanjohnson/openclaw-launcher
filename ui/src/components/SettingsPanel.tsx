import { useState } from "react";
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
    <div className="fixed inset-0 z-40 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg max-h-[85vh] glass rounded-3xl flex flex-col animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/5">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-bold text-gray-900 text-base">Settings</span>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 glass-scroll">
          {/* Device Info */}
          <section className="p-5 rounded-2xl bg-white/50 border-2 border-white/60" style={{ backdropFilter: "blur(12px)" }}>
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" />
              </svg>
              <h3 className="text-sm font-bold text-gray-900">Device</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Hostname</span><span className="text-gray-700 font-mono text-xs">{systemInfo.hostname}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">IP Address</span><span className="text-gray-700 font-mono text-xs">{systemInfo.ip}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Ollama</span><span className={systemInfo.ollamaOnline ? "text-emerald-500 text-xs font-medium" : "text-gray-400 text-xs"}>{systemInfo.ollamaOnline ? "Online" : "Offline"}</span></div>
            </div>
          </section>

          {/* Agent Info */}
          <section className="p-5 rounded-2xl bg-white/50 border-2 border-white/60" style={{ backdropFilter: "blur(12px)" }}>
            <h3 className="text-sm font-bold text-gray-900 mb-3">Your Agent</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Name</span><span className="text-gray-700">{agentState.agentName || "Not set"}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Your name</span><span className="text-gray-700">{agentState.userName || "Not set"}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Brain</span><span className="text-gray-700 capitalize">{agentState.modelProvider === "local" ? `Local (${agentState.localModel})` : agentState.cloudProvider || "Not set"}</span></div>
            </div>
          </section>

          {/* OpenClaw Gateway */}
          <section className={`p-5 rounded-2xl border-2 ${agentState.gatewayRunning ? "bg-emerald-50/80 border-emerald-200" : "bg-white/50 border-white/60"}`} style={{ backdropFilter: "blur(12px)" }}>
            <div className="flex items-center gap-2 mb-2">
              <svg className={`w-5 h-5 ${agentState.gatewayRunning ? "text-emerald-500" : "text-[rgb(242,84,31)]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="text-sm font-bold text-gray-900">{"\uD83E\uDD9E"} OpenClaw Gateway</h3>
            </div>
            <p className="text-xs text-gray-400 mb-3">Agent orchestration engine for multi-step workflows and tool use.</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${agentState.gatewayRunning ? "bg-emerald-400 animate-pulse" : "bg-gray-300"}`} />
                <p className={`text-sm font-medium ${agentState.gatewayRunning ? "text-emerald-600" : "text-gray-400"}`}>
                  {agentState.gatewayRunning ? "Running" : "Stopped"}
                </p>
              </div>
              <button
                onClick={handleToggle}
                disabled={toggling || !systemInfo.openclawInstalled}
                title={!systemInfo.openclawInstalled ? "OpenClaw CLI not installed" : undefined}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  agentState.gatewayRunning
                    ? "bg-black/5 text-gray-500 hover:bg-black/10"
                    : "btn-accent"
                } disabled:opacity-30`}
              >
                {toggling ? "..." : agentState.gatewayRunning ? "Stop" : "Start"}
              </button>
            </div>
            {!systemInfo.openclawInstalled && (
              <p className="text-xs text-amber-500 mt-2">OpenClaw CLI not installed. Install to enable gateway.</p>
            )}
          </section>

          {/* SSH Configuration */}
          <section className="p-5 rounded-2xl bg-white/50 border-2 border-white/60" style={{ backdropFilter: "blur(12px)" }}>
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-sm font-bold text-gray-900">SSH Access</h3>
            </div>
            <p className="text-xs text-gray-400 mb-3">Configure remote access to this device.</p>
            <div className="space-y-2">
              <input type="text" value={sshHost} onChange={(e) => setSshHost(e.target.value)} placeholder="Host (e.g. 192.168.1.100)" className="w-full glass-input px-4 py-3 text-sm font-mono" />
              <input type="text" value={sshUser} onChange={(e) => setSshUser(e.target.value)} placeholder="Username (e.g. pi)" className="w-full glass-input px-4 py-3 text-sm font-mono" />
              <div className="flex items-center gap-3">
                <button onClick={handleSaveSsh} disabled={!sshHost.trim()} className="btn-accent px-4 py-2 text-xs disabled:opacity-30">
                  {sshSaved ? "Saved!" : "Save"}
                </button>
                {sshHost && sshUser && (
                  <code className="text-xs text-gray-400 font-mono truncate flex-1">ssh {sshUser}@{sshHost}</code>
                )}
              </div>
            </div>
          </section>

          {/* Advanced */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-white/30 border-2 border-white/40 text-sm text-gray-400 hover:text-gray-600 transition-colors font-medium"
          >
            <span>Advanced</span>
            <svg className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showAdvanced && (
            <section className="p-5 rounded-2xl bg-red-50/80 border-2 border-red-200/60">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Reset Everything</h3>
              <p className="text-xs text-gray-400 mb-3">Wipe all data and start fresh. Cannot be undone.</p>
              {!confirmReset ? (
                <button onClick={() => setConfirmReset(true)} className="px-4 py-2 rounded-xl text-xs bg-black/5 text-red-500 hover:bg-red-50 transition-colors font-medium">
                  Reset Everything
                </button>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-100/60 border border-red-200">
                  <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-xs text-red-600 flex-1">Cannot be undone.</p>
                  <button onClick={handleReset} className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-400">Confirm</button>
                  <button onClick={() => setConfirmReset(false)} className="px-3 py-1.5 rounded-lg bg-black/5 text-gray-500 text-xs hover:bg-black/10">Cancel</button>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
