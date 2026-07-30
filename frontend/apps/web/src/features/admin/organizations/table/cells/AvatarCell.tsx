import {
  DataTableAvatarCell,
  DataTableTextCell,
} from "@/components/DataTable";

import type { OrganizationTableRow } from "../../types";

export function AvatarCell({
  organization,
}: {
  organization: OrganizationTableRow;
}) {
  return (
    <DataTableAvatarCell
      imageSrc={organization.logo ?? undefined}
      label={organization.name}
      subtitle={`${organization.code}${
        organization.description ? ` - ${organization.description}` : ""
      }`}
    />
  );
}

export function AdministratorAvatarCell({
  organization,
}: {
  organization: OrganizationTableRow;
}) {
  if (!organization.primaryAdministrator) {
    return (
      <DataTableTextCell
        primary="Not assigned"
        secondary="No administrator"
      />
    );
  }

  return (
    <DataTableAvatarCell
      imageSrc={organization.primaryAdministrator.avatar}
      label={organization.primaryAdministrator.name}
      subtitle={organization.primaryAdministrator.email}
    />
  );
}
