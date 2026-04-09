import { useState } from "react";
import {
  User,
  Sparkles,
  Brain,
  MessageCircle,
  Rocket,
  Check,
  ArrowRight,
  ArrowLeft,
  QrCode,
  ExternalLink,
} from "lucide-react";
import type { Page, AgentState } from "../App";
import { api } from "../lib/api";

interface Props {
  agentState: AgentState;
  updateState: (u: Partial<AgentState>) => void;
  unlockAchievement: (id: string, xp: number) => void;
  setPage: (p: Page) => void;
}

const STEPS = [
  { id: "about-you", title: "About You", subtitle: "Tell your agent who you are", icon: User },
  { id: "your-world", title: "Your World", subtitle: "What do you work on and care about?", icon: Sparkles },
  { id: "agent-brain", title: "Your Agent's Brain", subtitle: "Pick the AI that powers your assistant", icon: Brain },
  { id: "stay-connected", title: "Stay Connected", subtitle: "Chat with your agent from your phone", icon: MessageCircle },
  { id: "launch", title: "Meet Your Agent", subtitle: "Bring your personal assistant online", icon: Rocket },
];

const ROLES = [
  "Student", "Designer", "Developer", "Marketer",
  "Founder", "Researcher", "Creator", "Consultant",
  "Product Manager", "Writer", "Educator", "Other",
];

const INTERESTS = [
  "Productivity", "AI & Automation", "Design", "Engineering",
  "Marketing", "Content Creation", "Research", "Business Strategy",
  "Social Media", "Data Analysis", "Project Management", "Learning",
];

const COMM_STYLES = [
  { id: "concise", label: "Keep it short", desc: "Bullet points, direct answers, no fluff" },
  { id: "detailed", label: "Give me context", desc: "Explain your reasoning, provide background" },
  { id: "friendly", label: "Be conversational", desc: "Casual tone, like chatting with a friend" },
  { id: "professional", label: "Stay professional", desc: "Formal tone, structured responses" },
];

const AI_BRAINS = [
  {
    id: "google",
    name: "Gemini",
    tagline: "by Google",
    desc: "Fast, free to start, great all-rounder. Recommended for workshops.",
    highlight: "Free tier available",
    getKeyUrl: "https://aistudio.google.com/apikey",
  },
  {
    id: "anthropic",
    name: "Claude",
    tagline: "by Anthropic",
    desc: "Exceptional at reasoning, writing, and nuanced conversations.",
    highlight: "Best for deep work",
    getKeyUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "openai",
    name: "ChatGPT",
    tagline: "by OpenAI",
    desc: "The most widely used AI. Versatile and reliable for everything.",
    highlight: "Most popular",
    getKeyUrl: "https://platform.openai.com/api-keys",
  },
];

const SKILLS: { id: string; name: string; desc: string; comingSoon?: boolean }[] = [
  { id: "chief-of-staff", name: "Personal Chief of Staff", desc: "Email triage, task management, calendar, relationship tracking" },
  { id: "marketing-operator", name: "Content & Marketing", desc: "Content calendar, social posts, audience growth, copywriting" },
  { id: "dev-assistant", name: "Dev Companion", desc: "Code review, docs, deploy monitoring, technical research", comingSoon: true },
  { id: "research-analyst", name: "Research Partner", desc: "Deep research, competitive analysis, knowledge synthesis", comingSoon: true },
  { id: "blank", name: "Start Fresh", desc: "Build your agent's capabilities from scratch" },
];

export default function Onboarding({ agentState, updateState, unlockAchievement, setPage }: Props) {
  const [step, setStep] = useState(Math.min(agentState.currentStep, 4));

  // Step 0: About You
  const [yourName, setYourName] = useState(agentState.userName || "");
  const [agentName, setAgentName] = useState(agentState.agentName);
  const [selectedRole, setSelectedRole] = useState(agentState.userRole || "");

  // Step 1: Your World
  const [selectedInterests, setSelectedInterests] = useState<string[]>(agentState.interests || []);
  const [goals, setGoals] = useState(agentState.goals || "");
  const [commStyle, setCommStyle] = useState(agentState.commStyle || "");

  // Step 2: Agent Brain
  const [selectedBrain, setSelectedBrain] = useState(agentState.apiProvider);
  const [apiKeyInput, setApiKeyInput] = useState("");

  // Step 3: Stay Connected
  const [telegramToken, setTelegramToken] = useState("");
  const [skipTelegram, setSkipTelegram] = useState(false);

  // Loading / error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isCompleted = (idx: number) => agentState.currentStep > idx;

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  // Step 0 -> 1: Save profile to backend
  const handleAboutYou = async () => {
    if (!agentName.trim()) return;
    setLoading(true);
    setError("");

    const res = await api.saveProfile(yourName.trim(), agentName.trim(), selectedRole);

    if (res.ok && res.data.state) {
      updateState({
        userName: yourName.trim(),
        agentName: agentName.trim(),
        userRole: selectedRole,
        currentStep: Math.max(agentState.currentStep, 1),
        completedSteps: [...new Set([...agentState.completedSteps, "about-you"])],
      });
      unlockAchievement("named", 10);
      setStep(1);
    } else {
      setError(res.error || "Failed to save profile");
    }
    setLoading(false);
  };

  // Step 1 -> 2: Save context to backend
  const handleYourWorld = async () => {
    setLoading(true);
    setError("");

    const templateId = agentState.templateId || "chief-of-staff";
    const res = await api.saveContext(selectedInterests, goals, commStyle, templateId);

    if (res.ok && res.data.state) {
      updateState({
        interests: selectedInterests,
        goals,
        commStyle,
        templateId,
        currentStep: Math.max(agentState.currentStep, 2),
        completedSteps: [...new Set([...agentState.completedSteps, "your-world"])],
      });
      unlockAchievement("template-chosen", 20);
      setStep(2);
    } else {
      setError(res.error || "Failed to save context");
    }
    setLoading(false);
  };

  // Step 2 -> 3: Save API key to backend (calls real openclaw CLI)
  const handleBrainConnect = async () => {
    if (!selectedBrain || !apiKeyInput.trim()) return;
    setLoading(true);
    setError("");

    const res = await api.saveApiKey(selectedBrain, apiKeyInput.trim());

    if (res.ok && res.data.state) {
      updateState({
        apiProvider: selectedBrain,
        apiKeySet: true,
        currentStep: Math.max(agentState.currentStep, 3),
        completedSteps: [...new Set([...agentState.completedSteps, "agent-brain"])],
      });
      unlockAchievement("brain-connected", 30);
      setStep(3);
    } else {
      setError(res.error || "Failed to configure AI brain");
    }
    setLoading(false);
  };

  // Step 3 -> 4: Save Telegram (or skip)
  const handleConnected = async () => {
    setLoading(true);
    setError("");

    let res;
    if (skipTelegram || !telegramToken.trim()) {
      res = await api.skipTelegram();
    } else {
      res = await api.saveTelegram(telegramToken.trim());
    }

    if (res.ok && res.data.state) {
      const connected = !skipTelegram && telegramToken.trim().length > 0;
      updateState({
        telegramConnected: connected,
        currentStep: Math.max(agentState.currentStep, 4),
        completedSteps: [...new Set([...agentState.completedSteps, "stay-connected"])],
      });
      if (connected) {
        unlockAchievement("channel-active", 25);
      }
      setStep(4);
    } else {
      setError(res.error || "Failed to set up messaging");
    }
    setLoading(false);
  };

  // Step 4 -> Done: Activate the agent (calls real openclaw restart)
  const handleLaunch = async () => {
    setLoading(true);
    setError("");

    const res = await api.activate();

    if (res.ok && res.data.state) {
      updateState({
        gatewayRunning: res.data.gatewayRunning ?? true,
        currentStep: Math.max(agentState.currentStep, 5),
        completedSteps: [...new Set([...agentState.completedSteps, "launched"])],
      });
      unlockAchievement("gateway-live", 40);
      unlockAchievement("first-message", 50);
      setPage("dashboard");
    } else {
      setError(res.error || "Failed to activate agent");
    }
    setLoading(false);
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-6 mb-2">
              <p className="text-lg text-zinc-200 leading-relaxed">
                You're about to set up your own <span className="text-orange-400 font-semibold">personal AI agent</span> —
                one that runs right here on this device, knows your context, and works for <em>you</em>.
              </p>
              <p className="text-sm text-zinc-500 mt-2">Everything stays private. Your data never leaves this device.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">What's your name?</label>
              <input
                type="text"
                value={yourName}
                onChange={(e) => setYourName(e.target.value)}
                placeholder="Your first name"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Name your agent</label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAboutYou()}
                placeholder="e.g. Tempo, Atlas, Friday, Jarvis..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg"
              />
              <p className="text-xs text-zinc-500 mt-2">This is your assistant's name. Pick something that feels right.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">What best describes you?</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((role) => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedRole === role
                        ? "bg-orange-600 text-white"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              onClick={handleAboutYou}
              disabled={!agentName.trim() || loading}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl py-3.5 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</span>
              ) : (
                <>Continue <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">What are you into? <span className="text-zinc-500">(pick a few)</span></label>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedInterests.includes(interest)
                        ? "bg-orange-600 text-white"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">What do you want your agent to help you with?</label>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="e.g. Help me stay on top of my email, manage my content calendar, research competitors..."
                rows={3}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">How should your agent talk to you?</label>
              <div className="grid grid-cols-1 gap-2">
                {COMM_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setCommStyle(style.id)}
                    className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                      commStyle === style.id
                        ? "border-orange-500 bg-zinc-800/80"
                        : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-zinc-200 text-sm">{style.label}</p>
                        <p className="text-xs text-zinc-500">{style.desc}</p>
                      </div>
                      {commStyle === style.id && <Check className="w-4 h-4 text-orange-500" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">Give your agent a skill set</label>
              <div className="space-y-2">
                {SKILLS.map((skill) => (
                  <button
                    key={skill.id}
                    onClick={() => !skill.comingSoon && updateState({ templateId: skill.id })}
                    disabled={skill.comingSoon}
                    className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                      skill.comingSoon
                        ? "border-zinc-800 bg-zinc-900/50 opacity-60 cursor-not-allowed"
                        : agentState.templateId === skill.id
                        ? "border-orange-500 bg-zinc-800/80"
                        : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-zinc-200 text-sm">{skill.name}{skill.comingSoon && <span className="ml-2 text-xs text-zinc-600">(Coming Soon)</span>}</p>
                        <p className="text-xs text-zinc-500">{skill.desc}</p>
                      </div>
                      {agentState.templateId === skill.id && !skill.comingSoon && <Check className="w-4 h-4 text-orange-500" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(0)} className="px-4 py-3.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleYourWorld}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl py-3.5 flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</span>
                ) : (
                  <>Continue <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5 animate-in fade-in">
            <p className="text-sm text-zinc-400">
              Your agent uses a cloud AI brain for thinking. Choose one below — you can always change it later.
            </p>

            <div className="space-y-3">
              {AI_BRAINS.map((brain) => (
                <button
                  key={brain.id}
                  onClick={() => setSelectedBrain(brain.id)}
                  className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                    selectedBrain === brain.id
                      ? "border-orange-500 bg-zinc-800/80"
                      : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-zinc-200">{brain.name}</p>
                      <span className="text-xs text-zinc-500">{brain.tagline}</span>
                    </div>
                    {selectedBrain === brain.id && <Check className="w-4 h-4 text-orange-500" />}
                  </div>
                  <p className="text-sm text-zinc-400">{brain.desc}</p>
                  <span className="inline-block mt-2 text-xs bg-orange-500/15 text-orange-400 rounded-full px-2 py-0.5">
                    {brain.highlight}
                  </span>
                </button>
              ))}
            </div>

            {selectedBrain && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-zinc-300">Your key</label>
                  <a
                    href={AI_BRAINS.find((b) => b.id === selectedBrain)?.getKeyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300"
                  >
                    Get a free key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleBrainConnect()}
                  placeholder="Paste your key here"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
                />
                <p className="text-xs text-zinc-500">Stored only on this device. Never shared.</p>
              </div>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(1)} className="px-4 py-3.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleBrainConnect}
                disabled={!selectedBrain || !apiKeyInput.trim() || loading}
                className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl py-3.5 flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Connecting...</span>
                ) : (
                  <>Continue <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-in fade-in">
            <p className="text-sm text-zinc-400">
              Connect Telegram so you can chat with your agent from your phone — anywhere, anytime.
            </p>

            {!skipTelegram ? (
              <>
                <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700 space-y-3">
                  <div className="flex items-center gap-3 mb-2">
                    <QrCode className="w-5 h-5 text-sky-400" />
                    <h3 className="text-sm font-semibold text-zinc-200">Quick Setup (2 minutes)</h3>
                  </div>
                  <ol className="text-sm text-zinc-400 space-y-2 list-decimal list-inside">
                    <li>Open Telegram on your phone</li>
                    <li>Search for <span className="font-mono text-sky-400">@BotFather</span> and tap Start</li>
                    <li>Send <span className="font-mono text-sky-400">/newbot</span> — give it a name — copy the token</li>
                  </ol>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Bot token</label>
                  <input
                    type="text"
                    value={telegramToken}
                    onChange={(e) => setTelegramToken(e.target.value)}
                    placeholder="Paste the token from BotFather"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
                  />
                </div>
              </>
            ) : (
              <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700 text-center">
                <p className="text-zinc-400">No worries! You can always add Telegram later in Settings.</p>
                <p className="text-xs text-zinc-500 mt-2">You'll still be able to chat with your agent right here in the workspace.</p>
              </div>
            )}

            <button
              onClick={() => setSkipTelegram(!skipTelegram)}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {skipTelegram ? "Actually, I want to connect Telegram" : "Skip for now — I'll do this later"}
            </button>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(2)} className="px-4 py-3.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleConnected}
                disabled={(!skipTelegram && !telegramToken.trim()) || loading}
                className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl py-3.5 flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Setting up...</span>
                ) : (
                  <>Continue <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8 text-center animate-in fade-in">
            <div className="py-4">
              <div className="relative w-28 h-28 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-600 rounded-3xl animate-pulse opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-600 rounded-3xl flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-zinc-100 mb-3">
                {agentState.agentName} is ready
              </h3>
              <p className="text-zinc-400 max-w-md mx-auto leading-relaxed">
                Your personal AI assistant has been configured with your context, preferences, and skills.
                It runs entirely on this device — private, always on, always yours.
              </p>
            </div>

            <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700 text-left max-w-sm mx-auto">
              <h4 className="text-xs uppercase tracking-wide text-zinc-500 mb-3">Your Agent</h4>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Name</span>
                  <span className="text-zinc-200 font-medium">{agentState.agentName}</span>
                </div>
                {selectedRole && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Built for</span>
                    <span className="text-zinc-200">{selectedRole}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-400">Brain</span>
                  <span className="text-zinc-200">{AI_BRAINS.find((b) => b.id === agentState.apiProvider)?.name || "Configured"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Telegram</span>
                  <span className={agentState.telegramConnected ? "text-emerald-400" : "text-zinc-500"}>
                    {agentState.telegramConnected ? "Connected" : "Skipped"}
                  </span>
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex gap-3 max-w-sm mx-auto">
              <button onClick={() => setStep(3)} className="px-4 py-3.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleLaunch}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:opacity-40 text-white font-bold rounded-xl py-4 flex items-center justify-center gap-2 transition-all text-lg"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Starting {agentState.agentName}...
                  </span>
                ) : (
                  <>
                    <Rocket className="w-5 h-5" /> Launch
                  </>
                )}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 mb-1">
          {step === 0 ? "Welcome" : STEPS[step]?.title}
        </h1>
        <p className="text-zinc-400">
          {step === 0 ? "Let's set up your personal AI agent" : STEPS[step]?.subtitle}
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((s, i) => {
          const completed = isCompleted(i);
          const active = step === i;
          const Icon = s.icon;
          return (
            <div key={s.id} className="flex items-center flex-1">
              <button
                onClick={() => { if (completed || i <= agentState.currentStep) setStep(i); }}
                className={`flex items-center justify-center w-9 h-9 rounded-full shrink-0 transition-all ${
                  completed
                    ? "bg-emerald-600 text-white"
                    : active
                    ? "bg-orange-600 text-white ring-2 ring-orange-400 ring-offset-2 ring-offset-zinc-950"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {completed ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 ${completed ? "bg-emerald-600" : "bg-zinc-800"}`} />
              )}
            </div>
          );
        })}
      </div>

      {renderStep()}
    </div>
  );
}
