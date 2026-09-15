export const formatCourseAmount = (value: string | null) => {
  if (!value) return "Not set";
  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
};
