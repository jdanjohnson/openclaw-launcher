import { useState } from "react";

interface WorkerAgent {
  id: string;
  name: string;
  status: "active" | "idle" | "building" | "queued";
  task: string;
  uptime: string;
  lastActive: string;
  health: number;
}

interface QueuedAgent {
  id: string;
  name: string;
  purpose: string;
  priority: "high" | "medium" | "low";
}

const DEMO_WORKERS: WorkerAgent[] = [
  { id: "w1", name: "Sales-Bot", status: "active", task: "Processing 12 new leads from LinkedIn campaign", uptime: "4d 12h", lastActive: "Just now", health: 98 },
  { id: "w2", name: "Doc-Writer", status: "active", task: "Generating API docs for v2.3 release", uptime: "2d 6h", lastActive: "2 min ago", health: 95 },
  { id: "w3", name: "Data-Monitor", status: "idle", task: "Waiting for next scheduled scan (in 3h)", uptime: "12d 3h", lastActive: "3h ago", health: 100 },
  { id: "w4", name: "Support-Triage", status: "active", task: "Categorizing 8 incoming tickets", uptime: "7d 18h", lastActive: "Just now", health: 92 },
];

const DEMO_QUEUE: QueuedAgent[] = [
  { id: "q1", name: "Social-Scheduler", purpose: "Automate social media posting across platforms", priority: "high" },
  { id: "q2", name: "Invoice-Processor", purpose: "Extract and reconcile invoice data from email", priority: "medium" },
  { id: "q3", name: "Onboarding-Helper", purpose: "Guide new team members through setup and training", priority: "low" },
];

interface Props {
  onClose: () => void;
}

export default function FleetManager({ onClose }: Props) {
  const [tab, setTab] = useState<"fleet" | "queue" | "hardware">("fleet");

  const statusColors: Record<string, string> = {
    active: "bg-emerald-400",
    idle: "bg-yellow-400",
    building: "bg-blue-400",
    queued: "bg-white/30",
  };

  const priorityColors: Record<string, string> = {
    high: "text-[rgb(242,84,31)]",
    medium: "text-yellow-400",
    low: "text-white/40",
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl max-h-[85vh] glass rounded-2xl flex flex-col animate-scale-in overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h2 className="text-lg font-semibold text-white">Fleet Manager</h2>
            <p className="text-xs text-white/40 mt-0.5">Monitor and manage your worker agents</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-1 p-4 border-b border-white/5">
          {(["fleet", "queue", "hardware"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 text-xs rounded-lg transition-all capitalize"
              style={{
                background: tab === t ? "rgba(242,84,31,0.2)" : "transparent",
                color: tab === t ? "rgb(242,84,31)" : "rgba(255,255,255,0.4)",
              }}
            >
              {t === "fleet" ? `Workers (${DEMO_WORKERS.length})` : t === "queue" ? `Queue (${DEMO_QUEUE.length})` : "Order Hardware"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto glass-scroll p-4">
          {tab === "fleet" && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Active", value: DEMO_WORKERS.filter((w) => w.status === "active").length, color: "text-emerald-400" },
                  { label: "Idle", value: DEMO_WORKERS.filter((w) => w.status === "idle").length, color: "text-yellow-400" },
                  { label: "Total", value: DEMO_WORKERS.length, color: "text-white" },
                  { label: "Avg Health", value: `${Math.round(DEMO_WORKERS.reduce((a, w) => a + w.health, 0) / DEMO_WORKERS.length)}%`, color: "text-white" },
                ].map((stat) => (
                  <div key={stat.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                    <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-[10px] text-white/30 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
              {DEMO_WORKERS.map((worker) => (
                <div key={worker.id} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${statusColors[worker.status]}`} />
                      <h3 className="text-sm font-semibold text-white">{worker.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30 capitalize">{worker.status}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/30">
                      <span>Up {worker.uptime}</span>
                      <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${worker.health}%`, background: worker.health > 90 ? "rgb(52,211,153)" : "rgb(242,84,31)" }} />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-white/40 pl-5">{worker.task}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "queue" && (
            <div className="space-y-3">
              <p className="text-xs text-white/40 mb-4">Agents planned but not yet deployed. Your context agent helps you plan and prepare these.</p>
              {DEMO_QUEUE.map((agent) => (
                <div key={agent.id} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-white">{agent.name}</h3>
                      <span className={`text-[10px] ${priorityColors[agent.priority]} capitalize`}>{agent.priority}</span>
                    </div>
                    <p className="text-xs text-white/40">{agent.purpose}</p>
                  </div>
                  <button className="btn-glass px-3 py-1.5 text-xs">Deploy</button>
                </div>
              ))}
              <button className="w-full p-4 rounded-xl border border-dashed border-white/10 text-sm text-white/30 hover:text-white/50 hover:border-white/20 transition-all">
                + Plan new agent
              </button>
            </div>
          )}

          {tab === "hardware" && (
            <div className="space-y-4">
              <p className="text-xs text-white/40 mb-4">Order pre-configured agent hardware that arrives ready to connect to your fleet.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "Claw Node", desc: "Compact agent node for single-purpose workers. Pre-loaded with Atomic Claw OS.", price: "$149", specs: "4GB RAM \u00b7 64GB Storage \u00b7 Wi-Fi 6" },
                  { name: "Claw Hub", desc: "Multi-agent hub for running up to 5 workers simultaneously.", price: "$399", specs: "8GB RAM \u00b7 256GB Storage \u00b7 Ethernet + Wi-Fi" },
                ].map((hw) => (
                  <div key={hw.name} className="p-5 rounded-xl border border-white/5 bg-white/[0.02]">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[rgb(242,84,31)] to-[rgb(200,50,10)] flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(242,84,31,0.2)]">
                      <span className="text-xl">{"\uD83E\uDD9E"}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1">{hw.name}</h3>
                    <p className="text-xs text-white/40 mb-3">{hw.desc}</p>
                    <p className="text-[10px] text-white/30 mb-4">{hw.specs}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-white">{hw.price}</span>
                      <button className="btn-accent px-4 py-2 text-xs">Pre-order</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
