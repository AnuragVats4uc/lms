import type { ReactNode } from "react";

import styles from "../../DashboardBannersPage.module.css";

export const BannerFormField = ({
  children,
  full,
  label,
}: {
  children: ReactNode;
  full?: boolean;
  label: string;
}) => (
  <label className={full ? styles.full : styles.field}>
    <strong>{label}</strong>
    {children}
  </label>
);
