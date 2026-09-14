import type { LucideIcon } from "lucide-react";

type ResourceSummaryCardProps = {
  Icon: LucideIcon;
  label: string;
  loading: boolean;
  supportingText: string;
  tone: "green" | "purple" | "orange";
  value: number;
};

export function ResourceSummaryCard({
  Icon,
  label,
  loading,
  supportingText,
  tone,
  value,
}: ResourceSummaryCardProps) {
  return (
    <div className="student-resource-summary-card">
      <div className={`student-resource-summary-icon ${tone}`}>
        <Icon aria-hidden="true" size={22} strokeWidth={2} />
      </div>
      <div className="student-resource-summary-copy">
        <span>{label}</span>
        {loading ? (
          <div className="student-resource-summary-skeleton" />
        ) : (
          <strong>{value.toLocaleString()}</strong>
        )}
        <small>{supportingText}</small>
      </div>
    </div>
  );
}
