import type { DashboardBannerFormState } from "../types";

export const buildDashboardBannerPayload = ({
  form,
  imageFile,
}: {
  form: DashboardBannerFormState;
  imageFile: File | null;
}): DashboardBannerFormState => ({
  ...form,
  title: form.title.trim(),
  description: form.description?.trim() || null,
  ctaLabel: form.ctaLabel?.trim() || null,
  destinationUrl: form.destinationUrl?.trim() || null,
  mediaUrl: form.mediaUrl.trim() || (imageFile ? "/images/dashboard.png" : ""),
  mediaAlt: form.mediaAlt?.trim() || null,
  posterUrl: form.posterUrl?.trim() || null,
  startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
  endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
});
