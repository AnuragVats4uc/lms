import { StudentCourseFolder } from "@repo/types";
import { FileText, FolderOpen, Play, Trophy } from "lucide-react";
import Link from "next/link";

type CourseFoldersGridProps = {
  firstVisibleIndex: number;
  sessionCourseId: number;
  visibleFolders: StudentCourseFolder[];
};

export const CourseFoldersGrid = ({
  firstVisibleIndex,
  sessionCourseId,
  visibleFolders,
}: CourseFoldersGridProps) => {
  return (
    <div className="student-course-folder-grid" aria-label="Course folders">
      {visibleFolders.map((folder, index) => (
        <Link
          className={`student-course-folder-card tone-${((firstVisibleIndex + index) % 5) + 1}`}
          href={`/student/my-courses/${sessionCourseId}/folders/${folder.id}`}
          key={folder.id}
        >
          <div className="student-course-folder-card-header">
            <div className="student-course-folder-card-icon">
              <FolderOpen size={21} />
            </div>
            <div className="student-course-folder-card-copy">
              <h3 title={folder.name}>{folder.name}</h3>
              <p>{folder.description ?? "Course learning resources"}</p>
            </div>
          </div>

          <div className="student-course-folder-card-stats">
            <span title={`${folder.resourceCounts.videos} videos`}>
              <Play aria-hidden="true" size={13} />
              {folder.resourceCounts.videos}
            </span>
            <span title={`${folder.resourceCounts.documents} documents`}>
              <FileText aria-hidden="true" size={13} />
              {folder.resourceCounts.documents}
            </span>
            <span title={`${folder.resourceCounts.exams} exams`}>
              <Trophy aria-hidden="true" size={13} />
              {folder.resourceCounts.exams}
            </span>
          </div>

          <footer>
            <strong>
              {folder.resourceCounts.total}{" "}
              {folder.resourceCounts.total === 1 ? "resource" : "resources"}
            </strong>
            <span>Open →</span>
          </footer>
        </Link>
      ))}
    </div>
  );
};
