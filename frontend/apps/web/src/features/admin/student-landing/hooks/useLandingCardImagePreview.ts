import { useEffect, useMemo, useState } from "react";
import type { StudentLandingCard } from "@repo/types";
import { validateLandingCardImage } from "../utils/landingCardImage";

export const useLandingCardImagePreview = ({
  editing,
  imageUrl,
  onError,
}: {
  editing: StudentLandingCard | null;
  imageUrl: string;
  onError: (message: string | null) => void;
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const previewUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile],
  );
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );
  const imageSrc =
    previewUrl ||
    imageUrl.trim() ||
    (editing?.type === "SYSTEM_LMS"
      ? "/images/dashboard.png"
      : "/images/external-links.png");
  const selectImage = (file: File) => {
    const error = validateLandingCardImage(file);
    if (error) {
      onError(error);
      return;
    }
    setImageFile(file);
    onError(null);
  };
  const clearImageFile = () => setImageFile(null);
  return { clearImageFile, imageFile, imageSrc, selectImage };
};
