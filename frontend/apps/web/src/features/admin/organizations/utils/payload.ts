import type {
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
} from "@repo/types";

import type { AddOrganizationFormState, OrganizationTableRow } from "../types";

export const toCreatePayload = (
  form: AddOrganizationFormState,
): CreateOrganizationRequest => {
  const payload: CreateOrganizationRequest = {
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    status: form.status,
  };

  const optionalFields: Array<
    keyof Omit<AddOrganizationFormState, "code" | "name" | "status">
  > = ["address", "description", "email", "phone", "website"];

  optionalFields.forEach((field) => {
    const value = form[field].trim();

    if (value) {
      payload[field] = value;
    }
  });

  return payload;
};

export const toUpdatePayload = (
  form: AddOrganizationFormState,
): UpdateOrganizationRequest => {
  return toCreatePayload(form);
};

export const toOrganizationForm = (
  organization: OrganizationTableRow,
): AddOrganizationFormState => {
  return {
    address: organization.address ?? "",
    code: organization.code,
    description: organization.description ?? "",
    email: organization.email ?? "",
    name: organization.name,
    phone: organization.phone ?? "",
    status: organization.status,
    website: organization.website ?? "",
  };
};

// Temporary compatibility aliases for any imports outside this module.
export const toCreateOrganizationPayload = toCreatePayload;
export const toUpdateOrganizationPayload = toUpdatePayload;
export const toOrganizationFormState = toOrganizationForm;
