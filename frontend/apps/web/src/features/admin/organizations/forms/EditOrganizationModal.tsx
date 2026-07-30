import type { FormEvent } from "react";
import { Button } from "@repo/ui";

import { AppModal } from "@/components/AppModal";

import type { AddOrganizationFormState } from "../types";
import { OrganizationForm } from "./OrganizationForm";
import type { OrganizationFormChangeHandler } from "./OrganizationFormFields";

const EDIT_ORGANIZATION_FORM_ID = "organization-edit-organization-form";

export function EditOrganizationModal({
  error,
  form,
  isOpen,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
}: {
  error?: string;
  form: AddOrganizationFormState;
  isOpen: boolean;
  isSubmitting: boolean;
  onChange: OrganizationFormChangeHandler;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const submitForm = () => {
    const formElement = document.getElementById(EDIT_ORGANIZATION_FORM_ID);

    if (formElement instanceof HTMLFormElement) {
      formElement.requestSubmit();
    }
  };

  return (
    <AppModal
      className="lms-organization-create-modal"
      description="Update organization profile data and refresh the current list."
      footer={
        <>
          <Button
            background="#FFFFFF"
            borderColor="#D8E1EC"
            borderWidth={1}
            disabled={isSubmitting}
            height={38}
            onPress={onClose}
            rounded="$3"
          >
            <Button.Text fontSize="$caption" fontWeight="$button">
              Cancel
            </Button.Text>
          </Button>
          <Button
            background="#059669"
            borderColor="#059669"
            borderWidth={1}
            disabled={isSubmitting}
            height={38}
            onPress={submitForm}
            rounded="$3"
            type="button"
          >
            <Button.Text
              color="#FFFFFF"
              fontSize="$caption"
              fontWeight="$button"
            >
              {isSubmitting ? "Updating..." : "Update Organization"}
            </Button.Text>
          </Button>
        </>
      }
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Organization"
    >
      <OrganizationForm
        error={error}
        form={form}
        formId={EDIT_ORGANIZATION_FORM_ID}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    </AppModal>
  );
}
