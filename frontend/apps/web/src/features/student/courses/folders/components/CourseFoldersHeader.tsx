import { FileText, FolderOpen, Trophy } from "lucide-react";
import { SummaryItem } from "./FolderSummary";
import { StudentCourseContext, StudentCourseFolder } from "@repo/types";

type CourseFolderHeaderProps = {
  course: StudentCourseContext;
  folders: StudentCourseFolder[];
  summary: {
    exams: number;
    resources: number;
  };
};

export const CourseFoldersHeader = ({
  course,
  folders,
  summary,
}: CourseFolderHeaderProps) => {
  return (
    <header className="student-course-folder-hero">
      <div className="student-course-folder-hero-copy">
        <span className="student-folder-eyebrow">{course.sessionName}</span>
        <h1>{course.name}</h1>
        <p>{course.description ?? "Choose a folder to continue learning."}</p>
      </div>

      <div className="student-course-folder-summary">
        <SummaryItem
          icon={<FolderOpen size={19} />}
          label="Folders"
          value={folders.length}
        />
        <SummaryItem
          icon={<FileText size={19} />}
          label="Resources"
          value={summary.resources}
        />
        <SummaryItem
          icon={<Trophy size={19} />}
          label="Exams"
          value={summary.exams}
        />
      </div>
    </header>
  );
};
