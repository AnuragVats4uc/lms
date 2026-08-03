"use client";

import { CrudConfirmationDialog } from "./CrudConfirmationDialog";

export interface CrudStatusConfirmationDialogProps {
  active: boolean;
  count: number;
  entityLabel: string;
  error?: string;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const CrudStatusConfirmationDialog = ({
  active,
  count,
  entityLabel,
  error,
  isOpen,
  isSubmitting,
  onClose,
  onConfirm,
}: CrudStatusConfirmationDialogProps) => {
  const action = active ? "Activate" : "Deactivate";
  const pluralizedLabel = count === 1 ? entityLabel : `${entityLabel}s`;

  return (
    <CrudConfirmationDialog
      confirmLabel={action}
      description={`This will ${active ? "restore access to" : "disable access to"} the selected ${pluralizedLabel.toLowerCase()}.`}
      destructive={!active}
      detail={`${active ? "Access will be restored for" : "Access will be disabled for"} ${count} ${pluralizedLabel.toLowerCase()}.`}
      error={error}
      isOpen={isOpen}
      isSubmitting={isSubmitting}
      onClose={onClose}
      onConfirm={onConfirm}
      subject={`${action} ${count} ${pluralizedLabel}`}
      title={`${action} ${entityLabel}`}
    />
  );
};
