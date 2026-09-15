import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { studentsApi } from "@repo/api";
import type { StudentSelfProfile } from "@repo/types";

import type { ProfileForm } from "../types";
import { readProfileApiError } from "../utils/profileErrors";
import { emptyProfileForm, toProfileForm } from "../utils/profileFormMappers";
import type { ShowProfileToast } from "./useProfileToast";

export const usePersonalProfileForm = (
  profile: StudentSelfProfile | undefined,
  showToast: ShowProfileToast,
) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProfileForm>(emptyProfileForm);

  useEffect(() => {
    if (!profile) return;
    const timer = window.setTimeout(() => setForm(toProfileForm(profile)), 0);
    return () => window.clearTimeout(timer);
  }, [profile]);

  const mutation = useMutation({
    mutationFn: studentsApi.updateMyProfile,
    onSuccess: async (updatedProfile) => {
      queryClient.setQueryData(["student-profile"], updatedProfile);
      await queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      showToast("Profile updated", "Your personal details are now up to date.");
    },
    onError: (error) =>
      showToast("Could not save profile", readProfileApiError(error), "error"),
  });

  const onChange = (field: keyof ProfileForm, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));
  const onReset = () => profile && setForm(toProfileForm(profile));
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { avatar: _avatar, ...editableProfile } = form;
    void _avatar;
    mutation.mutate({
      ...editableProfile,
      dateOfBirth: form.dateOfBirth || null,
    });
  };

  return { form, isSaving: mutation.isPending, onChange, onReset, onSubmit };
};
