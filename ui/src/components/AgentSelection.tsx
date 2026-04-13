import { useState } from "react";

interface Props {
  onSelect: (type: "context" | "worker") => void;
}

export default function AgentSelection({ onSelect }: Props) {
  const [hovered, setHovered] = useState<"context" | "worker" | null>(null);

  return (
    <div className="fixed inset-0 bg-mesh flex items-center justify-center z-50 overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[rgba(242,84,31,0.08)] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[rgba(242,84,31,0.05)] blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-12 px-8 max-w-4xl w-full">
        {/* Header */}
        <div className="text-center animate-fade-up">
          <div className="flex items-center justify-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[rgb(242,84,31)] to-[rgb(200,50,10)] flex items-center justify-center shadow-[0_0_40px_rgba(242,84,31,0.3)] animate-bounce-slow">
              <span className="text-3xl">🦞</span>
            </div>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-3">Atomic Claw</h1>
          <p className="text-lg text-gray-400">Choose your agent type to get started</p>
        </div>

        {/* Selection cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full animate-fade-up" style={{ animationDelay: "200ms" }}>
          {/* Context Agent */}
          <button
            onClick={() => onSelect("context")}
            onMouseEnter={() => setHovered("context")}
            onMouseLeave={() => setHovered(null)}
            className="group relative text-left p-8 rounded-3xl border-2 transition-all duration-300 cursor-pointer"
            style={{
              background: hovered === "context"
                ? "rgba(242, 84, 31, 0.08)"
                : "rgba(255, 255, 255, 0.55)",
              backdropFilter: "blur(24px)",
              borderColor: hovered === "context"
                ? "rgba(242, 84, 31, 0.4)"
                : "rgba(255, 255, 255, 0.7)",
              boxShadow: hovered === "context"
                ? "0 8px 40px rgba(242, 84, 31, 0.15)"
                : "0 8px 32px rgba(0, 0, 0, 0.06)",
            }}
          >
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[rgb(242,84,31)] to-[rgb(200,50,10)] flex items-center justify-center flex-shrink-0 shadow-[0_0_24px_rgba(242,84,31,0.2)] group-hover:shadow-[0_0_40px_rgba(242,84,31,0.4)] transition-shadow group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Context Agent</h3>
                <p className="text-base text-gray-500 leading-relaxed">
                  Your main agent — houses your IP, ideas, and helps you plan and manage your entire agent fleet.
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 text-sm text-[rgb(242,84,31)] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Get started</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </button>

          {/* Worker Agent */}
          <button
            onClick={() => onSelect("worker")}
            onMouseEnter={() => setHovered("worker")}
            onMouseLeave={() => setHovered(null)}
            className="group relative text-left p-8 rounded-3xl border-2 transition-all duration-300 cursor-pointer"
            style={{
              background: hovered === "worker"
                ? "rgba(255, 255, 255, 0.7)"
                : "rgba(255, 255, 255, 0.55)",
              backdropFilter: "blur(24px)",
              borderColor: hovered === "worker"
                ? "rgba(0, 0, 0, 0.15)"
                : "rgba(255, 255, 255, 0.7)",
              boxShadow: hovered === "worker"
                ? "0 8px 40px rgba(0, 0, 0, 0.1)"
                : "0 8px 32px rgba(0, 0, 0, 0.06)",
            }}
          >
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Worker Agent</h3>
                <p className="text-base text-gray-500 leading-relaxed">
                  A focused node with a specific use case — like an IC with a dedicated assignment on your team.
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 text-sm text-gray-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Get started</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </button>
        </div>

        {/* Skip / Demo */}
        <button
          onClick={() => onSelect("context")}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors animate-fade-up font-medium"
          style={{ animationDelay: "400ms" }}
        >
          Skip to demo →
        </button>
      </div>
    </div>
  );
}
