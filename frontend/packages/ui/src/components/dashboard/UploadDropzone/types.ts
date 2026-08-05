import type { ReactNode } from "react";

export interface UploadDropzoneProps {
  actionLabel: string;
  description: string;
  icon: ReactNode;
  onPress?: () => void;
  title: string;
}
