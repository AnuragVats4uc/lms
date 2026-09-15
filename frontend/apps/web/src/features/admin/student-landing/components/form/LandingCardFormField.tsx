import type { ReactNode } from "react";
import styles from "../../StudentLandingCardsPage.module.css";
export const LandingCardFormField = ({
  children,
  full,
  label,
}: {
  children: ReactNode;
  full?: boolean;
  label: string;
}) => (
  <label className={full ? styles.fullField : styles.field}>
    <span>{label}</span>
    {children}
  </label>
);
