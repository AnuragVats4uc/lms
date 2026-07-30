import type { OrganizationTableRow } from "../types";
import { ConfirmationDialog } from "./ConfirmationDialog";

export function BulkStatusDialog({
  active,
  error,
  isOpen,
  isSubmitting,
  onClose,
  onConfirm,
  organizations,
}: {
  active: boolean;
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
      confirmLabel={active ? "Activate" : "Deactivate"}
      description="This will update the active state and sync status for the selected records."
      detail={`Status will change to ${active ? "Active" : "Inactive"}.`}
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
      title={`${active ? "Activate" : "Deactivate"} ${
        isBulk ? "Organizations" : "Organization"
      }`}
    />
  );
}
