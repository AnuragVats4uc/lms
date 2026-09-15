import type { StudentLandingCard } from "@repo/types";
import type { LandingCardForm as LandingCardFormValues } from "../../types";
import styles from "../../StudentLandingCardsPage.module.css";
import { LandingCardFormField } from "./LandingCardFormField";
import { LandingCardImageUploader } from "./LandingCardImageUploader";

export const LandingCardForm = ({
  editing,
  form,
  imageFile,
  imageSrc,
  message,
  onClearImage,
  onSelectImage,
  onSubmit,
  onUpdate,
}: {
  editing: StudentLandingCard | null;
  form: LandingCardFormValues;
  imageFile: File | null;
  imageSrc: string;
  message: string | null;
  onClearImage: () => void;
  onSelectImage: (file: File) => void;
  onSubmit: () => void;
  onUpdate: (values: Partial<LandingCardFormValues>) => void;
}) => (
  <form
    id="student-landing-card-form"
    onSubmit={(event) => {
      event.preventDefault();
      onSubmit();
    }}
  >
    <div className={styles.formGrid}>
      {message ? <div className={styles.formError}>{message}</div> : null}
      <LandingCardFormField label="Heading">
        <input
          autoFocus
          maxLength={120}
          onChange={(event) => onUpdate({ title: event.target.value })}
          required
          value={form.title}
        />
      </LandingCardFormField>
      <LandingCardFormField label="CTA label">
        <input
          maxLength={80}
          onChange={(event) => onUpdate({ ctaLabel: event.target.value })}
          required
          value={form.ctaLabel}
        />
      </LandingCardFormField>
      <LandingCardFormField full label="Description">
        <textarea
          maxLength={500}
          onChange={(event) => onUpdate({ description: event.target.value })}
          required
          rows={2}
          value={form.description}
        />
      </LandingCardFormField>
      <LandingCardImageUploader
        file={imageFile}
        imageSrc={imageSrc}
        onClear={onClearImage}
        onSelect={onSelectImage}
      />
      <LandingCardFormField full label="Image URL (optional alternative)">
        <input
          onChange={(event) => onUpdate({ imageUrl: event.target.value })}
          placeholder="/images/external-links.png or https://…"
          value={form.imageUrl}
        />
      </LandingCardFormField>
      <LandingCardFormField full label="Image alternative text">
        <input
          maxLength={200}
          onChange={(event) => onUpdate({ imageAlt: event.target.value })}
          placeholder="Describe the image for screen readers"
          value={form.imageAlt}
        />
      </LandingCardFormField>
      <LandingCardFormField full label="Destination URL">
        <input
          disabled={editing?.type === "SYSTEM_LMS"}
          onChange={(event) => onUpdate({ destinationUrl: event.target.value })}
          placeholder="https://example.com"
          required
          value={form.destinationUrl}
        />
      </LandingCardFormField>
      {editing?.type !== "SYSTEM_LMS" ? (
        <>
          <label className={styles.checkField}>
            <input
              checked={Boolean(form.openInNewTab)}
              onChange={(event) =>
                onUpdate({ openInNewTab: event.target.checked })
              }
              type="checkbox"
            />{" "}
            Open in a new tab
          </label>
          {editing ? (
            <label className={styles.checkField}>
              <input
                checked={form.isActive}
                onChange={(event) =>
                  onUpdate({ isActive: event.target.checked })
                }
                type="checkbox"
              />{" "}
              Visible to students
            </label>
          ) : null}
        </>
      ) : null}
    </div>
  </form>
);
