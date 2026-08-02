import type { OrganizationTableRow } from "../types";
import { ConfirmationDialog } from "./ConfirmationDialog";

export const DeleteDialog = ({
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
  return (
    <ConfirmationDialog
      confirmLabel="Delete Organization"
      description="This will soft delete the selected organization records and refresh the list."
      destructive
      detail="The selected row data will be removed from the active workspace."
      error={error}
      isOpen={isOpen}
      isSubmitting={isSubmitting}
      onClose={onClose}
      onConfirm={onConfirm}
      subject={organization?.name ?? "Selected organization"}
      title="Delete Organization"
    />
  );
};
