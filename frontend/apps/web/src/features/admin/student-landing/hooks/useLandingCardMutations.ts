import { useMutation } from "@tanstack/react-query";
import { getApiErrorMessage, studentLandingApi } from "@repo/api";
import type { StudentLandingCard } from "@repo/types";
import type { LandingCardForm } from "../types";
import { landingCardCommonPayload } from "../utils/landingCardPayload";

export const useLandingCardMutations = ({
  editing,
  form,
  imageFile,
  onMessage,
  onSaved,
  organizationId,
  refresh,
}: {
  editing: StudentLandingCard | null;
  form: LandingCardForm;
  imageFile: File | null;
  onMessage: (message: string | null) => void;
  onSaved: () => void;
  organizationId: number | null;
  refresh: () => Promise<unknown>;
}) => {
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error("Select an organization first.");
      const commonPayload = landingCardCommonPayload(form);
      const savedCard = await (editing
        ? studentLandingApi.update(editing.id, {
            ...commonPayload,
            ...(editing.type === "CUSTOM"
              ? {
                  destinationUrl: form.destinationUrl.trim(),
                  openInNewTab: form.openInNewTab,
                  isActive: form.isActive,
                }
              : {}),
          })
        : studentLandingApi.create(organizationId, {
            ...commonPayload,
            imageUrl: commonPayload.imageUrl ?? undefined,
            imageAlt: commonPayload.imageAlt ?? undefined,
            destinationUrl: form.destinationUrl.trim(),
            openInNewTab: form.openInNewTab,
          }));
      return imageFile
        ? studentLandingApi.uploadImage(savedCard.id, imageFile)
        : savedCard;
    },
    onError: (error) =>
      onMessage(getApiErrorMessage(error, "Card could not be saved.")),
    onSuccess: async () => {
      await refresh();
      onSaved();
      onMessage("Landing card saved.");
    },
  });
  const removeMutation = useMutation({
    mutationFn: (id: number) => studentLandingApi.remove(id),
    onError: (error) =>
      onMessage(getApiErrorMessage(error, "Card could not be deleted.")),
    onSuccess: async () => {
      await refresh();
      onMessage("Landing card deleted.");
    },
  });
  const reorderMutation = useMutation({
    mutationFn: (ids: number[]) =>
      studentLandingApi.reorder(organizationId as number, ids),
    onError: (error) =>
      onMessage(getApiErrorMessage(error, "Card order could not be saved.")),
    onSuccess: async () => {
      await refresh();
      onMessage("Card order updated.");
    },
  });
  return { removeMutation, reorderMutation, saveMutation };
};
