import type { ReactNode } from "react";
import type { AppCardProps } from "../../primitives";

export interface StatCardProps extends AppCardProps {
  color?: "green" | "blue" | "purple";
  icon: ReactNode;
  link?: string;
  loading?: boolean;
  onPress?: () => void;
  subtitle: string;
  title: string;
  trend?: string;
  value: string | number;
}
