import { Text } from "@repo/ui";

import { DataTableWebsiteCell } from "@/components/DataTable";

import type { OrganizationTableRow } from "../../types";
import { normalizeWebsite } from "../../utils";

export const WebsiteCell = ({
  organization,
}: {
  organization: OrganizationTableRow;
}) => {
  const website = normalizeWebsite(organization.website);

  if (!website) {
    return (
      <Text color="#52627A" fontSize="$caption">
        -
      </Text>
    );
  }

  return (
    <DataTableWebsiteCell
      href={website}
      label={organization.domain ?? website}
    />
  );
};
