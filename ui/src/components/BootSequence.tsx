import { useEffect, useRef, useState } from "react";

interface Props {
  onComplete: () => void;
}

export default function BootSequence({ onComplete }: Props) {
  const [phase, setPhase] = useState(0);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 1600),
      setTimeout(() => onCompleteRef.current(), 2000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50 overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full transition-all duration-1000"
        style={{
          background: "radial-gradient(circle, rgba(242,84,31,0.15) 0%, transparent 70%)",
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 2 ? "scale(1.5)" : "scale(0.5)",
        }}
      />

      <div className="flex flex-col items-center gap-6 relative z-10">
        {/* Logo */}
        <div
          className="transition-all duration-700 ease-out"
          style={{
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? "scale(1) translateY(0)" : "scale(0.5) translateY(20px)",
          }}
        >
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[rgb(242,84,31)] to-[rgb(200,50,10)] flex items-center justify-center shadow-[0_0_60px_rgba(242,84,31,0.4)] transition-shadow duration-1000">
            <span className="text-4xl">🦞</span>
          </div>
        </div>

        {/* Brand */}
        <div
          className="transition-all duration-500 text-center"
          style={{
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? "translateY(0)" : "translateY(10px)",
          }}
        >
          <h1 className="text-2xl font-bold text-white tracking-tight">Atomic Claw</h1>
          <p className="text-xs text-white/40 mt-1 tracking-widest uppercase">Agent Operating System</p>
        </div>

        {/* Loading bar */}
        <div
          className="w-48 h-0.5 bg-white/10 rounded-full overflow-hidden transition-opacity duration-300"
          style={{ opacity: phase >= 2 ? 1 : 0 }}
        >
          <div
            className="h-full bg-gradient-to-r from-[rgb(242,84,31)] to-[rgb(255,120,60)] rounded-full transition-all duration-700 ease-out"
            style={{ width: phase >= 3 ? "100%" : phase >= 2 ? "60%" : "0%" }}
          />
        </div>
      </div>
    </div>
  );
}
