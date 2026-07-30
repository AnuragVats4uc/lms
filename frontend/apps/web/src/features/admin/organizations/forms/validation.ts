import type { AddOrganizationFormState } from "../types";

export const ORGANIZATION_FORM_REQUIRED_MESSAGE =
  "Organization name and code are required.";

export function validateOrganizationForm(
  form: AddOrganizationFormState,
): string | null {
  return form.name.trim() && form.code.trim()
    ? null
    : ORGANIZATION_FORM_REQUIRED_MESSAGE;
}
