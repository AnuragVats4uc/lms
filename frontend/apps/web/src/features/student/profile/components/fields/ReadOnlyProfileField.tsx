import { LockKeyhole, UserRound } from "lucide-react";

export const ReadOnlyField = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) => {
  return (
    <div>
      <Icon size={16} />
      <span>
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
      <LockKeyhole size={14} />
    </div>
  );
};
