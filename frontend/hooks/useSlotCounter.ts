"use client";
import { useEffect, useState } from "react";

// Returns an array of digit strings that "slot machine" into the final number
export function useSlotCounter(target: number, duration = 1200, trigger = true) {
  const [digits, setDigits] = useState<string[]>(
    String(target).split("").map(() => "0")
  );

  useEffect(() => {
    if (!trigger) return;
    const targetStr = String(target);
    const len = targetStr.length;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setDigits(
        targetStr.split("").map((finalDigit, i) => {
          const lockAt = (i + 1) / len;
          if (progress >= lockAt) return finalDigit;
          return String(Math.floor(Math.random() * 10));
        })
      );

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [target, duration, trigger]);

  return digits;
}
