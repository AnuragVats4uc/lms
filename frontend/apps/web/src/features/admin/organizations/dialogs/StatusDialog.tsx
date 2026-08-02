import type { OrganizationTableRow } from "../types";
import { ConfirmationDialog } from "./ConfirmationDialog";

export const StatusDialog = ({
  error,
  isOpen,
  isSubmitting,
  onClose,
  onConfirm,
  organization,
}: {
  error?: string;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
  organization: OrganizationTableRow | null;
}) => {
  const nextActive = organization ? !organization.isActive : false;

  return (
    <ConfirmationDialog
      confirmLabel={nextActive ? "Activate" : "Deactivate"}
      description="This will update the active state and sync status for the selected records."
      detail={`Status will change to ${nextActive ? "Active" : "Inactive"}.`}
      error={error}
      isOpen={isOpen}
      isSubmitting={isSubmitting}
      onClose={onClose}
      onConfirm={onConfirm}
      subject={organization?.name ?? "Selected organization"}
      title={`${nextActive ? "Activate" : "Deactivate"} Organization`}
    />
  );
};
