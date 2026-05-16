"use client";

import { useEffect, useRef, useState } from "react";

interface Round0CandlelightProps {
  onComplete: () => void;
}

export function Round0Candlelight({ onComplete }: Round0CandlelightProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setTimeout(() => onCompleteRef.current(), 500);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-6">
        {/* Candle animation */}
        <div className={`relative ${isAnimating ? 'animate-pulse' : ''}`}>
          <div className="text-6xl">🕯️</div>
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-4 bg-amber-400 rounded-full"
            style={{
              boxShadow: "0 0 15px 5px rgba(251, 191, 36, 0.4)",
            }}
          />
        </div>

        {/* Scene description */}
        <div className="space-y-2 text-stone-400">
          <p className="text-sm italic">画面微移，镜头拉近。</p>
          <p className="text-sm italic">申先生重新端起茶杯。</p>
          <p className="text-sm italic">徐娘子身体微微前倾。</p>
        </div>

        <p className="text-amber-400/60 text-sm pt-4">信号：今晚不着急。</p>
      </div>
    </div>
  );
}