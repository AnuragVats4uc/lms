"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FileText, FolderOpen, Play, RefreshCw, Trophy } from "lucide-react";
import { studentsApi } from "@repo/api";

export function StudentCourseFoldersPage({
  sessionCourseId,
}: {
  sessionCourseId: number;
}) {
  const query = useQuery({
    queryKey: ["student-course-folders", sessionCourseId],
    queryFn: () => studentsApi.findMyCourseFolders(sessionCourseId),
    staleTime: 30_000,
  });

  if (query.isLoading) {
    return <CourseFoldersState label="Loading course folders..." />;
  }

  if (query.isError || !query.data) {
    return (
      <CourseFoldersState
        label="We could not load this assigned course."
        action={
          <button
            className="student-folder-primary-button"
            onClick={() => query.refetch()}
          >
            <RefreshCw size={15} /> Retry
          </button>
        }
      />
    );
  }

  const { course, folders } = query.data;

  return (
    <main className="student-folder-page">
      <nav className="student-folder-breadcrumb" aria-label="Breadcrumb">
        <Link href="/student/my-courses">My Courses</Link>
        <span>/</span>
        <span>{course.name}</span>
      </nav>

      <header className="student-folder-page-header">
        <div>
          <span className="student-folder-eyebrow">{course.sessionName}</span>
          <h1>{course.name}</h1>
          <p>{course.description ?? "Choose a folder to continue learning."}</p>
        </div>
        <div className="student-folder-total">
          <FolderOpen size={21} />
          <strong>{folders.length}</strong>
          <span>Folders</span>
        </div>
      </header>

      {folders.length ? (
        <section className="student-folder-grid" aria-label="Course folders">
          {folders.map((folder, index) => (
            <Link
              className={`student-folder-card tone-${(index % 4) + 1}`}
              href={`/student/my-courses/${sessionCourseId}/folders/${folder.id}`}
              key={folder.id}
            >
              <div className="student-folder-card-icon">
                <FolderOpen size={25} />
              </div>
              <div className="student-folder-card-copy">
                <h2>{folder.name}</h2>
                <p>{folder.description ?? "Course learning resources"}</p>
              </div>
              <div className="student-folder-card-stats">
                <span>
                  <Play size={14} /> {folder.resourceCounts.videos} videos
                </span>
                <span>
                  <FileText size={14} /> {folder.resourceCounts.documents}{" "}
                  documents
                </span>
                <span>
                  <Trophy size={14} /> {folder.resourceCounts.exams} exams
                </span>
              </div>
              <footer>
                <strong>{folder.resourceCounts.total} resources</strong>
                <span>Open folder →</span>
              </footer>
            </Link>
          ))}
        </section>
      ) : (
        <CourseFoldersState label="No learning folders are available for this course yet." />
      )}
    </main>
  );
}

function CourseFoldersState({
  label,
  action,
}: {
  label: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="student-folder-state">
      <FolderOpen size={34} />
      <strong>{label}</strong>
      {action}
    </div>
  );
}
