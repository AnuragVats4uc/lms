import { XStack } from "@repo/ui";

interface DashboardSkeletonBlockProps {
  height: number;
  rounded?: number;
  width?: number | string;
}

export const DashboardSkeletonBlock = ({
  height,
  rounded = 10,
  width = "100%",
}: DashboardSkeletonBlockProps) => (
  <XStack
    className="lms-skeleton"
    style={{ borderRadius: rounded, height, width }}
  />
);
