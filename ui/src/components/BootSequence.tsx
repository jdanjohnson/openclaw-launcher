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
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 2200),
      setTimeout(() => setPhase(3), 3500),
      setTimeout(() => onCompleteRef.current(), 4500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-6">
        {/* Logo */}
        <div
          className={`transition-all duration-1000 ${
            phase >= 1 ? "opacity-100 scale-100" : "opacity-0 scale-75"
          }`}
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <span className="text-3xl font-bold text-white">OC</span>
          </div>
        </div>

        {/* Text */}
        <div
          className={`transition-all duration-700 ${
            phase >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <p className="text-zinc-400 text-sm font-mono">
            {phase < 3 ? "Waking up..." : "Ready"}
          </p>
        </div>

        {/* Loading dots */}
        {phase >= 2 && phase < 3 && (
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
