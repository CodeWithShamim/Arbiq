"use client";

import { useState, useCallback, useRef } from "react";
import { friendlyError } from "@/lib/errors";

export interface ErrorToast {
  id: string;
  message: string;
}

/**
 * Global error toast state. One active toast at a time — new errors
 * replace the previous one so the UI never stacks multiple failures.
 */
export function useErrorToast() {
  const [toast, setToast] = useState<ErrorToast | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showError = useCallback((err: unknown) => {
    const message = friendlyError(err);

    if (timerRef.current) clearTimeout(timerRef.current);

    setToast({ id: String(Date.now()), message });

    timerRef.current = setTimeout(() => setToast(null), 6000);
  }, []);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  return { toast, showError, dismiss };
}
