"use client";

import {
  BulkDeleteDialog,
  BulkStatusDialog,
  DeleteDialog,
  StatusDialog,
} from "../../dialogs";
import {
  AddOrganizationModal,
  EditOrganizationModal,
} from "../../forms";
import type {
  useOrganizationActions,
  useOrganizationForm,
} from "../../hooks";
import { OrganizationToast } from "./OrganizationToast";

type OrganizationActions = ReturnType<typeof useOrganizationActions>;
type OrganizationForm = ReturnType<typeof useOrganizationForm>;

interface OrganizationOverlaysProps {
  actions: OrganizationActions;
  form: OrganizationForm;
}

export function OrganizationOverlays({
  actions,
  form,
}: OrganizationOverlaysProps) {
  return (
    <>
      <AddOrganizationModal
        error={form.addFormError ?? undefined}
        form={form.addForm}
        isOpen={form.isAddModalOpen}
        isSubmitting={form.isCreating}
        onChange={form.updateAddForm}
        onClose={form.closeAddOrganization}
        onSubmit={form.submitAddOrganization}
      />

      <EditOrganizationModal
        error={form.editFormError ?? undefined}
        form={form.editForm}
        isOpen={Boolean(form.editingOrganization)}
        isSubmitting={form.isUpdating}
        onChange={form.updateEditForm}
        onClose={form.closeEditOrganization}
        onSubmit={form.submitEditOrganization}
      />

      <DeleteDialog
        error={actions.confirmError ?? undefined}
        isOpen={actions.confirmAction?.kind === "delete"}
        isSubmitting={actions.isSubmitting}
        onClose={actions.closeConfirmAction}
        onConfirm={actions.confirmOrganizationAction}
        organization={actions.dialogState.deleteOrganization}
      />

      <StatusDialog
        error={actions.confirmError ?? undefined}
        isOpen={actions.confirmAction?.kind === "toggle"}
        isSubmitting={actions.isSubmitting}
        onClose={actions.closeConfirmAction}
        onConfirm={actions.confirmOrganizationAction}
        organization={actions.dialogState.statusOrganization}
      />

      <BulkDeleteDialog
        error={actions.confirmError ?? undefined}
        isOpen={actions.confirmAction?.kind === "bulk-delete"}
        isSubmitting={actions.isSubmitting}
        onClose={actions.closeConfirmAction}
        onConfirm={actions.confirmOrganizationAction}
        organizations={actions.dialogState.bulkDeleteOrganizations}
      />

      <BulkStatusDialog
        active={actions.dialogState.bulkStatusActive}
        error={actions.confirmError ?? undefined}
        isOpen={actions.confirmAction?.kind === "bulk-toggle"}
        isSubmitting={actions.isSubmitting}
        onClose={actions.closeConfirmAction}
        onConfirm={actions.confirmOrganizationAction}
        organizations={actions.dialogState.bulkStatusOrganizations}
      />

      <OrganizationToast
        onDismiss={actions.dismissToast}
        toast={actions.toast}
      />
    </>
  );
}
