import type { ReactNode } from "react";
import styles from "../../StudentProfilePage.module.css";
export const ProfileField = ({
  children,
  label,
  required,
  wide,
}: {
  children: ReactNode;
  label: string;
  required?: boolean;
  wide?: boolean;
}) => (
  <label className={wide ? styles.wideField : undefined}>
    <span>
      {label} {required ? <i>*</i> : null}
    </span>
    {children}
  </label>
);
