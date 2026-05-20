"use client";
import { useEffect, useRef, useState } from "react";

const CHARS = "!@#$%^&*()_+-=[]{}|;':\",./<>?ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function useGlitchText(original: string, intervalMs = 6000) {
  const [text, setText] = useState(original);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let frame = 0;
    const maxFrames = 8;

    const glitch = () => {
      frame++;
      if (frame > maxFrames) {
        setText(original);
        timerRef.current = setTimeout(glitch, intervalMs);
        return;
      }
      setText(
        original
          .split("")
          .map((c, i) =>
            Math.random() < 0.4 + (frame / maxFrames) * 0.4
              ? c
              : CHARS[Math.floor(Math.random() * CHARS.length)]
          )
          .join("")
      );
      rafRef.current = requestAnimationFrame(glitch);
    };

    timerRef.current = setTimeout(() => {
      frame = 0;
      glitch();
    }, intervalMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, [original, intervalMs]);

  return text;
}
