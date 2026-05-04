"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type LoaderContextValue = {
  loading: boolean;
  setLoading: (isLoading: boolean) => void;
};

const LoaderContext = createContext<LoaderContextValue | null>(null);

export function LoaderProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoadingState] = useState(false);

  const setLoading = useCallback((isLoading: boolean) => {
    setLoadingState(isLoading);
  }, []);

  const value = useMemo<LoaderContextValue>(
    () => ({
      loading,
      setLoading,
    }),
    [loading, setLoading],
  );

  return (
    <LoaderContext.Provider value={value}>{children}</LoaderContext.Provider>
  );
}

export function useLoader() {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error("useLoader must be used within LoaderProvider");
  }
  return context;
}
