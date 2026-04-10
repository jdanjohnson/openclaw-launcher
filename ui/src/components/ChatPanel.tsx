import { useState, useRef, useEffect } from "react";
import { Send, X, Cpu } from "lucide-react";
import { api } from "../lib/api";

interface Message {
  role: "user" | "agent";
  text: string;
  provider?: string;
  tokensPerSec?: string | null;
}

interface Props {
  agentName: string;
  onClose: () => void;
  onMoodChange: (mood: string) => void;
}

export default function ChatPanel({ agentName, onClose, onMoodChange }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "agent", text: `Hey! I'm ${agentName}. What's on your mind?` },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setSending(true);
    onMoodChange("thinking");

    const res = await api.chat(text);

    if (res.ok) {
      onMoodChange("talking");
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: res.data.response,
          provider: res.data.provider,
          tokensPerSec: res.data.tokens_per_second,
        },
      ]);
      setTimeout(() => onMoodChange("happy"), 2000);
    } else {
      setMessages((prev) => [
        ...prev,
        { role: "agent", text: "Hmm, something went wrong. Try again?" },
      ]);
      onMoodChange("idle");
    }

    setSending(false);
  };

  return (
    <div className="fixed inset-4 sm:inset-auto sm:bottom-20 sm:right-4 sm:w-[420px] sm:h-[560px] bg-zinc-900 border border-zinc-700 rounded-2xl flex flex-col z-30 shadow-2xl shadow-black/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium text-zinc-200 text-sm">
            Chat with {agentName}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-orange-600 text-white rounded-br-md"
                  : "bg-zinc-800 text-zinc-200 rounded-bl-md"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
              {msg.provider && msg.role === "agent" && (
                <div className="flex items-center gap-1 mt-1.5 text-xs opacity-50">
                  <Cpu className="w-3 h-3" />
                  <span>
                    {msg.provider === "local"
                      ? `Local${msg.tokensPerSec ? ` · ${msg.tokensPerSec} tok/s` : ""}`
                      : msg.provider === "demo"
                      ? "Demo mode"
                      : "Cloud"}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-zinc-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={`Message ${agentName}...`}
            disabled={sending}
            autoFocus
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="px-3 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
