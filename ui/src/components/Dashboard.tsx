import { useState } from "react";
import ProjectBrowser from "./ProjectBrowser";
import SkillsBoard from "./SkillsBoard";
import FleetManager from "./FleetManager";

interface Props {
  agentName: string;
  userName: string;
  onOpenChat: () => void;
  onOpenSettings: () => void;
}

export default function Dashboard({ agentName, userName, onOpenChat, onOpenSettings }: Props) {
  const [activePanel, setActivePanel] = useState<"projects" | "skills" | "fleet" | null>(null);

  return (
    <div className="fixed inset-0 bg-black bg-mesh flex flex-col overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-[rgba(242,84,31,0.04)] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full bg-[rgba(242,84,31,0.03)] blur-[100px] pointer-events-none" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[rgb(242,84,31)] to-[rgb(200,50,10)] flex items-center justify-center shadow-[0_0_15px_rgba(242,84,31,0.3)]">
            <span className="text-sm">{"\uD83E\uDD9E"}</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">Atomic Claw</h1>
            <p className="text-[10px] text-white/30">powered by OpenClaw</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/30">Welcome, {userName}</span>
          <button onClick={onOpenSettings} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-24">
        {/* Agent greeting */}
        <div className="text-center mb-12 animate-fade-up">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[rgb(242,84,31)] to-[rgb(200,50,10)] flex items-center justify-center mx-auto mb-4 shadow-[0_0_40px_rgba(242,84,31,0.3)] glow-accent">
            <span className="text-3xl">{"\uD83E\uDD9E"}</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">{agentName}</h2>
          <p className="text-sm text-white/40">Your context agent is ready</p>
        </div>

        {/* Quick action cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
          {[
            { id: "chat" as const, icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", label: "Chat", desc: "Talk to your agent" },
            { id: "projects" as const, icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z", label: "Projects", desc: "Browse & discover" },
            { id: "skills" as const, icon: "M13 10V3L4 14h7v7l9-11h-7z", label: "Skills", desc: "Team skill library" },
            { id: "fleet" as const, icon: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z", label: "Fleet", desc: "Manage workers" },
          ].map((card, i) => (
            <button
              key={card.id}
              onClick={() => card.id === "chat" ? onOpenChat() : setActivePanel(card.id)}
              className="group p-5 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300 text-left animate-fade-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.05] group-hover:bg-[rgba(242,84,31,0.1)] flex items-center justify-center mb-3 transition-colors">
                <svg className="w-5 h-5 text-white/40 group-hover:text-[rgb(242,84,31)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white mb-0.5">{card.label}</h3>
              <p className="text-[10px] text-white/30">{card.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom dock */}
      <div className="relative z-10 flex justify-center pb-6">
        <div className="glass-sm rounded-2xl px-6 py-3 flex items-center gap-4">
          {[
            { label: "Chat", action: () => onOpenChat() },
            { label: "Projects", action: () => setActivePanel("projects") },
            { label: "Skills", action: () => setActivePanel("skills") },
            { label: "Fleet", action: () => setActivePanel("fleet") },
            { label: "Settings", action: () => onOpenSettings() },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="px-3 py-1.5 text-xs text-white/40 hover:text-white rounded-lg hover:bg-white/5 transition-all"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overlay panels */}
      {activePanel === "projects" && <ProjectBrowser onClose={() => setActivePanel(null)} />}
      {activePanel === "skills" && <SkillsBoard onClose={() => setActivePanel(null)} />}
      {activePanel === "fleet" && <FleetManager onClose={() => setActivePanel(null)} />}
    </div>
  );
}
