import { Trash2, UploadCloud } from "lucide-react";
import styles from "../../StudentLandingCardsPage.module.css";

export const LandingCardImageUploader = ({
  file,
  imageSrc,
  onClear,
  onSelect,
}: {
  file: File | null;
  imageSrc: string;
  onClear: () => void;
  onSelect: (file: File) => void;
}) => (
  <div className={styles.imageUploader}>
    <div className={styles.imageUploadPreview}>
      <img alt="Card preview" src={imageSrc} />
    </div>
    <div className={styles.imageUploadCopy}>
      <strong>Card image</strong>
      <span>JPEG, PNG, or WebP. Maximum file size 5 MB.</span>
      {file ? <small>{file.name}</small> : null}
      <div>
        <label className={styles.secondaryButton}>
          <UploadCloud size={15} />
          {file ? "Replace image" : "Choose image"}
          <input
            accept="image/jpeg,image/png,image/webp"
            className={styles.hiddenFileInput}
            onChange={(event) => {
              const selected = event.target.files?.[0];
              if (selected) onSelect(selected);
              event.currentTarget.value = "";
            }}
            type="file"
          />
        </label>
        <button
          className={styles.removeImageButton}
          onClick={onClear}
          type="button"
        >
          <Trash2 size={14} /> Remove
        </button>
      </div>
    </div>
  </div>
);
