import type { FormEvent } from "react";
import { Button } from "@repo/ui";

import { AppModal } from "@/components/AppModal";

import type { AddOrganizationFormState } from "../types";
import { OrganizationForm } from "./OrganizationForm";
import type { OrganizationFormChangeHandler } from "./OrganizationFormFields";

const ADD_ORGANIZATION_FORM_ID = "organization-add-organization-form";

export function AddOrganizationModal({
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
    const formElement = document.getElementById(ADD_ORGANIZATION_FORM_ID);

    if (formElement instanceof HTMLFormElement) {
      formElement.requestSubmit();
    }
  };

  return (
    <AppModal
      className="lms-organization-create-modal"
      description="Create a tenant organization and refresh the current list."
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
              {isSubmitting ? "Creating..." : "Create Organization"}
            </Button.Text>
          </Button>
        </>
      }
      isOpen={isOpen}
      onClose={onClose}
      title="Add Organization"
    >
      <OrganizationForm
        error={error}
        form={form}
        formId={ADD_ORGANIZATION_FORM_ID}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    </AppModal>
  );
}
