import type { ReactNode } from "react";

type ResourceFilterFieldProps = {
  children: ReactNode;
  className?: string;
  label: string;
};

export function ResourceFilterField({
  children,
  className = "",
  label,
}: ResourceFilterFieldProps) {
  return (
    <label className={`student-resource-filter-field ${className}`.trim()}>
      <span>{label}</span>
      {children}
    </label>
  );
}
