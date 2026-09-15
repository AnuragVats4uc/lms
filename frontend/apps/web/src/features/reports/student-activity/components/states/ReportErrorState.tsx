import styles from "../../styles/StudentActivityReportPage.module.css";
import { PageContainer } from "@repo/ui";
import { ShieldAlert } from "lucide-react";
import { getApiErrorMessage } from "@repo/api";

type ReportErrorStateProps = {
  onGoBack: () => void;
  onRetry: () => void;
  error: unknown;
};

export const ReportErrorState = ({
  onGoBack,
  onRetry,
  error,
}: ReportErrorStateProps) => {
  return (
    <PageContainer>
      <div className={styles.errorState}>
        <ShieldAlert aria-hidden="true" size={28} />
        <h1>Unable to load activity report</h1>
        <p>
          {getApiErrorMessage(
            error,
            "The report is unavailable or you do not have access to this student.",
          )}
        </p>
        <div className={styles.errorActions}>
          <button onClick={onGoBack} type="button">
            Go back
          </button>
          <button onClick={onRetry} type="button">
            Try again
          </button>
        </div>
      </div>
    </PageContainer>
  );
};
