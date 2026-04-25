"use client";

import { ReactNode } from "react";
import { useAppStore } from "../store/useAppStore";

interface StoreProviderProps {
  children: ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  // Logic to initialize global store properties if needed
  // Could integrate with Next.js specific client-side only setups
  const theme = useAppStore((state) => state.theme);

  // In Next.js, actual Theme rendering usually relies on something like next-themes
  // This is a placeholder for context initialization

  return <div className={`theme-${theme} min-h-screen`}>{children}</div>;
}
