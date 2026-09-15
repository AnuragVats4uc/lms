import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { studentsApi } from "@repo/api";

import { isManagedAvatar } from "../utils/profileAvatar";
import { readProfileApiError } from "../utils/profileErrors";
import type { ShowProfileToast } from "./useProfileToast";

export const useProfileAvatar = (
  avatar: string | null | undefined,
  showToast: ShowProfileToast,
) => {
  const queryClient = useQueryClient();
  const managed = isManagedAvatar(avatar);
  const avatarQuery = useQuery({
    queryKey: ["student-profile-avatar", avatar],
    queryFn: studentsApi.findMyAvatar,
    enabled: managed,
    staleTime: 5 * 60_000,
    retry: false,
  });
  const managedAvatarUrl = useMemo(
    () => (avatarQuery.data ? URL.createObjectURL(avatarQuery.data) : null),
    [avatarQuery.data],
  );

  useEffect(
    () => () => {
      if (managedAvatarUrl) URL.revokeObjectURL(managedAvatarUrl);
    },
    [managedAvatarUrl],
  );

  const uploadMutation = useMutation({
    mutationFn: studentsApi.uploadMyAvatar,
    onSuccess: async (profile) => {
      queryClient.setQueryData(["student-profile"], profile);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["student-profile-avatar"] }),
        queryClient.invalidateQueries({ queryKey: ["student-dashboard"] }),
      ]);
      showToast(
        "Profile photo updated",
        "Your new photo is now saved securely.",
      );
    },
    onError: (error) =>
      showToast("Could not upload photo", readProfileApiError(error), "error"),
  });
  const deleteMutation = useMutation({
    mutationFn: studentsApi.deleteMyAvatar,
    onSuccess: async (profile) => {
      queryClient.setQueryData(["student-profile"], profile);
      queryClient.removeQueries({ queryKey: ["student-profile-avatar"] });
      await queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      showToast(
        "Profile photo removed",
        "Your initials will be shown instead.",
      );
    },
    onError: (error) =>
      showToast("Could not remove photo", readProfileApiError(error), "error"),
  });

  return {
    avatarSrc: managed ? managedAvatarUrl : (avatar ?? null),
    isBusy: uploadMutation.isPending || deleteMutation.isPending,
    onDelete: () => deleteMutation.mutate(),
    onSelect: (file: File) => uploadMutation.mutate(file),
  };
};
