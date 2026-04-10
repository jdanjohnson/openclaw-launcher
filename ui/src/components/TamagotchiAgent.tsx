import { useEffect, useState } from "react";

type Mood = "idle" | "happy" | "thinking" | "talking" | "sleeping";

interface Props {
  mood: Mood;
  name: string;
  onClick?: () => void;
}

const FACE_MAP: Record<Mood, { eyes: string; mouth: string; anim: string }> = {
  idle: { eyes: "o  o", mouth: "‿", anim: "animate-bounce-slow" },
  happy: { eyes: "^  ^", mouth: "◡", anim: "animate-bounce-slow" },
  thinking: { eyes: "◉  ◉", mouth: "...", anim: "animate-pulse" },
  talking: { eyes: "o  o", mouth: "○", anim: "animate-pulse" },
  sleeping: { eyes: "-  -", mouth: "z", anim: "" },
};

export default function TamagotchiAgent({ mood, name, onClick }: Props) {
  const [blinkFrame, setBlinkFrame] = useState(false);
  const face = FACE_MAP[mood] || FACE_MAP.idle;

  useEffect(() => {
    if (mood === "sleeping") return;
    const interval = setInterval(() => {
      setBlinkFrame(true);
      setTimeout(() => setBlinkFrame(false), 200);
    }, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [mood]);

  const eyes = blinkFrame && mood !== "sleeping" ? "-  -" : face.eyes;

  return (
    <div
      className={`flex flex-col items-center select-none ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      {/* Agent body */}
      <div className={`relative ${face.anim}`}>
        {/* Glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 blur-2xl scale-150" />

        {/* Body circle */}
        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
          {/* Inner face area */}
          <div className="w-24 h-24 rounded-full bg-zinc-950/40 flex flex-col items-center justify-center gap-1">
            <span className="text-xl font-mono text-white tracking-widest">{eyes}</span>
            <span className="text-lg text-white">{face.mouth}</span>
          </div>
        </div>

        {/* Mood indicator */}
        {mood === "thinking" && (
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-xs animate-bounce">
            ?
          </div>
        )}
        {mood === "sleeping" && (
          <div className="absolute -top-3 right-0 text-2xl animate-float">
            💤
          </div>
        )}
      </div>

      {/* Name */}
      <p className="mt-3 text-sm font-medium text-zinc-300">{name}</p>

      {/* Status text */}
      <p className="text-xs text-zinc-500 mt-0.5">
        {mood === "idle" && "Ready to help"}
        {mood === "happy" && "Feeling great!"}
        {mood === "thinking" && "Processing..."}
        {mood === "talking" && "Speaking..."}
        {mood === "sleeping" && "Zzz..."}
      </p>
    </div>
  );
}
