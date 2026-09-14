import { FolderOpen } from "lucide-react";

export const CourseFoldersState = ({
  label,
  action,
}: {
  label: string;
  action?: React.ReactNode;
}) => {
  return (
    <div className="student-folder-state">
      <FolderOpen size={34} />
      <strong>{label}</strong>
      {action}
    </div>
  );
};
