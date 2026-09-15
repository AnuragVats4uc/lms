import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { studentsApi } from "@repo/api";
import { useLogout } from "@repo/auth";

import type { PasswordForm } from "../types";
import { readProfileApiError } from "../utils/profileErrors";
import type { ShowProfileToast } from "./useProfileToast";

const emptyPasswordForm: PasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export const useProfilePassword = (showToast: ShowProfileToast) => {
  const logoutMutation = useLogout();
  const [form, setForm] = useState<PasswordForm>(emptyPasswordForm);
  const [showPasswords, setShowPasswords] = useState(false);
  const mutation = useMutation({
    mutationFn: studentsApi.changeMyPassword,
    onSuccess: (result) => {
      showToast("Password changed", result.message);
      setForm(emptyPasswordForm);
      window.setTimeout(() => void logoutMutation.mutateAsync(), 900);
    },
    onError: (error) =>
      showToast(
        "Could not change password",
        readProfileApiError(error),
        "error",
      ),
  });
  const onChange = (field: keyof PasswordForm, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.newPassword.length < 8) {
      showToast(
        "Password is too short",
        "Use at least 8 characters for your new password.",
        "error",
      );
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      showToast(
        "Passwords do not match",
        "Re-enter the same new password in both fields.",
        "error",
      );
      return;
    }
    mutation.mutate({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    });
  };
  return {
    form,
    isSaving: mutation.isPending || logoutMutation.isPending,
    onChange,
    onSubmit,
    onToggleVisibility: () => setShowPasswords((current) => !current),
    showPasswords,
  };
};
