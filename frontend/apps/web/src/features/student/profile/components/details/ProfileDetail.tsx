import styles from "../../StudentProfilePage.module.css";
export const ProfileDetail = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className={styles.detail}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);
