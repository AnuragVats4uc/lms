import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { studentsApi } from "@repo/api";
import type { StudentSelfProfile } from "@repo/types";

import type { PreferenceForm } from "../types";
import { readProfileApiError } from "../utils/profileErrors";
import {
  emptyPreferenceForm,
  toPreferenceForm,
} from "../utils/profileFormMappers";
import type { ShowProfileToast } from "./useProfileToast";

export const useProfilePreferences = (
  profile: StudentSelfProfile | undefined,
  showToast: ShowProfileToast,
) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PreferenceForm>(emptyPreferenceForm);
  useEffect(() => {
    if (!profile) return;
    const timer = window.setTimeout(
      () => setForm(toPreferenceForm(profile.preferences)),
      0,
    );
    return () => window.clearTimeout(timer);
  }, [profile]);

  const mutation = useMutation({
    mutationFn: studentsApi.updateMyPreferences,
    onSuccess: async (preferences) => {
      queryClient.setQueryData<StudentSelfProfile>(
        ["student-profile"],
        (current) => (current ? { ...current, preferences } : current),
      );
      setForm(toPreferenceForm(preferences));
      await queryClient.invalidateQueries({
        queryKey: ["student-notifications"],
      });
      showToast(
        "Preferences saved",
        "Your language, timezone, and notification choices were updated.",
      );
    },
    onError: (error) =>
      showToast(
        "Could not save preferences",
        readProfileApiError(error),
        "error",
      ),
  });
  const onChange = <K extends keyof PreferenceForm>(
    field: K,
    value: PreferenceForm[K],
  ) => setForm((current) => ({ ...current, [field]: value }));
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate(form);
  };
  return { form, isSaving: mutation.isPending, onChange, onSubmit };
};
