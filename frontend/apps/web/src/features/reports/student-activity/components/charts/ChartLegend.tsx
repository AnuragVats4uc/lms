import styles from "../../styles/StudentActivityReportPage.module.css";

export const ChartLegend = ({
  items,
}: {
  items: Array<{ color: string; label: string }>;
}) => {
  return (
    <div className={styles.chartLegend}>
      {items.map((item) => (
        <span key={item.label}>
          <i style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
};
