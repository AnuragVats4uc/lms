import type { OrganizationTableRow } from "../types";
import { ConfirmationDialog } from "./ConfirmationDialog";

export function BulkDeleteDialog({
  error,
  isOpen,
  isSubmitting,
  onClose,
  onConfirm,
  organizations,
}: {
  error?: string;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
  organizations: OrganizationTableRow[];
}) {
  const isBulk = organizations.length > 1;
  const organization = organizations[0];

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
      subject={
        isBulk
          ? `${organizations.length} selected organizations`
          : (organization?.name ?? "Selected organization")
      }
      title={`Delete ${isBulk ? "Organizations" : "Organization"}`}
    />
  );
}
