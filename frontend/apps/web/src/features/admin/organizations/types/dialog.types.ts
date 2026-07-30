import { OrganizationTableRow } from "./organizations.types";

export type OrganizationConfirmAction =
  | { kind: "bulk-delete"; organizations: OrganizationTableRow[] }
  | {
      active: boolean;
      kind: "bulk-toggle";
      organizations: OrganizationTableRow[];
    }
  | { kind: "delete"; organization: OrganizationTableRow }
  | { kind: "toggle"; organization: OrganizationTableRow };

export interface OrganizationToastState {
  id: number;
  message: string;
  tone: "error" | "success";
  title: string;
}
