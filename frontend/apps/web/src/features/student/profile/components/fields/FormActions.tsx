import { LoaderCircle, Save } from "lucide-react";
import styles from "../../StudentProfilePage.module.css";

export const FormActions = ({
  isSaving,
  onReset,
}: {
  isSaving: boolean;
  onReset: () => void;
}) => {
  return (
    <div className={styles.formActions}>
      <span>Only student-editable fields will be changed.</span>
      <div>
        <button
          className={styles.secondaryButton}
          disabled={isSaving}
          onClick={onReset}
          type="button"
        >
          Reset changes
        </button>
        <button
          className={styles.primaryButton}
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? (
            <LoaderCircle className={styles.spin} size={16} />
          ) : (
            <Save size={16} />
          )}
          {isSaving ? "Saving..." : "Save profile"}
        </button>
      </div>
    </div>
  );
};
