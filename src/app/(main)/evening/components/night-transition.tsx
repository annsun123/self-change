"use client";

import { useEffect, useRef, useState } from "react";

interface NightTransitionProps {
  onComplete: () => void;
}

export function NightTransition({ onComplete }: NightTransitionProps) {
  const [progress, setProgress] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const duration = 5000; // 5 seconds
    const interval = 50;
    const steps = duration / interval;
    let current = 0;

    const timer = setInterval(() => {
      current += 1;
      setProgress(current / steps);
      if (current >= steps) {
        clearInterval(timer);
        onCompleteRef.current();
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Candlelight effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {/* Candle */}
          <div className="w-4 h-16 bg-amber-100/80 rounded-t-full" />
          {/* Flame */}
          <div
            className="absolute -top-6 left-1/2 -translate-x-1/2 w-3 h-6 bg-amber-400 rounded-full animate-pulse"
            style={{
              boxShadow: "0 0 20px 10px rgba(251, 191, 36, 0.3), 0 0 40px 20px rgba(251, 191, 36, 0.1)",
              opacity: 0.8 + progress * 0.2,
            }}
          />
        </div>
      </div>

      {/* Ambient glow */}
      <div
        className="absolute inset-0 bg-gradient-radial from-amber-900/20 via-transparent to-transparent"
        style={{ opacity: progress }}
      />

      {/* Night scene description */}
      <div className="relative z-10 text-center space-y-4">
        <div className="text-4xl text-amber-400/60 animate-pulse">🕯️</div>
        <p className="text-stone-500 text-sm italic" style={{ opacity: progress }}>
          入夜了。
        </p>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-8 left-8 right-8">
        <div className="h-1 bg-stone-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-600/50 transition-all duration-100"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}