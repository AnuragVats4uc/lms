export const isManagedAvatar = (value: string | null | undefined) => {
  return Boolean(value?.includes("/api/v1/students/me/profile/avatar"));
};
