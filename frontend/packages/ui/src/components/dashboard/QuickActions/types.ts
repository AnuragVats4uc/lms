import type { QuickActionButtonProps } from "../QuickActionButton";
import type { AppCardProps } from "../../primitives";

export interface QuickActionsProps extends AppCardProps {
  actions: QuickActionButtonProps[];
  icon?: React.ReactNode;
  title: string;
}
