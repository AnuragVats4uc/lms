import type { LucideIcon } from "lucide-react";

type ResourceSummaryItemProps = {
  icon: LucideIcon;
  label: string;
  tone: string;
  value: number;
};

export const ResourceSummaryItem =({
  icon: Icon,
  label,
  tone,
  value,
}: ResourceSummaryItemProps) =>{
  return (
    <div className={`student-resource-list-summary-item ${tone}`}>
      <Icon aria-hidden="true" size={18} />
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
