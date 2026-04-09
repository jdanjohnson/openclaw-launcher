import {
  LayoutDashboard,
  Rocket,
  MessageCircle,
  Zap as SkillsIcon,
  Trophy,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Zap,
  Sparkles,
} from "lucide-react";
import type { Page, AgentState } from "../App";

interface SidebarProps {
  currentPage: Page;
  setPage: (page: Page) => void;
  agentState: AgentState;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

const NAV_ITEMS: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "onboarding", label: "Setup", icon: Rocket },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "templates", label: "Skills", icon: SkillsIcon },
  { id: "achievements", label: "Achievements", icon: Trophy },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export default function Sidebar({ currentPage, setPage, agentState, collapsed, setCollapsed }: SidebarProps) {
  const levelLabel = agentState.level === 0 ? "Uninitialized" : agentState.level === 1 ? "Novice" : agentState.level === 2 ? "Operator" : "Commander";
  const xpPercent = agentState.maxXp > 0 ? Math.round((agentState.xp / agentState.maxXp) * 100) : 0;

  return (
    <aside
      className={`${collapsed ? "w-16" : "w-64"} flex flex-col border-r border-zinc-800 bg-zinc-900 transition-all duration-200 shrink-0`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-zinc-800">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
          {agentState.gatewayRunning && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-zinc-900" />
          )}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-100 truncate">
              {agentState.agentName || "OpenClaw Agent"}
            </p>
            <p className="text-xs text-zinc-500">{levelLabel}</p>
          </div>
        )}
      </div>

      {/* XP Bar */}
      {!collapsed && agentState.xp > 0 && (
        <div className="px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              {agentState.xp} / {agentState.maxXp} XP
            </span>
            <span className="text-xs text-zinc-500">Lvl {agentState.level}</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = currentPage === item.id;
          const Icon = item.icon;
          const hasNotif = item.id === "onboarding" && agentState.currentStep < 5;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                active
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {hasNotif && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center py-3 border-t border-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
