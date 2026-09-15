import type { LucideIcon } from "lucide-react";
export const ProfileContactRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string | null;
}) => (
  <div>
    <span>
      <Icon size={16} />
    </span>
    <p>
      <small>{label}</small>
      <strong>{value || "Not provided"}</strong>
    </p>
  </div>
);
