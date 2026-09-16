import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { AdminStudentDashboardBanner } from "@repo/types";

import { AppModal } from "@/components/AppModal";
import type { DashboardBannerFormState } from "../../types";
import styles from "../../DashboardBannersPage.module.css";
import { DashboardBannerForm } from "./DashboardBannerForm";

interface DashboardBannerModalProps {
  editing: AdminStudentDashboardBanner | null;
  form: DashboardBannerFormState;
  imageFile: File | null;
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  posterFile: File | null;
  sessions: { id: number; name: string }[];
  setForm: Dispatch<SetStateAction<DashboardBannerFormState>>;
  setImageFile: (file: File | null) => void;
  setPosterFile: (file: File | null) => void;
}

export const DashboardBannerModal = ({
  editing,
  form,
  imageFile,
  isOpen,
  isSaving,
  onClose,
  onSubmit,
  posterFile,
  sessions,
  setForm,
  setImageFile,
  setPosterFile,
}: DashboardBannerModalProps) => (
  <AppModal
    className="lms-organization-create-modal"
    description="Configure content, media, sessions, visibility and schedule."
    footer={
      <div className={styles.modalActions}>
        <button onClick={onClose} type="button">
          Cancel
        </button>
        <button
          className={styles.primary}
          disabled={isSaving}
          form="dashboard-banner-form"
          type="submit"
        >
          {isSaving ? "Saving…" : editing ? "Update" : "Create"}
        </button>
      </div>
    }
    isOpen={isOpen}
    onClose={onClose}
    title={editing ? "Edit Dashboard Banner" : "Add Dashboard Banner"}
  >
    <DashboardBannerForm
      form={form}
      imageFile={imageFile}
      onSubmit={onSubmit}
      posterFile={posterFile}
      sessions={sessions}
      setForm={setForm}
      setImageFile={setImageFile}
      setPosterFile={setPosterFile}
    />
  </AppModal>
);
