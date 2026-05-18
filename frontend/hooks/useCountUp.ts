"use client";

import { useEffect, useRef, useState } from "react";

// Animates a number from 0 to `target` over `duration` ms using easeOutExpo
export function useCountUp(target: number, duration = 900, trigger = true) {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);
  const start = useRef<number | null>(null);

  useEffect(() => {
    if (!trigger || target === 0) { setValue(target); return; }
    start.current = null;

    const step = (ts: number) => {
      if (!start.current) start.current = ts;
      const elapsed = ts - start.current;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Math.round(eased * target));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };

    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration, trigger]);

  return value;
}
