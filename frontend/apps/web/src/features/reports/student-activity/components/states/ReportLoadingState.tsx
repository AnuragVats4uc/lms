import { PageContainer, Spinner, Text } from "@repo/ui";
import styles from "../../styles/StudentActivityReportPage.module.css";

export const ReportLoadingState = () => {
  return (
    <PageContainer>
      <div className={styles.loadingState}>
        <Spinner size="large" />
        <Text color="#52627A">Loading student activity report…</Text>
      </div>
    </PageContainer>
  );
};
