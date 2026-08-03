import { CrudToast } from "../../components/crud";
import { SessionDialogs } from "../dialogs";
import { AddSessionModal, EditSessionModal } from "../forms";
import type { useSessionActions, useSessionForm } from "../hooks";

export function SessionOverlays({
  actions,
  form,
}: {
  actions: ReturnType<typeof useSessionActions>;
  form: ReturnType<typeof useSessionForm>;
}) {
  return (
    <>
      <AddSessionModal
        error={form.addFormError ?? undefined}
        form={form.addForm}
        isOpen={form.isAddModalOpen}
        isSubmitting={form.isCreating}
        onChange={form.updateAddForm}
        onClose={form.closeAddSession}
        onSubmit={form.submitAddSession}
      />
      <EditSessionModal
        error={form.editFormError ?? undefined}
        form={form.editForm}
        isOpen={Boolean(form.editingSession)}
        isSubmitting={form.isUpdating}
        onChange={form.updateEditForm}
        onClose={form.closeEditSession}
        onSubmit={form.submitEditSession}
      />
      <SessionDialogs
        action={actions.confirmAction}
        error={actions.confirmError ?? undefined}
        isSubmitting={actions.isSubmitting}
        onClose={actions.closeConfirmAction}
        onConfirm={actions.confirmSessionAction}
      />
      <CrudToast onDismiss={actions.dismissToast} toast={actions.toast} />
    </>
  );
}
