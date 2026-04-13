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
    <div className="fixed inset-0 bg-mesh flex items-center justify-center z-50 overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute w-[700px] h-[700px] rounded-full transition-all duration-1000"
        style={{
          background: "radial-gradient(circle, rgba(242,84,31,0.12) 0%, transparent 70%)",
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 2 ? "scale(1.5)" : "scale(0.5)",
        }}
      />

      <div className="flex flex-col items-center gap-8 relative z-10">
        {/* Logo */}
        <div
          className="transition-all duration-700 ease-out"
          style={{
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? "scale(1) translateY(0)" : "scale(0.5) translateY(20px)",
          }}
        >
          <div className="w-32 h-32 rounded-[32px] bg-gradient-to-br from-[rgb(242,84,31)] to-[rgb(200,50,10)] flex items-center justify-center shadow-[0_0_80px_rgba(242,84,31,0.3)] transition-shadow duration-1000">
            <span className="text-6xl">🦞</span>
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
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Atomic Claw</h1>
          <p className="text-sm text-gray-400 mt-2 tracking-widest uppercase font-medium">Agent Operating System</p>
        </div>

        {/* Loading bar */}
        <div
          className="w-64 h-1.5 bg-black/5 rounded-full overflow-hidden transition-opacity duration-300"
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
