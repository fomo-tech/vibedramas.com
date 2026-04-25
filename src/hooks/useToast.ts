"use client";

import { create } from "zustand";
import type { ToastType } from "@/components/ui/Toast";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string, duration?: number) => void;
  error: (title: string, message?: string, duration?: number) => void;
  info: (title: string, message?: string, duration?: number) => void;
  warning: (title: string, message?: string, duration?: number) => void;
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2, 11);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
  success: (title, message, duration = 4000) => {
    const id = Math.random().toString(36).slice(2, 11);
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id, type: "success", title, message, duration },
      ],
    }));
  },
  error: (title, message, duration = 4000) => {
    const id = Math.random().toString(36).slice(2, 11);
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id, type: "error", title, message, duration },
      ],
    }));
  },
  info: (title, message, duration = 4000) => {
    const id = Math.random().toString(36).slice(2, 11);
    set((state) => ({
      toasts: [...state.toasts, { id, type: "info", title, message, duration }],
    }));
  },
  warning: (title, message, duration = 4000) => {
    const id = Math.random().toString(36).slice(2, 11);
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id, type: "warning", title, message, duration },
      ],
    }));
  },
}));
