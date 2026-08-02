"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, X, XCircle } from "lucide-react";

import type { OrganizationToastState } from "../../types";

interface OrganizationToastProps {
  onDismiss: () => void;
  toast: OrganizationToastState | null;
}

export const OrganizationToast = ({
  onDismiss,
  toast,
}: OrganizationToastProps) => {
  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(onDismiss, 3600);

    return () => window.clearTimeout(timeout);
  }, [onDismiss, toast]);

  if (!toast || typeof document === "undefined") {
    return null;
  }

  const Icon = toast.tone === "success" ? CheckCircle2 : XCircle;

  return createPortal(
    <div
      className={[
        "lms-organization-toast",
        toast.tone === "error" ? "is-error" : "is-success",
      ].join(" ")}
      role="status"
      aria-atomic="true"
      aria-live="polite"
    >
      <div className="lms-organization-toast-content">
        <div className="lms-organization-toast-icon">
          <Icon aria-hidden="true" size={18} />
        </div>
        <div className="lms-organization-toast-copy">
          <strong>{toast.title}</strong>
          <span>{toast.message}</span>
        </div>
      </div>
      <button
        aria-label="Dismiss notification"
        className="lms-organization-toast-close"
        onClick={onDismiss}
        type="button"
      >
        <X aria-hidden="true" size={13} />
      </button>
    </div>,
    document.body,
  );
};
