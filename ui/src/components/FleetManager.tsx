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
    queued: "bg-gray-300",
  };

  const priorityColors: Record<string, string> = {
    high: "text-[rgb(242,84,31)]",
    medium: "text-yellow-500",
    low: "text-gray-400",
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl max-h-[85vh] glass rounded-3xl flex flex-col animate-scale-in overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-black/5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Fleet Manager</h2>
            <p className="text-sm text-gray-400 mt-1">Monitor and manage your worker agents</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-1 p-5 border-b border-black/5">
          {(["fleet", "queue", "hardware"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-5 py-2.5 text-sm rounded-xl transition-all capitalize font-medium"
              style={{
                background: tab === t ? "rgba(242,84,31,0.15)" : "transparent",
                color: tab === t ? "rgb(242,84,31)" : "rgba(0,0,0,0.4)",
              }}
            >
              {t === "fleet" ? `Workers (${DEMO_WORKERS.length})` : t === "queue" ? `Queue (${DEMO_QUEUE.length})` : "Order Hardware"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto glass-scroll p-5">
          {tab === "fleet" && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 mb-5">
                {[
                  { label: "Active", value: DEMO_WORKERS.filter((w) => w.status === "active").length, color: "text-emerald-500" },
                  { label: "Idle", value: DEMO_WORKERS.filter((w) => w.status === "idle").length, color: "text-yellow-500" },
                  { label: "Total", value: DEMO_WORKERS.length, color: "text-gray-900" },
                  { label: "Avg Health", value: `${Math.round(DEMO_WORKERS.reduce((a, w) => a + w.health, 0) / DEMO_WORKERS.length)}%`, color: "text-gray-900" },
                ].map((stat) => (
                  <div key={stat.label} className="p-4 rounded-2xl bg-white/50 border-2 border-white/60 text-center" style={{ backdropFilter: "blur(12px)" }}>
                    <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-gray-400 mt-1 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
              {DEMO_WORKERS.map((worker) => (
                <div key={worker.id} className="p-5 rounded-2xl border-2 border-white/60 bg-white/50 hover:bg-white/70 transition-all" style={{ backdropFilter: "blur(12px)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${statusColors[worker.status]}`} />
                      <h3 className="text-base font-bold text-gray-900">{worker.name}</h3>
                      <span className="text-xs px-3 py-1 rounded-full bg-black/5 text-gray-500 capitalize font-medium">{worker.status}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>Up {worker.uptime}</span>
                      <div className="w-20 h-2 bg-black/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${worker.health}%`, background: worker.health > 90 ? "rgb(52,211,153)" : "rgb(242,84,31)" }} />
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 pl-6">{worker.task}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "queue" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-5">Agents planned but not yet deployed. Your context agent helps you plan and prepare these.</p>
              {DEMO_QUEUE.map((agent) => (
                <div key={agent.id} className="p-5 rounded-2xl border-2 border-white/60 bg-white/50 hover:bg-white/70 transition-all flex items-center justify-between" style={{ backdropFilter: "blur(12px)" }}>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-bold text-gray-900">{agent.name}</h3>
                      <span className={`text-xs font-semibold ${priorityColors[agent.priority]} capitalize`}>{agent.priority}</span>
                    </div>
                    <p className="text-sm text-gray-500">{agent.purpose}</p>
                  </div>
                  <button className="btn-glass px-4 py-2 text-sm">Deploy</button>
                </div>
              ))}
              <button className="w-full p-5 rounded-2xl border-2 border-dashed border-black/10 text-base text-gray-400 hover:text-gray-600 hover:border-black/20 transition-all font-medium">
                + Plan new agent
              </button>
            </div>
          )}

          {tab === "hardware" && (
            <div className="space-y-6">
              <div className="glass-sm p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Why dedicated hardware?</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  Each agent in your fleet runs on its own dedicated hardware node. This means your agents are always on, always learning, and never competing for resources. When you spawn a new worker agent, you add a physical node to your fleet — giving that agent its own compute, memory, and storage.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: "\u26A1", label: "Always-on", desc: "24/7 availability without sharing resources" },
                    { icon: "\uD83D\uDD12", label: "Isolated", desc: "Each agent\u2019s data stays on its own hardware" },
                    { icon: "\uD83D\uDE80", label: "Scalable", desc: "Add nodes as your fleet grows" },
                  ].map((b) => (
                    <div key={b.label} className="p-4 rounded-xl bg-white/50 border border-white/60 text-center">
                      <span className="text-2xl">{b.icon}</span>
                      <h4 className="text-sm font-bold text-gray-900 mt-2">{b.label}</h4>
                      <p className="text-xs text-gray-400 mt-1">{b.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { name: "Claw Node", desc: "Compact agent node for single-purpose workers. Pre-loaded with Atomic Claw OS. One hardware unit per agent \u2014 dedicated compute for maximum reliability.", price: "$2,500", specs: "4GB RAM \u00b7 64GB Storage \u00b7 Wi-Fi 6" },
                  { name: "Claw Hub", desc: "Multi-agent hub for running up to 5 workers simultaneously. Ideal for teams scaling their fleet quickly with shared infrastructure.", price: "$2,500", specs: "8GB RAM \u00b7 256GB Storage \u00b7 Ethernet + Wi-Fi" },
                ].map((hw) => (
                  <div key={hw.name} className="p-6 rounded-2xl border-2 border-white/60 bg-white/50 hover:shadow-lg transition-all" style={{ backdropFilter: "blur(12px)" }}>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[rgb(242,84,31)] to-[rgb(200,50,10)] flex items-center justify-center mb-5 shadow-[0_0_24px_rgba(242,84,31,0.2)]">
                      <span className="text-2xl">{"\uD83E\uDD9E"}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{hw.name}</h3>
                    <p className="text-sm text-gray-500 mb-4 leading-relaxed">{hw.desc}</p>
                    <p className="text-xs text-gray-400 mb-5 font-medium">{hw.specs}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black text-gray-900">{hw.price}</span>
                      <button className="btn-accent px-5 py-3 text-sm">Pre-order</button>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400 text-center">
                Each hardware node ships pre-configured and ready to join your fleet. Simply power on, connect to your network, and your context agent will detect and onboard the new node automatically.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
