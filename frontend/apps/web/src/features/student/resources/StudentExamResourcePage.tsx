"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileQuestion,
  RefreshCw,
  Trophy,
} from "lucide-react";
import { studentsApi } from "@repo/api";

export function StudentExamResourcePage({
  resourceId,
}: {
  resourceId: number;
}) {
  const router = useRouter();
  const query = useQuery({
    queryKey: ["student-exam-resource", resourceId],
    queryFn: () => studentsApi.findMyExamResource(resourceId),
    staleTime: 15_000,
  });
  const startMutation = useMutation({
    mutationFn: () => studentsApi.startMyExam(resourceId),
    onSuccess: (result) =>
      router.push(`/student/exam-attempts/${result.attemptUuid}`),
  });
  if (query.isLoading)
    return (
      <div className="student-folder-state">
        <Trophy size={34} />
        <strong>Loading exam...</strong>
      </div>
    );
  if (query.isError || !query.data)
    return (
      <div className="student-folder-state">
        <Trophy size={34} />
        <strong>This exam is unavailable or is not assigned to you.</strong>
        <button
          className="student-folder-primary-button"
          onClick={() => query.refetch()}
        >
          <RefreshCw size={15} /> Retry
        </button>
      </div>
    );
  const data = query.data;
  const openExam = () => {
    if (data.exam.action === "RESUME" && data.exam.activeAttemptUuid) {
      router.push(`/student/exam-attempts/${data.exam.activeAttemptUuid}`);
      return;
    }
    if (data.exam.action === "VIEW_RESULT" && data.exam.latestAttemptUuid) {
      router.push(
        `/student/exam-attempts/${data.exam.latestAttemptUuid}/report`,
      );
      return;
    }
    startMutation.mutate();
  };
  return (
    <main className="student-folder-page">
      <nav className="student-folder-breadcrumb" aria-label="Breadcrumb">
        <Link href="/student/my-courses">My Courses</Link>
        <span>/</span>
        <Link href={`/student/my-courses/${data.course.id}`}>
          {data.course.name}
        </Link>
        <span>/</span>
        <Link
          href={`/student/my-courses/${data.course.id}/folders/${data.folder.id}`}
        >
          {data.folder.name}
        </Link>
        <span>/</span>
        <span>{data.title}</span>
      </nav>
      <section className="student-exam-hero">
        <div>
          <span className="student-folder-eyebrow">{data.exam.code}</span>
          <h1>{data.exam.title}</h1>
          <p>
            {data.description ??
              "Read the instructions before starting this assessment."}
          </p>
        </div>
        <span
          className={`student-exam-availability ${data.exam.availability.toLowerCase()}`}
        >
          {data.exam.availability}
        </span>
      </section>
      <section className="student-exam-stat-grid">
        <ExamStat
          icon={Clock3}
          value={`${data.exam.durationMinutes} min`}
          label="Exam duration"
        />
        <ExamStat
          icon={FileQuestion}
          value={String(data.exam.questionCount)}
          label="Questions"
        />
        <ExamStat
          icon={Trophy}
          value={String(data.exam.maximumMarks)}
          label="Maximum marks"
        />
        <ExamStat
          icon={CheckCircle2}
          value={`${data.exam.attemptsUsed}/${data.exam.attemptLimit}`}
          label="Attempts used"
        />
      </section>
      <div className="student-exam-layout">
        <section className="student-exam-card">
          <h2>Sections</h2>
          {data.exam.sections.map((section) => (
            <article className="student-exam-section" key={section.id}>
              <div>
                <strong>{section.name}</strong>
                <span>{section.subjects.join(", ")}</span>
              </div>
              <div>
                <span>{section.questionCount} questions</span>
                <span>{section.durationMinutes} min</span>
                <span>{section.maximumMarks} marks</span>
              </div>
            </article>
          ))}
        </section>
        <aside className="student-exam-card">
          <h2>Availability</h2>
          <p>
            <CalendarClock size={16} /> Opens{" "}
            {new Date(data.exam.availableFrom).toLocaleString()}
          </p>
          <p>
            <CalendarClock size={16} /> Closes{" "}
            {new Date(data.exam.availableUntil).toLocaleString()}
          </p>
          <h2>Instructions</h2>
          <p>
            {data.exam.instructions ??
              "Answer every question carefully. Submit before the timer ends."}
          </p>
          <button
            className="student-folder-primary-button exam-start"
            disabled={
              data.exam.action === "UNAVAILABLE" || startMutation.isPending
            }
            onClick={openExam}
          >
            {startMutation.isPending
              ? "Starting exam..."
              : data.exam.action === "RESUME"
                ? "Resume exam"
                : data.exam.action === "VIEW_RESULT"
                  ? "View result"
                  : data.exam.action === "START"
                    ? "Start exam"
                    : "Exam unavailable"}
          </button>
          {startMutation.isError ? (
            <small role="alert">Unable to start the exam. Please try again.</small>
          ) : null}
        </aside>
      </div>
    </main>
  );
}

function ExamStat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Clock3;
  value: string;
  label: string;
}) {
  return (
    <div className="student-exam-stat">
      <Icon size={20} />
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
