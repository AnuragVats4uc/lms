import { AlertCircle, RefreshCw } from "lucide-react";
import styles from "../../StudentProfilePage.module.css";

export const ProfileErrorState = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => {
  return (
    <div className={styles.loadingState}>
      <AlertCircle size={28} />
      <strong>We could not load your profile</strong>
      <span>{message}</span>
      <button className={styles.primaryButton} onClick={onRetry} type="button">
        <RefreshCw size={15} /> Try again
      </button>
    </div>
  );
};
