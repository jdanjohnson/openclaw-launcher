import { useState, useRef, useEffect } from "react";
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
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl h-[85vh] glass rounded-2xl flex flex-col animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[rgb(242,84,31)] to-[rgb(200,50,10)] flex items-center justify-center shadow-[0_0_15px_rgba(242,84,31,0.3)]">
              <span className="text-sm">{"\uD83E\uDD9E"}</span>
            </div>
            <div>
              <span className="font-semibold text-white text-sm">{agentName}</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-white/40">Online</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 glass-scroll">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[rgb(242,84,31)] text-white rounded-br-md"
                    : "bg-white/[0.06] border border-white/5 text-white/90 rounded-bl-md"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                {msg.provider && msg.role === "agent" && (
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-white/30">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                    <span>
                      {msg.provider === "openclaw"
                        ? "\uD83E\uDD9E OpenClaw"
                        : msg.provider === "ollama"
                        ? `Ollama${msg.tokensPerSec ? ` \u00b7 ${msg.tokensPerSec} tok/s` : ""}`
                        : msg.provider === "local"
                        ? `Local${msg.tokensPerSec ? ` \u00b7 ${msg.tokensPerSec} tok/s` : ""}`
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
              <div className="bg-white/[0.06] border border-white/5 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-[rgb(242,84,31)] animate-bounce"
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
        <div className="p-4 border-t border-white/5">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={`Message ${agentName}...`}
              disabled={sending}
              autoFocus
              className="flex-1 glass-input px-4 py-3 text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="btn-accent px-4 py-3 disabled:opacity-30"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
