"use client";

import { useCallback, useState, type FormEvent } from "react";
import type {
  CreateOrganizationRequest,
  Organization,
  UpdateOrganizationRequest,
} from "@repo/types";

import { DEFAULT_FORM, validateOrganizationForm } from "../forms";
import { toOrganizationRow } from "../services";
import { useOrganizationStore } from "../store";
import type {
  AddOrganizationFormState,
  OrganizationTableRow,
  OrganizationToastState,
} from "../types";
import {
  toCreatePayload,
  toOrganizationForm,
  toUpdatePayload,
} from "../utils";

interface UpdateOrganizationInput {
  id: number;
  payload: UpdateOrganizationRequest;
}

interface UseOrganizationFormOptions {
  createOrganization: (payload: CreateOrganizationRequest) => Promise<Organization>;
  isCreating: boolean;
  isUpdating: boolean;
  refetch: () => Promise<unknown>;
  setSelectedOrganization: (
    organization: OrganizationTableRow | null,
  ) => void;
  showToast: (toast: Omit<OrganizationToastState, "id">) => void;
  updateOrganization: (input: UpdateOrganizationInput) => Promise<Organization>;
}

export function useOrganizationForm({
  createOrganization,
  isCreating,
  isUpdating,
  refetch,
  setSelectedOrganization,
  showToast,
  updateOrganization,
}: UseOrganizationFormOptions) {
  const {
    editingOrganization,
    isAddModalOpen,
    setAddModalOpen,
    setEditingOrganization,
  } = useOrganizationStore();
  const [addForm, setAddForm] =
    useState<AddOrganizationFormState>(DEFAULT_FORM);
  const [editForm, setEditForm] =
    useState<AddOrganizationFormState>(DEFAULT_FORM);
  const [addFormError, setAddFormError] = useState<string | null>(null);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  const openAddOrganization = useCallback(() => {
    setAddForm(DEFAULT_FORM);
    setAddFormError(null);
    setAddModalOpen(true);
  }, [setAddModalOpen]);

  const closeAddOrganization = useCallback(() => {
    if (isCreating) {
      return;
    }

    setAddModalOpen(false);
    setAddFormError(null);
  }, [isCreating, setAddModalOpen]);

  const updateAddForm = useCallback(
    <K extends keyof AddOrganizationFormState>(
      key: K,
      value: AddOrganizationFormState[K],
    ) => {
      setAddForm((current) => ({ ...current, [key]: value }));
      setAddFormError(null);
    },
    [],
  );

  const submitAddOrganization = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const payload = toCreatePayload(addForm);
      const validationError = validateOrganizationForm(addForm);

      if (validationError) {
        setAddFormError(validationError);
        showToast({
          message: validationError,
          title: "Missing organization details",
          tone: "error",
        });
        return;
      }

      try {
        const organization = await createOrganization(payload);

        setAddModalOpen(false);
        setAddForm(DEFAULT_FORM);
        setSelectedOrganization(toOrganizationRow(organization));
        showToast({
          message: `${organization.name} has been created successfully.`,
          title: "Organization created",
          tone: "success",
        });
        await refetch();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "The organization could not be created.";

        setAddFormError(message);
        showToast({
          message,
          title: "Create failed",
          tone: "error",
        });
      }
    },
    [
      addForm,
      createOrganization,
      refetch,
      setAddModalOpen,
      setSelectedOrganization,
      showToast,
    ],
  );

  const openEditOrganization = useCallback(
    (organization: OrganizationTableRow) => {
      setEditingOrganization(organization);
      setEditForm(toOrganizationForm(organization));
      setEditFormError(null);
    },
    [setEditingOrganization],
  );

  const closeEditOrganization = useCallback(() => {
    if (isUpdating) {
      return;
    }

    setEditingOrganization(null);
    setEditFormError(null);
  }, [isUpdating, setEditingOrganization]);

  const updateEditForm = useCallback(
    <K extends keyof AddOrganizationFormState>(
      key: K,
      value: AddOrganizationFormState[K],
    ) => {
      setEditForm((current) => ({ ...current, [key]: value }));
      setEditFormError(null);
    },
    [],
  );

  const submitEditOrganization = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!editingOrganization) {
        return;
      }

      const payload = toUpdatePayload(editForm);
      const validationError = validateOrganizationForm(editForm);

      if (validationError) {
        setEditFormError(validationError);
        showToast({
          message: validationError,
          title: "Missing organization details",
          tone: "error",
        });
        return;
      }

      try {
        const organization = await updateOrganization({
          id: editingOrganization.id,
          payload,
        });

        setEditingOrganization(null);
        setSelectedOrganization(toOrganizationRow(organization));
        showToast({
          message: `${organization.name} has been updated successfully.`,
          title: "Organization updated",
          tone: "success",
        });
        await refetch();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "The organization could not be updated.";

        setEditFormError(message);
        showToast({
          message,
          title: "Update failed",
          tone: "error",
        });
      }
    },
    [
      editForm,
      editingOrganization,
      refetch,
      setEditingOrganization,
      setSelectedOrganization,
      showToast,
      updateOrganization,
    ],
  );

  return {
    addForm,
    addFormError,
    closeAddOrganization,
    closeEditOrganization,
    editForm,
    editFormError,
    editingOrganization,
    isAddModalOpen,
    isCreating,
    isUpdating,
    openAddOrganization,
    openEditOrganization,
    submitAddOrganization,
    submitEditOrganization,
    updateAddForm,
    updateEditForm,
  };
}
