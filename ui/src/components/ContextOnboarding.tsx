import { useState, useCallback, useRef, useEffect } from "react";
import { api } from "../lib/api";
import type { BackendState } from "../lib/api";

interface Props {
  onComplete: (data: { userName: string; agentName: string; userRole?: string; goals?: string; commStyle?: string }) => void;
}

interface ChatMessage {
  role: "agent" | "user";
  text: string;
}

const INTERVIEW_QUESTIONS = [
  "What should I call you?",
  "Nice to meet you! What do you do — what's your role or title?",
  "Cool! So tell me — what are you working on right now? What's the big project or idea?",
  "Love it. How do you like to communicate? Are you more of a \"just give me the bullet points\" person or do you like detailed breakdowns?",
  "Last one — what's the #1 thing you'd want an AI co-founder to help you with this week?",
];

export default function ContextOnboarding({ onComplete }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "agent",
      text: "Hey there! 👋 I'm going to be your context agent — think of me as your AI co-founder who knows everything about you and your work.\n\nThis quick interview takes about 5 minutes. I'll ask you a few questions to get ramped up on who you are and what you're building.\n\nAt the end, you'll get to explore a live demo of your personalized agent dashboard — complete with your fleet, skills library, and inspiration board. Let's go! 🚀",
    },
    {
      role: "agent",
      text: INTERVIEW_QUESTIONS[0],
    },
  ]);
  const [input, setInput] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const progress = ((questionIndex + 1) / INTERVIEW_QUESTIONS.length) * 100;

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    setInput("");
    const newAnswers = [...answers, text];
    setAnswers(newAnswers);
    setMessages((prev) => [...prev, { role: "user", text }]);

    const nextQ = questionIndex + 1;

    if (nextQ < INTERVIEW_QUESTIONS.length) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [...prev, { role: "agent", text: INTERVIEW_QUESTIONS[nextQ] }]);
        setQuestionIndex(nextQ);
      }, 800 + Math.random() * 600);
    } else {
      setIsTyping(true);
      const userName = newAnswers[0] || "User";
      const userRole = newAnswers[1] || "";
      const goals = newAnswers[2] || "";
      const commStyle = newAnswers[3] || "";
      const weeklyGoal = newAnswers[4] || "";

      setTimeout(async () => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            role: "agent",
            text: `Amazing, ${userName}! I've got a great picture of who you are and what you need. I'm setting up your personalized workspace now — this is going to be fun! 🦞`,
          },
        ]);

        try {
          await api.onboard({
            userName,
            agentName: "Atlas",
            userRole,
            goals: `${goals}${weeklyGoal ? ` | Weekly focus: ${weeklyGoal}` : ""}`,
            commStyle,
          });
        } catch {
          // continue anyway
        }

        setTimeout(() => {
          setShowComplete(true);
          setTimeout(() => {
            onComplete({
              userName,
              agentName: "Atlas",
              userRole,
              goals: `${goals}${weeklyGoal ? ` | Weekly focus: ${weeklyGoal}` : ""}`,
              commStyle,
            });
          }, 1500);
        }, 1200);
      }, 1000);
    }
  }, [input, isTyping, answers, questionIndex, onComplete]);

  const handleSkipAll = useCallback(() => {
    const demoState = {
      userName: "Demo User",
      agentName: "Atlas",
      userRole: "Explorer",
      goals: "Exploring Atomic Claw",
      commStyle: "Direct",
      onboardingComplete: true,
      agentMood: "happy" as const,
      currentStep: 5,
      level: 1,
      xp: 50,
    } as BackendState;
    api.onboard({
      userName: demoState.userName,
      agentName: demoState.agentName,
      userRole: demoState.userRole,
      goals: demoState.goals,
      commStyle: demoState.commStyle,
    }).catch(() => {});
    onComplete(demoState);
  }, [onComplete]);

  if (showComplete) {
    return (
      <div className="fixed inset-0 bg-mesh flex items-center justify-center z-50">
        <div className="text-center animate-scale-in">
          <div className="w-28 h-28 rounded-[32px] bg-gradient-to-br from-[rgb(242,84,31)] to-[rgb(200,50,10)] flex items-center justify-center mx-auto mb-8 shadow-[0_0_80px_rgba(242,84,31,0.3)] animate-bounce-slow">
            <span className="text-5xl">🦞</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-3">Atlas is ready!</h2>
          <p className="text-lg text-gray-400">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-mesh flex flex-col z-50 overflow-hidden">
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-[rgba(242,84,31,0.08)] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[rgba(242,84,31,0.05)] blur-[100px] pointer-events-none" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[rgb(242,84,31)] to-[rgb(200,50,10)] flex items-center justify-center shadow-[0_0_20px_rgba(242,84,31,0.2)]">
            <span className="text-lg">🦞</span>
          </div>
          <div>
            <span className="text-base font-bold text-gray-800">Context Interview</span>
            <p className="text-xs text-gray-400">~5 min to get ramped up</p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <span className="text-sm text-gray-400 font-medium">{questionIndex + 1} of {INTERVIEW_QUESTIONS.length}</span>
          <button
            onClick={handleSkipAll}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors px-4 py-2 rounded-xl hover:bg-black/5 font-medium"
          >
            Skip to demo →
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 px-8">
        <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[rgb(242,84,31)] to-[rgb(255,120,60)] rounded-full transition-all duration-500 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 progress-shimmer" />
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-8 py-6 glass-scroll">
        <div className="max-w-2xl mx-auto space-y-5">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-up`}
            >
              {msg.role === "agent" && (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[rgb(242,84,31)] to-[rgb(200,50,10)] flex items-center justify-center mr-3 flex-shrink-0 shadow-md">
                  <span className="text-sm">🦞</span>
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-5 py-4 text-base leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[rgb(242,84,31)] text-white rounded-br-lg shadow-[0_4px_20px_rgba(242,84,31,0.2)]"
                    : "glass text-gray-700 rounded-bl-lg"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start animate-fade-up">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[rgb(242,84,31)] to-[rgb(200,50,10)] flex items-center justify-center mr-3 flex-shrink-0 shadow-md">
                <span className="text-sm">🦞</span>
              </div>
              <div className="glass rounded-2xl rounded-bl-lg px-5 py-4">
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2.5 h-2.5 rounded-full bg-[rgb(242,84,31)] animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="relative z-10 px-8 pb-8 pt-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your answer..."
            autoFocus
            disabled={isTyping}
            className="flex-1 glass-input px-6 py-4 text-lg"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="btn-accent px-6 py-4 text-base disabled:opacity-30"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
