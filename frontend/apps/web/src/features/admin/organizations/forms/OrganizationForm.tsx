import type { FormEvent } from "react";
import { Text } from "@repo/ui";

import type { AddOrganizationFormState } from "../types";
import {
  OrganizationFormFields,
  type OrganizationFormChangeHandler,
} from "./OrganizationFormFields";

export const OrganizationForm = ({
  error,
  form,
  formId,
  onChange,
  onSubmit,
}: {
  error?: string;
  form: AddOrganizationFormState;
  formId: string;
  onChange: OrganizationFormChangeHandler;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) => {
  return (
    <form className="lms-organization-form" id={formId} onSubmit={onSubmit}>
      <OrganizationFormFields form={form} onChange={onChange} />

      {error ? (
        <Text color="#DC2626" fontSize="$caption" lineHeight="$caption">
          {error}
        </Text>
      ) : null}
    </form>
  );
};
