"use client";

import { AnimatePresence } from "framer-motion";
import ToastContainer from "@/components/ui/ToastContainer";
import Alert from "@/components/ui/Alert";
import Confirm from "@/components/ui/Confirm";
import { useToast } from "@/hooks/useToast";
import { useAlert } from "@/hooks/useAlert";

export default function NotificationProvider() {
  const { toasts, removeToast } = useToast();
  const { alert, confirm, closeAlert, closeConfirm } = useAlert();

  return (
    <>
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Alert modal */}
      <AnimatePresence>
        {alert && <Alert {...alert} onClose={closeAlert} />}
      </AnimatePresence>

      {/* Confirm modal */}
      <AnimatePresence>
        {confirm && <Confirm {...confirm} onClose={closeConfirm} />}
      </AnimatePresence>
    </>
  );
}
