"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  Organization,
  UpdateOrganizationRequest,
} from "@repo/types";

import { toOrganizationRow } from "../services";
import { useOrganizationStore } from "../store";
import type {
  OrganizationRowActionHandlers,
  OrganizationTableRow,
  OrganizationToastState,
} from "../types";

interface UpdateOrganizationInput {
  id: number;
  payload: UpdateOrganizationRequest;
}

interface UseOrganizationActionsOptions {
  deleteOrganization: (id: number) => Promise<unknown>;
  isDeleting: boolean;
  isUpdating: boolean;
  refetch: () => Promise<unknown>;
  removeSelectedOrganizations: (organizationIds: number[]) => void;
  setSelectedOrganization: (
    organization: OrganizationTableRow | null,
  ) => void;
  updateOrganization: (input: UpdateOrganizationInput) => Promise<Organization>;
}

export function useOrganizationActions({
  deleteOrganization,
  isDeleting,
  isUpdating,
  refetch,
  removeSelectedOrganizations,
  setSelectedOrganization,
  updateOrganization,
}: UseOrganizationActionsOptions) {
  const { confirmAction, setConfirmAction } = useOrganizationStore();
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [toast, setToast] = useState<OrganizationToastState | null>(null);

  const showToast = useCallback(
    (toastState: Omit<OrganizationToastState, "id">) => {
      setToast({ ...toastState, id: Date.now() });
    },
    [],
  );

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  const closeConfirmAction = useCallback(() => {
    if (isDeleting || isUpdating) {
      return;
    }

    setConfirmAction(null);
    setConfirmError(null);
  }, [isDeleting, isUpdating, setConfirmAction]);

  const openBulkDelete = useCallback(
    (organizations: OrganizationTableRow[]) => {
      setConfirmAction({ kind: "bulk-delete", organizations });
      setConfirmError(null);
    },
    [setConfirmAction],
  );

  const openBulkStatus = useCallback(
    (organizations: OrganizationTableRow[], active: boolean) => {
      setConfirmAction({ active, kind: "bulk-toggle", organizations });
      setConfirmError(null);
    },
    [setConfirmAction],
  );

  const confirmOrganizationAction = useCallback(async () => {
    if (!confirmAction) {
      return;
    }

    try {
      if (confirmAction.kind === "delete") {
        const { organization } = confirmAction;

        await deleteOrganization(organization.id);
        removeSelectedOrganizations([organization.id]);
        showToast({
          message: `${organization.name} has been deleted.`,
          title: "Organization deleted",
          tone: "success",
        });
      } else if (confirmAction.kind === "bulk-delete") {
        await Promise.all(
          confirmAction.organizations.map((organization) =>
            deleteOrganization(organization.id),
          ),
        );

        removeSelectedOrganizations(
          confirmAction.organizations.map((organization) => organization.id),
        );
        showToast({
          message: `${confirmAction.organizations.length} organizations have been deleted.`,
          title: "Organizations deleted",
          tone: "success",
        });
      } else if (confirmAction.kind === "toggle") {
        const isActive = !confirmAction.organization.isActive;
        const updated = await updateOrganization({
          id: confirmAction.organization.id,
          payload: {
            isActive,
            status: isActive ? "ACTIVE" : "INACTIVE",
          },
        });

        setSelectedOrganization(toOrganizationRow(updated));
        showToast({
          message: `${updated.name} is now ${isActive ? "active" : "inactive"}.`,
          title: "Status updated",
          tone: "success",
        });
      } else {
        await Promise.all(
          confirmAction.organizations.map((organization) =>
            updateOrganization({
              id: organization.id,
              payload: {
                isActive: confirmAction.active,
                status: confirmAction.active ? "ACTIVE" : "INACTIVE",
              },
            }),
          ),
        );
        showToast({
          message: `${confirmAction.organizations.length} organizations are now ${
            confirmAction.active ? "active" : "inactive"
          }.`,
          title: "Statuses updated",
          tone: "success",
        });
      }

      setConfirmAction(null);
      setConfirmError(null);
      await refetch();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The organization action could not be completed.";

      setConfirmError(message);
      showToast({
        message,
        title: "Action failed",
        tone: "error",
      });
    }
  }, [
    confirmAction,
    deleteOrganization,
    refetch,
    removeSelectedOrganizations,
    setConfirmAction,
    setSelectedOrganization,
    showToast,
    updateOrganization,
  ]);

  const createRowActionHandlers = useCallback(
    (
      onEdit: (organization: OrganizationTableRow) => void,
    ): OrganizationRowActionHandlers => ({
      onAssignCourses: (organization) =>
        console.info("Assign courses", organization.id),
      onDelete: (organization) => {
        setConfirmAction({ kind: "delete", organization });
        setConfirmError(null);
      },
      onEdit,
      onManageUsers: (organization) =>
        console.info("Manage users", organization.id),
      onToggleActive: (organization) => {
        setConfirmAction({ kind: "toggle", organization });
        setConfirmError(null);
      },
      onView: setSelectedOrganization,
      onViewAnalytics: (organization) =>
        console.info("View analytics", organization.id),
    }),
    [setConfirmAction, setSelectedOrganization],
  );

  const dialogState = useMemo(
    () => ({
      bulkDeleteOrganizations:
        confirmAction?.kind === "bulk-delete"
          ? confirmAction.organizations
          : [],
      bulkStatusActive:
        confirmAction?.kind === "bulk-toggle" ? confirmAction.active : false,
      bulkStatusOrganizations:
        confirmAction?.kind === "bulk-toggle"
          ? confirmAction.organizations
          : [],
      deleteOrganization:
        confirmAction?.kind === "delete" ? confirmAction.organization : null,
      statusOrganization:
        confirmAction?.kind === "toggle" ? confirmAction.organization : null,
    }),
    [confirmAction],
  );

  return {
    closeConfirmAction,
    confirmAction,
    confirmError,
    confirmOrganizationAction,
    createRowActionHandlers,
    dialogState,
    dismissToast,
    isSubmitting: isDeleting || isUpdating,
    openBulkDelete,
    openBulkStatus,
    showToast,
    toast,
  };
}
