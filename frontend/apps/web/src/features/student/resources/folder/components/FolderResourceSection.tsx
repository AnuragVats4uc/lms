import { StudentFolderResourceList } from "@repo/types";
import { FileText, FolderOpen, Play, Trophy } from "lucide-react";
import Link from "next/link";

type FolderResourceSectionProps = {
  data: NoInfer<StudentFolderResourceList> | undefined;
  sessionCourseId: number;
};

export const FolderResourceSection = ({
  data,
  sessionCourseId,
}: FolderResourceSectionProps) => {
  return (
    <section
      className="student-course-folder-section"
      aria-labelledby="child-folders-title"
    >
      <div className="student-course-folder-toolbar">
        <div className="student-course-folder-heading">
          <h2 id="child-folders-title">Folders</h2>
          <span>Continue through this section</span>
        </div>
      </div>

      <div className="student-course-folder-grid" aria-label="Child folders">
        {data?.folders?.map((folder, index) => (
          <Link
            className={`student-course-folder-card tone-${(index % 5) + 1}`}
            href={`/student/my-courses/${sessionCourseId}/folders/${folder.id}`}
            key={folder.id}
          >
            <div className="student-course-folder-card-header">
              <div className="student-course-folder-card-icon">
                <FolderOpen size={21} />
              </div>
              <div className="student-course-folder-card-copy">
                <h3 title={folder.name}>{folder.name}</h3>
                <p>
                  {folder.description ??
                    (folder.childrenCount
                      ? `${folder.childrenCount} nested folders`
                      : "Course learning resources")}
                </p>
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
                {folder.childrenCount
                  ? `${folder.childrenCount} folders`
                  : `${folder.resourceCounts.total} resources`}
              </strong>
              <span>Open &rarr;</span>
            </footer>
          </Link>
        ))}
      </div>
    </section>
  );
};
