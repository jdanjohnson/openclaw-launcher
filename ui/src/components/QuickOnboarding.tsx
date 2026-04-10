import { useState } from "react";
import { Sparkles } from "lucide-react";
import { api } from "../lib/api";
import type { BackendState } from "../lib/api";

interface Props {
  onComplete: (state: BackendState) => void;
}

export default function QuickOnboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [userName, setUserName] = useState("");
  const [agentName, setAgentName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!agentName.trim()) return;
    setLoading(true);
    const res = await api.onboard(userName.trim(), agentName.trim());
    if (res.ok) {
      onComplete(res.data.state);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-40">
      <div className="w-full max-w-md p-8">
        {step === 0 ? (
          <div className="space-y-6 animate-in fade-in">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-100">Welcome to Stationed Agents</h1>
              <p className="text-zinc-400 mt-2 text-sm">Your personal AI lives here. Powered by {"\uD83E\uDD9E"}OpenClaw.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                What should I call you?
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && userName.trim() && setStep(1)}
                placeholder="Your name"
                autoFocus
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg"
              />
            </div>

            <button
              onClick={() => setStep(1)}
              disabled={!userName.trim()}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl py-3.5 transition-all text-lg"
            >
              Next
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-zinc-100">
                Hey {userName}! Name your agent.
              </h1>
              <p className="text-zinc-400 mt-2 text-sm">
                This is the AI that lives on your device. Give it a personality.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Agent name
              </label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && agentName.trim() && handleSubmit()}
                placeholder="e.g. Jarvis, Luna, Tempo..."
                autoFocus
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!agentName.trim() || loading}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl py-4 transition-all text-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Waking up {agentName}...
                </span>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" /> Let's go
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
