import { useState } from "react";
import { Check, Briefcase, Palette, Code, BookOpen, Star, Zap } from "lucide-react";
import type { AgentState } from "../App";
import { api } from "../lib/api";

interface Props {
  agentState: AgentState;
  updateState: (u: Partial<AgentState>) => void;
  unlockAchievement: (id: string, xp: number) => void;
}

const SKILLS: { id: string; name: string; desc: string; icon: typeof Briefcase; color: string; capabilities: string[]; comingSoon?: boolean }[] = [
  {
    id: "chief-of-staff",
    name: "Personal Chief of Staff",
    desc: "Your agent handles email triage, task management, calendar scheduling, and relationship tracking. Like having an executive assistant who never sleeps.",
    icon: Briefcase,
    color: "from-blue-600 to-indigo-600",
    capabilities: ["Email triage & drafting", "Task management", "Calendar coordination", "Relationship CRM", "Proactive reminders", "Meeting prep"],
  },
  {
    id: "marketing-operator",
    name: "Content & Marketing",
    desc: "Your agent creates content calendars, drafts social posts, tracks audience growth, and manages your brand voice across channels.",
    icon: Palette,
    color: "from-pink-600 to-rose-600",
    capabilities: ["Content calendar", "Social drafting", "Audience analytics", "Copy generation", "Brand voice", "Campaign planning"],
  },
  {
    id: "dev-assistant",
    name: "Dev Companion",
    desc: "Your agent reviews code, generates documentation, monitors deployments, and handles technical research so you can focus on building.",
    icon: Code,
    color: "from-emerald-600 to-teal-600",
    capabilities: ["Code review", "Documentation", "Deploy monitoring", "Bug triage", "Tech research", "PR summaries"],
    comingSoon: true,
  },
  {
    id: "research-analyst",
    name: "Research Partner",
    desc: "Your agent conducts deep research, competitive analysis, and knowledge synthesis. Perfect for staying informed and making better decisions.",
    icon: BookOpen,
    color: "from-purple-600 to-violet-600",
    capabilities: ["Deep research", "Competitive analysis", "Market reports", "Knowledge synthesis", "Citation tracking", "Briefing generation"],
    comingSoon: true,
  },
  {
    id: "blank",
    name: "Start Fresh",
    desc: "Build your agent's skill set from scratch. Full control over what your agent can do and how it behaves.",
    icon: Star,
    color: "from-zinc-600 to-zinc-700",
    capabilities: ["Custom persona", "Full flexibility", "Build from scratch"],
  },
];

export default function Templates({ agentState, updateState, unlockAchievement }: Props) {
  const [installing, setInstalling] = useState<string | null>(null);

  const handleInstall = async (skillId: string) => {
    setInstalling(skillId);

    const res = await api.updateTemplate(skillId);

    if (res.ok && res.data.state) {
      updateState({
        templateId: skillId,
        completedSteps: [...new Set([...agentState.completedSteps, "template"])],
      });
      if (!agentState.achievements.includes("template-chosen")) {
        unlockAchievement("template-chosen", 20);
      }
    }
    setInstalling(null);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-bold text-zinc-100">Skills</h1>
        </div>
        <p className="text-zinc-400">What should your agent be great at? Pick a skill set to get started.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {SKILLS.map((skill) => {
          const Icon = skill.icon;
          const isActive = agentState.templateId === skill.id;
          const isInstalling = installing === skill.id;
          return (
            <div
              key={skill.id}
              className={`bg-zinc-900 border rounded-xl overflow-hidden transition-all ${
                isActive ? "border-orange-500/50" : "border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${skill.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-100">{skill.name}</h3>
                    </div>
                  </div>
                  {isActive && (
                    <span className="flex items-center gap-1 text-xs bg-orange-500/20 text-orange-400 rounded-full px-2 py-1">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>

                <p className="text-sm text-zinc-400 mb-4">{skill.desc}</p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {skill.capabilities.map((c) => (
                    <span key={c} className="text-xs bg-zinc-800 text-zinc-400 rounded-md px-2 py-1">{c}</span>
                  ))}
                </div>

                <button
                  onClick={() => handleInstall(skill.id)}
                  disabled={isActive || isInstalling || skill.comingSoon}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-zinc-800 text-zinc-500 cursor-default"
                      : isInstalling
                      ? "bg-zinc-800 text-zinc-400"
                      : skill.comingSoon
                      ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white"
                  }`}
                >
                  {skill.comingSoon ? "Coming Soon" : isActive ? "Active Skill Set" : isInstalling ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-zinc-500 border-t-zinc-200 rounded-full animate-spin" />
                      Loading skills...
                    </span>
                  ) : "Use This Skill Set"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
