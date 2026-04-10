import { X, Puzzle, Briefcase, TrendingUp, FileText } from "lucide-react";
import type { BackendState } from "../lib/api";
import { api } from "../lib/api";

interface Props {
  agentState: BackendState;
  onClose: () => void;
  onUpdate: (state: Partial<BackendState>) => void;
}

const SKILLS = [
  { id: "chief-of-staff", name: "Chief of Staff", desc: "Calendar, email triage, task management", icon: Briefcase },
  { id: "marketing-operator", name: "Marketing Operator", desc: "Content, social, analytics", icon: TrendingUp },
  { id: "blank", name: "Blank Slate", desc: "Start from scratch, build your own", icon: FileText },
];

export default function SkillsPanel({ agentState, onClose, onUpdate }: Props) {
  const handleSelect = async (templateId: string) => {
    const res = await api.updateTemplate(templateId);
    if (res.ok && res.data.state) {
      onUpdate(res.data.state);
    }
  };

  return (
    <div className="fixed inset-4 sm:inset-auto sm:bottom-20 sm:right-4 sm:w-[420px] sm:max-h-[560px] bg-zinc-900 border border-zinc-700 rounded-2xl flex flex-col z-30 shadow-2xl shadow-black/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Puzzle className="w-4 h-4 text-purple-400" />
          <span className="font-medium text-zinc-200 text-sm">Skills</span>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <p className="text-sm text-zinc-400">Choose a skill pack for your agent. This shapes what it knows how to do.</p>

        {SKILLS.map((skill) => {
          const Icon = skill.icon;
          const isActive = agentState.templateId === skill.id;
          return (
            <button
              key={skill.id}
              onClick={() => handleSelect(skill.id)}
              className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                isActive ? "border-purple-500 bg-zinc-800/80" : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? "bg-purple-500/20" : "bg-zinc-800"}`}>
                  <Icon className={`w-5 h-5 ${isActive ? "text-purple-400" : "text-zinc-400"}`} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-zinc-200">{skill.name}</p>
                  <p className="text-sm text-zinc-500">{skill.desc}</p>
                </div>
              </div>
            </button>
          );
        })}

        <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
          <p className="text-sm text-zinc-400">
            More skills coming soon. Skills define your agent's personality, tools, and workflows.
          </p>
        </div>
      </div>
    </div>
  );
}
