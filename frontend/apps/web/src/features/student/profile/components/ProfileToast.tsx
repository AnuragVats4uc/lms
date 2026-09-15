import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { ToastState } from "../types";
import styles from "../StudentProfilePage.module.css";

export const ProfileToast = ({
  onClose,
  toast,
}: {
  onClose: () => void;
  toast: ToastState | null;
}) => {
  if (!toast) return null;
  const Icon = toast.tone === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div
      className={styles.toast}
      data-tone={toast.tone}
      key={toast.id}
      role="status"
    >
      <Icon size={19} />
      <span>
        <strong>{toast.title}</strong>
        <small>{toast.message}</small>
      </span>
      <button aria-label="Dismiss message" onClick={onClose} type="button">
        <X size={14} />
      </button>
    </div>
  );
};
