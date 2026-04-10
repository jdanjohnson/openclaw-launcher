import { MessageCircle, Brain, Puzzle, Settings } from "lucide-react";

export type PanelId = "chat" | "brain" | "skills" | "settings" | null;

interface Props {
  activePanel: PanelId;
  onPanelToggle: (panel: PanelId) => void;
}

const DOCK_ITEMS: { id: PanelId; icon: typeof MessageCircle; label: string }[] = [
  { id: "chat", icon: MessageCircle, label: "Chat" },
  { id: "brain", icon: Brain, label: "Brain" },
  { id: "skills", icon: Puzzle, label: "Skills" },
  { id: "settings", icon: Settings, label: "Settings" },
];

export default function DesktopDock({ activePanel, onPanelToggle }: Props) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20">
      <div className="flex items-center gap-1.5 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 rounded-2xl px-3 py-2 shadow-2xl shadow-black/50">
        {DOCK_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePanel === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPanelToggle(isActive ? null : item.id)}
              className={`group flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                isActive
                  ? "bg-orange-600/20 text-orange-400"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
              title={item.label}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-orange-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
