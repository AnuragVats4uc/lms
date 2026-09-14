export const formatDurationLabel = (totalSeconds: number) => {
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  return `${minutes} min`;
};
