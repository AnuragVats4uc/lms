import type { StudentLandingCard } from "@repo/types";
import { AppModal } from "@/components/AppModal";
import type { LandingCardForm as LandingCardFormValues } from "../../types";
import styles from "../../StudentLandingCardsPage.module.css";
import { LandingCardForm } from "../form/LandingCardForm";

export const LandingCardFormModal = ({
  editing,
  form,
  imageFile,
  imageSrc,
  isOpen,
  message,
  onClearImage,
  onClose,
  onSave,
  onSelectImage,
  onUpdate,
  saving,
}: {
  editing: StudentLandingCard | null;
  form: LandingCardFormValues;
  imageFile: File | null;
  imageSrc: string;
  isOpen: boolean;
  message: string | null;
  onClearImage: () => void;
  onClose: () => void;
  onSave: () => void;
  onSelectImage: (file: File) => void;
  onUpdate: (values: Partial<LandingCardFormValues>) => void;
  saving: boolean;
}) => (
  <AppModal
    className="lms-organization-create-modal"
    description="Save the form and refresh the current list."
    footer={
      <div className={styles.modalActions}>
        <button
          className={styles.secondaryButton}
          disabled={saving}
          onClick={onClose}
          type="button"
        >
          Cancel
        </button>
        <button
          className={styles.primaryButton}
          disabled={saving}
          form="student-landing-card-form"
          type="submit"
        >
          {saving ? "Saving…" : editing ? "Update" : "Create"}
        </button>
      </div>
    }
    isOpen={isOpen}
    onClose={onClose}
    title={editing ? "Edit Landing Card" : "Add Landing Card"}
  >
    <LandingCardForm
      editing={editing}
      form={form}
      imageFile={imageFile}
      imageSrc={imageSrc}
      message={message}
      onClearImage={onClearImage}
      onSelectImage={onSelectImage}
      onSubmit={onSave}
      onUpdate={onUpdate}
    />
  </AppModal>
);
