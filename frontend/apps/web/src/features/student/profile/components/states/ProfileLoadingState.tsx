import { LoaderCircle } from "lucide-react";
import styles from "../../StudentProfilePage.module.css";

export const ProfileLoadingState = () => {
  return (
    <div className={styles.loadingState}>
      <LoaderCircle className={styles.spin} size={28} />
      <strong>Loading your profile</strong>
      <span>Gathering your account and academic details...</span>
    </div>
  );
};
