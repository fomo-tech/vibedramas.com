"use client";

import { create } from "zustand";
import type { AlertType, AlertProps } from "@/components/ui/Alert";
import type { ConfirmProps } from "@/components/ui/Confirm";

interface AlertState {
  alert: Omit<AlertProps, "onClose"> | null;
  confirm: Omit<ConfirmProps, "onClose"> | null;
  showAlert: (params: {
    type: AlertType;
    title: string;
    message?: string;
    confirmText?: string;
    onConfirm?: () => void;
  }) => void;
  showConfirm: (params: {
    title: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "primary";
    onConfirm: () => void;
    onCancel?: () => void;
  }) => void;
  closeAlert: () => void;
  closeConfirm: () => void;
}

export const useAlert = create<AlertState>((set) => ({
  alert: null,
  confirm: null,
  showAlert: (params) => {
    set({
      alert: {
        type: params.type,
        title: params.title,
        message: params.message,
        confirmText: params.confirmText,
        onConfirm: params.onConfirm || (() => {}),
      },
    });
  },
  showConfirm: (params) => {
    set({
      confirm: {
        title: params.title,
        message: params.message,
        confirmText: params.confirmText,
        cancelText: params.cancelText,
        variant: params.variant,
        onConfirm: params.onConfirm,
        onCancel: params.onCancel || (() => {}),
      },
    });
  },
  closeAlert: () => set({ alert: null }),
  closeConfirm: () => set({ confirm: null }),
}));
