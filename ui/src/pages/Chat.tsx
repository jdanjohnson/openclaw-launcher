import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import type { AgentState } from "../App";

interface Props {
  agentState: AgentState;
}

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
}

const DEMO_RESPONSES = [
  "Hey there! I'm your personal AI agent running right here on your Raspberry Pi. What can I help you with?",
  "I can help with task management, research, scheduling, and much more. Since I'm running locally on your Pi, everything stays private.",
  "Great question! I'm connected to cloud AI models for reasoning, but all my orchestration happens right here on your hardware. Your conversations and data never leave unless you choose to share them.",
  "I can help you set up automations, manage your tasks, draft content, analyze data, and coordinate across your connected channels. Think of me as your personal chief of staff.",
  "Sure! Try asking me to help plan something, research a topic, or just have a conversation. I'm here 24/7 on your Pi.",
];

export default function Chat({ agentState }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "agent",
      content: `Hi! I'm ${agentState.agentName || "your agent"}. I'm running on your Raspberry Pi and ready to help. What would you like to do?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const responseIdx = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // In production, this would hit the OpenClaw gateway WebSocket
    // For now, use demo responses
    setTimeout(() => {
      const response = DEMO_RESPONSES[responseIdx.current % DEMO_RESPONSES.length];
      responseIdx.current++;
      const agentMsg: Message = {
        id: `agent-${Date.now()}`,
        role: "agent",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMsg]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            {agentState.gatewayRunning && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-zinc-900" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100">{agentState.agentName || "Agent"}</p>
            <p className="text-xs text-zinc-500">
              {agentState.gatewayRunning ? "Online — running on your Pi" : "Demo mode — complete setup to go live"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              msg.role === "agent"
                ? "bg-gradient-to-br from-orange-500 to-red-600"
                : "bg-zinc-700"
            }`}>
              {msg.role === "agent" ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-zinc-300" />}
            </div>
            <div className={`max-w-lg rounded-xl px-4 py-3 ${
              msg.role === "agent"
                ? "bg-zinc-800 text-zinc-200"
                : "bg-orange-600 text-white"
            }`}>
              <p className="text-sm leading-relaxed">{msg.content}</p>
              <p className="text-xs mt-1 opacity-50">
                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-zinc-800 rounded-xl px-4 py-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400 animate-pulse" />
              <span className="text-sm text-zinc-400">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 backdrop-blur shrink-0">
        <div className="flex gap-3 max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder={`Message ${agentState.agentName || "your agent"}...`}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg px-4 py-3 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
