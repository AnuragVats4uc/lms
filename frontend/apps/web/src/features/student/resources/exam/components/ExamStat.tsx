import type { LucideIcon } from "lucide-react";

type ExamStatProps = {
  icon: LucideIcon;
  label: string;
  value: string;
};

export const ExamStat = ({ icon: Icon, value, label }: ExamStatProps) => {
  return (
    <div className="student-exam-stat">
      <Icon size={20} />
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
};
