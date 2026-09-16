import { UploadCloud } from "lucide-react";

import { DASHBOARD_BANNER_IMAGE_ACCEPT } from "../../constants";
import styles from "../../DashboardBannersPage.module.css";

export const BannerFileUpload = ({
  file,
  label,
  setFile,
}: {
  file: File | null;
  label: string;
  setFile: (file: File | null) => void;
}) => (
  <div className={styles.full}>
    <strong>{label}</strong>
    <label className={styles.upload}>
      <UploadCloud size={17} />
      {file?.name ?? "Choose JPEG, PNG, WebP, GIF or AVIF"}
      <input
        hidden
        accept={DASHBOARD_BANNER_IMAGE_ACCEPT}
        type="file"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />
    </label>
  </div>
);
