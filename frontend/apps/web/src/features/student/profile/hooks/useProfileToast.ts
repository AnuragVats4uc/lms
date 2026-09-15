import { useEffect, useState } from "react";

import type { ToastState } from "../types";

export type ShowProfileToast = (
  title: string,
  message: string,
  tone?: ToastState["tone"],
) => void;

export const useProfileToast = () => {
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const showToast: ShowProfileToast = (title, message, tone = "success") => {
    setToast({ id: Date.now(), title, message, tone });
  };

  return { clearToast: () => setToast(null), showToast, toast };
};
