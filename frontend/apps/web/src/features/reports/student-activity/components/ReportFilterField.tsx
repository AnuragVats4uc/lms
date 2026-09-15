import styles from "../styles/StudentActivityReportPage.module.css";

export const ReportFilterField = ({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) => {
  return (
    <label className={styles.filterField}>
      <span>{label}</span>
      {children}
    </label>
  );
};
