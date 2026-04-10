import { useState, useEffect } from "react";
import { X, Brain, Cpu, Cloud, Check } from "lucide-react";
import { api } from "../lib/api";
import type { BackendState } from "../lib/api";

interface Props {
  agentState: BackendState;
  onClose: () => void;
  onUpdate: (state: Partial<BackendState>) => void;
}

const CLOUD_PROVIDERS = [
  { id: "google", name: "Google Gemini", tagline: "Best free option" },
  { id: "anthropic", name: "Anthropic Claude", tagline: "Most capable" },
  { id: "openai", name: "OpenAI GPT", tagline: "Most popular" },
];

export default function BrainPanel({ agentState, onClose, onUpdate }: Props) {
  const [ollamaOnline, setOllamaOnline] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<{ name: string }[]>([]);
  const [cloudProvider, setCloudProvider] = useState(agentState.cloudProvider || "");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getOllamaStatus().then((res) => {
      if (res.ok) {
        setOllamaOnline(res.data.online);
        setOllamaModels(res.data.models || []);
      }
    });
  }, []);

  const switchToLocal = async () => {
    setSaving(true);
    const res = await api.switchBrain({ provider: "local" });
    if (res.ok && res.data.state) {
      onUpdate(res.data.state);
    }
    setSaving(false);
  };

  const switchToCloud = async () => {
    if (!cloudProvider || !apiKey.trim()) return;
    setSaving(true);
    const res = await api.switchBrain({
      provider: "cloud",
      cloudProvider,
      apiKey: apiKey.trim(),
    });
    if (res.ok && res.data.state) {
      onUpdate(res.data.state);
    }
    setSaving(false);
  };

  const isLocal = agentState.modelProvider === "local";

  return (
    <div className="fixed inset-4 sm:inset-auto sm:bottom-20 sm:right-4 sm:w-[420px] sm:max-h-[560px] bg-zinc-900 border border-zinc-700 rounded-2xl flex flex-col z-30 shadow-2xl shadow-black/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-blue-400" />
          <span className="font-medium text-zinc-200 text-sm">Brain</span>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Local Ollama */}
        <button
          onClick={switchToLocal}
          disabled={saving}
          className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
            isLocal ? "border-orange-500 bg-zinc-800/80" : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-orange-400" />
              <p className="font-semibold text-zinc-200">Local (Ollama)</p>
            </div>
            {isLocal && <Check className="w-4 h-4 text-orange-500" />}
          </div>
          <p className="text-sm text-zinc-400">Runs on your Pi. Private. No API key needed.</p>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${ollamaOnline ? "bg-emerald-400" : "bg-zinc-600"}`} />
            <span className="text-xs text-zinc-500">
              {ollamaOnline
                ? `Online · ${ollamaModels.length} model${ollamaModels.length !== 1 ? "s" : ""}`
                : "Ollama not running"}
            </span>
          </div>
          {ollamaOnline && ollamaModels.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {ollamaModels.map((m) => (
                <span key={m.name} className="text-xs bg-zinc-800 text-zinc-400 rounded-full px-2 py-0.5">
                  {m.name}
                </span>
              ))}
            </div>
          )}
        </button>

        {/* Cloud */}
        <div
          className={`rounded-xl border-2 p-4 transition-all ${
            !isLocal ? "border-blue-500 bg-zinc-800/80" : "border-zinc-800 bg-zinc-900"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Cloud className="w-4 h-4 text-blue-400" />
            <p className="font-semibold text-zinc-200">Cloud API</p>
            {!isLocal && <Check className="w-4 h-4 text-blue-500 ml-auto" />}
          </div>
          <p className="text-sm text-zinc-400 mb-3">Faster & smarter. Requires an API key.</p>

          <div className="space-y-2">
            {CLOUD_PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => setCloudProvider(p.id)}
                className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition-all ${
                  cloudProvider === p.id
                    ? "border-blue-500 bg-blue-500/10 text-zinc-200"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                <span className="font-medium">{p.name}</span>
                <span className="text-xs text-zinc-500 ml-2">{p.tagline}</span>
              </button>
            ))}
          </div>

          {cloudProvider && (
            <div className="mt-3 space-y-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && switchToCloud()}
                placeholder="Paste your API key"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <button
                onClick={switchToCloud}
                disabled={!apiKey.trim() || saving}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium rounded-lg py-2 text-sm transition-colors"
              >
                {saving ? "Saving..." : "Connect"}
              </button>
              <p className="text-xs text-zinc-600">Stored only on this device.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
