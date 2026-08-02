import type { Organization } from "@repo/types";

import type {
  OrganizationAdministrator,
  OrganizationSyncStatus,
} from "../types";

export const getDomain = (organization: Organization): string | null => {
  const fromWebsite = organization.website
    ?.replace(/^https?:\/\//u, "")
    .split("/")[0];
  const fromEmail = organization.email?.split("@")[1];

  return fromWebsite || fromEmail || null;
};

export const getAdministrator = (
  organization: Organization,
): OrganizationAdministrator | null => {
  if (!organization.email) {
    return null;
  }

  const name = organization.email
    .split("@")[0]
    .split(/[._-]/u)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");

  return {
    email: organization.email,
    name: name || "Primary Administrator",
  };
};

export const getSyncStatus = (
  organization: Organization,
): OrganizationSyncStatus => {
  if (!organization.isActive) {
    return "PENDING";
  }

  return "SYNCED";
};

export const normalizeWebsite = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  return /^https?:\/\//u.test(value) ? value : `https://${value}`;
};
