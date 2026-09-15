import type { CSSProperties } from "react";
import { PencilLine } from "lucide-react";

import styles from "../StudentProfilePage.module.css";

export const ProfileCompletionCard = ({
  onEdit,
  percentage,
}: {
  onEdit: () => void;
  percentage: number;
}) => (
  <div className={styles.heroActions}>
    <div
      className={styles.completenessRing}
      style={
        { "--profile-progress": `${percentage * 3.6}deg` } as CSSProperties
      }
    >
      <div>
        <strong>{percentage}%</strong>
        <span>complete</span>
      </div>
    </div>
    <button className={styles.primaryButton} onClick={onEdit} type="button">
      <PencilLine size={16} /> Edit profile
    </button>
  </div>
);
