import { ConfirmationDialog } from "../../organizations/dialogs/ConfirmationDialog";
import type { Session } from "@repo/types";

export function SessionDialogs({ action, error, isSubmitting, onClose, onConfirm }: {
  action: { kind: "bulk-delete"; sessions: Session[] } | { kind: "delete" | "toggle"; session: Session } | null;
  error?: string;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!action) return null;
  const deleting = action.kind === "delete" || action.kind === "bulk-delete";
  const active = action.kind === "toggle" ? !action.session.isActive : false;
  const subject = action.kind === "bulk-delete" ? `${action.sessions.length} selected sessions` : action.session.name;
  return <ConfirmationDialog confirmLabel={deleting ? "Delete Session" : active ? "Activate" : "Archive"} description={deleting ? "This will soft delete the selected session records and refresh the list." : "This will update the active state of the selected session."} destructive={deleting} detail={deleting ? "The session records will no longer be active in the organization workspace." : `Status will change to ${active ? "Active" : "Archived"}.`} error={error} isOpen isSubmitting={isSubmitting} onClose={onClose} onConfirm={onConfirm} subject={subject} title={deleting ? "Delete Session" : `${active ? "Activate" : "Archive"} Session`} />;
}
