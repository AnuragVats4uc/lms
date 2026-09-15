import type { StudentSelfProfile } from "@repo/types";

export const getInitials = (name: string) => {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};
export const sentenceCase = (value: string) => {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (character) => character.toUpperCase());
};
export const fieldLabel = (value: string) => {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (character) => character.toUpperCase());
};
export const formatAddress = (profile: StudentSelfProfile["profile"]) => {
  return [profile.address, profile.city, profile.state, profile.postalCode]
    .filter(Boolean)
    .join(", ");
};
export const joinContact = (name: string | null, phone: string | null) => {
  return [name, phone].filter(Boolean).join(" · ");
};
export const formatDate = (value: string) => {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};
export const formatDateTime = (value: string) => {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};
