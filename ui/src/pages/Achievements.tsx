import { Fingerprint, Brain, Puzzle, Send, Power, MessageCircle, Trophy, Zap, Lock } from "lucide-react";
import type { AgentState } from "../App";

interface Props {
  agentState: AgentState;
}

const ALL_ACHIEVEMENTS = [
  { id: "named", title: "Identity Created", description: "Named your AI agent", icon: Fingerprint, xp: 10, color: "from-violet-500 to-purple-600" },
  { id: "template-chosen", title: "Personality Loaded", description: "Chose an agent template", icon: Puzzle, xp: 20, color: "from-blue-500 to-indigo-600" },
  { id: "brain-connected", title: "Brain Connected", description: "Configured an AI provider API key", icon: Brain, xp: 30, color: "from-pink-500 to-rose-600" },
  { id: "channel-active", title: "Channel Open", description: "Connected Telegram bot", icon: Send, xp: 25, color: "from-sky-500 to-cyan-600" },
  { id: "gateway-live", title: "Gateway Live", description: "Your agent is running on the Pi", icon: Power, xp: 40, color: "from-emerald-500 to-teal-600" },
  { id: "first-message", title: "First Contact", description: "Sent your first message to the agent", icon: MessageCircle, xp: 50, color: "from-orange-500 to-red-600" },
];

export default function Achievements({ agentState }: Props) {
  const totalXP = ALL_ACHIEVEMENTS.reduce((sum, a) => sum + a.xp, 0);
  const earnedXP = ALL_ACHIEVEMENTS.filter((a) => agentState.achievements.includes(a.id)).reduce((sum, a) => sum + a.xp, 0);
  const earnedCount = agentState.achievements.length;
  const totalCount = ALL_ACHIEVEMENTS.length;
  const percent = Math.round((earnedXP / totalXP) * 100);

  const levelLabel = agentState.level === 0 ? "Uninitialized" : agentState.level === 1 ? "Novice Agent Operator" : agentState.level === 2 ? "Agent Operator" : "Agent Commander";
  const nextLevel = agentState.level < 3 ? (agentState.level === 0 ? "Novice" : agentState.level === 1 ? "Operator" : "Commander") : null;
  const xpForNext = agentState.level === 0 ? 1 : agentState.level === 1 ? 80 : agentState.level === 2 ? 175 : totalXP;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 mb-1">Achievements</h1>
        <p className="text-zinc-400">Track your progress setting up your agent</p>
      </div>

      {/* XP Overview Card */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-zinc-100">{levelLabel}</p>
              <p className="text-sm text-zinc-400">Level {agentState.level}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-amber-400">{earnedXP}</p>
            <p className="text-xs text-zinc-500">/ {totalXP} XP</p>
          </div>
        </div>

        {/* XP Bar */}
        <div className="h-3 bg-zinc-700 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-700"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-500">
          <span>{earnedCount} / {totalCount} achievements</span>
          {nextLevel && <span>{xpForNext - earnedXP} XP to {nextLevel}</span>}
        </div>
      </div>

      {/* Achievement Grid */}
      <div className="space-y-3">
        {ALL_ACHIEVEMENTS.map((a) => {
          const unlocked = agentState.achievements.includes(a.id);
          const Icon = a.icon;
          return (
            <div
              key={a.id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                unlocked
                  ? "bg-zinc-900 border-zinc-700"
                  : "bg-zinc-900/50 border-zinc-800/50 opacity-50"
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                unlocked ? `bg-gradient-to-br ${a.color}` : "bg-zinc-800"
              }`}>
                {unlocked ? (
                  <Icon className="w-6 h-6 text-white" />
                ) : (
                  <Lock className="w-5 h-5 text-zinc-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold ${unlocked ? "text-zinc-100" : "text-zinc-500"}`}>{a.title}</p>
                <p className="text-sm text-zinc-500">{a.description}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Zap className={`w-4 h-4 ${unlocked ? "text-amber-400" : "text-zinc-700"}`} />
                <span className={`text-sm font-bold ${unlocked ? "text-amber-400" : "text-zinc-700"}`}>+{a.xp}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
