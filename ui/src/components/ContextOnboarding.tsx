import { useState, useCallback } from "react";
import { api } from "../lib/api";
import type { BackendState } from "../lib/api";

interface Props {
  onComplete: (data: { userName: string; agentName: string; userRole?: string; goals?: string; commStyle?: string }) => void;
}

interface InterviewStep {
  id: string;
  question: string;
  placeholder: string;
  hint: string;
  field: string;
}

const INTERVIEW_STEPS: InterviewStep[] = [
  {
    id: "name",
    question: "What should we call you?",
    placeholder: "e.g. Alex, Jordan, Sam...",
    hint: "Your name helps personalize your agent experience",
    field: "userName",
  },
  {
    id: "agent",
    question: "Name your context agent",
    placeholder: "e.g. Atlas, Nova, Cortex...",
    hint: "This is your main AI agent — your co-founder in everything",
    field: "agentName",
  },
  {
    id: "role",
    question: "What's your role?",
    placeholder: "e.g. Founder, CTO, Product Lead, Engineer...",
    hint: "Helps your agent understand how to best support you",
    field: "userRole",
  },
  {
    id: "focus",
    question: "What are you building or working on?",
    placeholder: "e.g. An AI-powered sales tool, a marketplace...",
    hint: "Your agent will use this context to help you plan and execute",
    field: "goals",
  },
  {
    id: "style",
    question: "How do you prefer to communicate?",
    placeholder: "e.g. Direct and concise, Detailed and thorough...",
    hint: "Your agent adapts its communication style to match yours",
    field: "commStyle",
  },
];

export default function ContextOnboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  const currentStep = INTERVIEW_STEPS[step];
  const progress = ((step + 1) / INTERVIEW_STEPS.length) * 100;
  const currentValue = values[currentStep?.field] || "";

  const handleNext = useCallback(async () => {
    if (step < INTERVIEW_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      // Final step — submit
      setIsSubmitting(true);
      try {
        const res = await api.onboard({
          userName: values.userName || "User",
          agentName: values.agentName || "Atlas",
          userRole: values.userRole || "",
          goals: values.goals || "",
          commStyle: values.commStyle || "",
        });
        if (res.ok) {
          setShowComplete(true);
          setTimeout(() => onComplete({
            userName: values.userName || "User",
            agentName: values.agentName || "Atlas",
            userRole: values.userRole,
            goals: values.goals,
            commStyle: values.commStyle,
          }), 1200);
        } else {
          setShowComplete(true);
          setTimeout(() => onComplete({
            userName: values.userName || "User",
            agentName: values.agentName || "Atlas",
            userRole: values.userRole,
            goals: values.goals,
            commStyle: values.commStyle,
          }), 1200);
        }
      } catch {
        setShowComplete(true);
        setTimeout(() => onComplete({
          userName: values.userName || "User",
          agentName: values.agentName || "Atlas",
          userRole: values.userRole,
          goals: values.goals,
          commStyle: values.commStyle,
        }), 1200);
      }
    }
  }, [step, values, onComplete]);

  const handleSkipAll = useCallback(() => {
    // Demo mode — skip straight to dashboard with defaults
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
    }).catch(() => {});
    onComplete(demoState);
  }, [onComplete]);

  if (showComplete) {
    return (
      <div className="fixed inset-0 bg-black bg-mesh flex items-center justify-center z-50">
        <div className="text-center animate-scale-in">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[rgb(242,84,31)] to-[rgb(200,50,10)] flex items-center justify-center mx-auto mb-6 shadow-[0_0_60px_rgba(242,84,31,0.4)]">
            <span className="text-3xl">🦞</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {values.agentName || "Atlas"} is ready
          </h2>
          <p className="text-white/40 text-sm">Initializing your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-mesh flex flex-col z-50 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[rgba(242,84,31,0.06)] blur-[100px] pointer-events-none" />

      {/* Top bar with progress */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[rgb(242,84,31)] to-[rgb(200,50,10)] flex items-center justify-center">
            <span className="text-sm">🦞</span>
          </div>
          <span className="text-sm font-semibold text-white/80">Context Setup</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-white/30">{step + 1} of {INTERVIEW_STEPS.length}</span>
          <button
            onClick={handleSkipAll}
            className="text-xs text-white/30 hover:text-white/50 transition-colors px-3 py-1 rounded-lg hover:bg-white/5"
          >
            Skip all →
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 px-6">
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[rgb(242,84,31)] to-[rgb(255,120,60)] rounded-full transition-all duration-500 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 progress-shimmer" />
          </div>
        </div>
      </div>

      {/* Interview content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-lg w-full">
          <div key={step} className="animate-fade-up">
            {/* Question */}
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">
              {currentStep.question}
            </h2>
            <p className="text-sm text-white/40 mb-8">{currentStep.hint}</p>

            {/* Input */}
            <input
              type="text"
              value={currentValue}
              onChange={(e) => setValues({ ...values, [currentStep.field]: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter" && currentValue.trim()) handleNext();
              }}
              placeholder={currentStep.placeholder}
              autoFocus
              className="w-full glass-input px-5 py-4 text-lg"
            />

            {/* Action buttons */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => step > 0 && setStep(step - 1)}
                className="text-sm text-white/30 hover:text-white/50 transition-colors disabled:opacity-20"
                disabled={step === 0}
              >
                ← Back
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setValues({ ...values, [currentStep.field]: "" });
                    handleNext();
                  }}
                  className="text-sm text-white/30 hover:text-white/50 transition-colors px-4 py-2"
                >
                  Skip
                </button>
                <button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="btn-accent px-6 py-3 text-sm flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <span className="animate-pulse">Setting up...</span>
                  ) : step === INTERVIEW_STEPS.length - 1 ? (
                    "Launch Agent"
                  ) : (
                    <>
                      Continue
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step indicators */}
      <div className="relative z-10 flex items-center justify-center gap-2 pb-8">
        {INTERVIEW_STEPS.map((_, i) => (
          <div
            key={i}
            className="h-1 rounded-full transition-all duration-300"
            style={{
              width: i === step ? "24px" : "8px",
              background: i <= step ? "rgb(242, 84, 31)" : "rgba(255,255,255,0.1)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
