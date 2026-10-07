import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { registrationApi } from "@repo/api";
import type { PublicRegistrationSubmitResponse } from "@repo/types";

import { INITIAL_REGISTRATION_FORM } from "../constants";
import type { RegistrationFormState } from "../types";
import { buildRegistrationPayload } from "../utils/buildRegistrationPayload";
import { getRegistrationErrorMessage } from "../utils/getRegistrationErrorMessage";
import { validateRegistrationForm } from "../utils/validateRegistrationForm";

export const usePublicRegistration = (slug: string) => {
  const [form, setForm] = useState<RegistrationFormState>(
    INITIAL_REGISTRATION_FORM,
  );
  const [clientError, setClientError] = useState<string | null>(null);
  const [success, setSuccess] =
    useState<PublicRegistrationSubmitResponse | null>(null);

  const pageQuery = useQuery({
    queryFn: () => registrationApi.getPublic(slug),
    queryKey: ["public-registration", slug],
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: (payload: Parameters<typeof registrationApi.submitPublic>[1]) =>
      registrationApi.submitPublic(slug, payload),
    onSuccess: (data) => {
      setSuccess(data);
      setClientError(null);
    },
    onError: (error) => {
      setClientError(
        getRegistrationErrorMessage(
          error,
          "Registration could not be submitted.",
        ),
      );
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const page = pageQuery.data;
    if (!page) return;

    const validationError = validateRegistrationForm(page, form);
    if (validationError) {
      setClientError(validationError);
      return;
    }

    submitMutation.mutate(buildRegistrationPayload(form));
  };

  return {
    clientError,
    form,
    pageQuery,
    setForm,
    submit,
    submitMutation,
    success,
  };
};
