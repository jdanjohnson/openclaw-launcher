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
  const [activePanel, setActivePanel] = useState<"inspiration" | "skills" | "fleet" | null>(null);

  return (
    <div className="fixed inset-0 bg-mesh flex flex-col overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-[rgba(242,84,31,0.06)] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full bg-[rgba(242,84,31,0.04)] blur-[100px] pointer-events-none" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[rgb(242,84,31)] to-[rgb(200,50,10)] flex items-center justify-center shadow-[0_0_20px_rgba(242,84,31,0.25)]">
            <span className="text-lg">{"\uD83E\uDD9E"}</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">Atomic Claw</h1>
            <p className="text-xs text-gray-400">powered by OpenClaw</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 font-medium">Welcome, {userName}</span>
          <button onClick={onOpenSettings} className="w-10 h-10 rounded-xl bg-white/50 hover:bg-white/70 border border-white/60 flex items-center justify-center transition-all hover:scale-105">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 pb-28">
        {/* Agent greeting */}
        <div className="text-center mb-14 animate-fade-up">
          <div className="w-28 h-28 rounded-[28px] bg-gradient-to-br from-[rgb(242,84,31)] to-[rgb(200,50,10)] flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(242,84,31,0.25)] glow-accent animate-float">
            <span className="text-5xl">{"\uD83E\uDD9E"}</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">{agentName}</h2>
          <p className="text-lg text-gray-400">Your context agent is ready</p>
        </div>

        {/* Quick action cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 w-full max-w-4xl">
          {[
            { id: "chat" as const, icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", label: "Chat", desc: "Talk to your agent" },
            { id: "inspiration" as const, icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", label: "Inspiration", desc: "Browse & discover" },
            { id: "skills" as const, icon: "M13 10V3L4 14h7v7l9-11h-7z", label: "Skills", desc: "Team skill library" },
            { id: "fleet" as const, icon: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z", label: "Fleet", desc: "Manage workers" },
          ].map((card, i) => (
            <button
              key={card.id}
              onClick={() => card.id === "chat" ? onOpenChat() : setActivePanel(card.id)}
              className="group p-7 rounded-3xl border-2 border-white/60 bg-white/50 hover:bg-white/70 hover:border-white/80 transition-all duration-300 text-left animate-fade-up hover:scale-[1.03] hover:shadow-lg"
              style={{ animationDelay: `${i * 100}ms`, backdropFilter: "blur(16px)" }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gray-100 group-hover:bg-[rgba(242,84,31,0.1)] flex items-center justify-center mb-4 transition-colors">
                <svg className="w-7 h-7 text-gray-400 group-hover:text-[rgb(242,84,31)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">{card.label}</h3>
              <p className="text-sm text-gray-400">{card.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom dock */}
      <div className="relative z-10 flex justify-center pb-8">
        <div className="glass-sm rounded-2xl px-8 py-4 flex items-center gap-5">
          {[
            { label: "Chat", action: () => onOpenChat() },
            { label: "Inspiration", action: () => setActivePanel("inspiration") },
            { label: "Skills", action: () => setActivePanel("skills") },
            { label: "Fleet", action: () => setActivePanel("fleet") },
            { label: "Settings", action: () => onOpenSettings() },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 rounded-xl hover:bg-white/50 transition-all font-medium"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overlay panels */}
      {activePanel === "inspiration" && <ProjectBrowser onClose={() => setActivePanel(null)} />}
      {activePanel === "skills" && <SkillsBoard onClose={() => setActivePanel(null)} />}
      {activePanel === "fleet" && <FleetManager onClose={() => setActivePanel(null)} />}
    </div>
  );
}
