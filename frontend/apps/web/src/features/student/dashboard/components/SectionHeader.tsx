import Link from "next/link";

type SectionHeaderProps = {
  actionHref: string;
  actionLabel: string;
  title: string;
};

export const SectionHeader = ({
  actionHref,
  actionLabel,
  title,
}: SectionHeaderProps) => (
  <div className="student-dashboard-section-header">
    <h2 className="student-dashboard-section-title">{title}</h2>
    <Link className="student-dashboard-section-link" href={actionHref}>
      {actionLabel}
    </Link>
  </div>
);
