"use client";

import { createContext, useContext, ReactNode } from "react";
import { useErrorToast } from "@/hooks/useErrorToast";
import { ErrorToast } from "@/components/ErrorToast";

interface ErrorContextValue {
  showError: (err: unknown) => void;
}

const ErrorContext = createContext<ErrorContextValue>({
  showError: () => {},
});

export function ErrorProvider({ children }: { children: ReactNode }) {
  const { toast, showError, dismiss } = useErrorToast();

  return (
    <ErrorContext.Provider value={{ showError }}>
      {children}
      <ErrorToast toast={toast} onDismiss={dismiss} />
    </ErrorContext.Provider>
  );
}

/** Call anywhere inside the app to show a red error toast. */
export function useError() {
  return useContext(ErrorContext);
}
