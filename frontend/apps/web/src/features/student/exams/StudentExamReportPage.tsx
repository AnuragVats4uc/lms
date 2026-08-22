"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { studentsApi } from "@repo/api";
import { CheckCircle2, Clock3, RefreshCw, Target, Trophy, XCircle } from "lucide-react";

import styles from "./StudentExamReportPage.module.css";

export function StudentExamReportPage({ attemptUuid }: { attemptUuid: string }) {
  const query = useQuery({
    queryKey: ["student-exam-report", attemptUuid],
    queryFn: () => studentsApi.findMyExamReport(attemptUuid),
  });
  if (query.isLoading) return <div className={styles.state}><Trophy size={36} /><strong>Preparing your report...</strong></div>;
  if (query.isError || !query.data)
    return <div className={styles.state}><XCircle size={36} /><strong>Unable to load this report</strong><button onClick={() => query.refetch()}><RefreshCw size={16} /> Retry</button></div>;
  const report = query.data;
  if (!report.released)
    return (
      <main className={styles.page}>
        <section className={styles.pending}><Clock3 size={42} /><h1>Result pending</h1><p>{report.message}</p><Link href="/student/my-courses">Back to My Courses</Link></section>
      </main>
    );
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div><span>ATTEMPT {report.attemptNumber}</span><h1>{report.title}</h1><p>Submitted {report.submittedAt ? new Date(report.submittedAt).toLocaleString() : "recently"}</p></div>
        {report.score !== undefined ? <div className={styles.score}><Trophy size={25} /><strong>{report.score}<small> / {report.maximumScore}</small></strong><span>{report.percentage}%</span></div> : null}
      </header>
      {report.summary ? (
        <section className={styles.stats}>
          <Stat icon={Target} label="Questions" value={report.summary.total} />
          <Stat icon={CheckCircle2} label="Correct" value={report.summary.correct} tone="green" />
          <Stat icon={XCircle} label="Incorrect" value={report.summary.incorrect} tone="red" />
          <Stat icon={Clock3} label="Time used" value={formatDuration(report.durationSeconds ?? 0)} />
        </section>
      ) : null}
      {report.questions?.length ? (
        <section className={styles.review}>
          <h2>Question review</h2>
          {report.questions.map((question) => (
            <article key={question.id} className={styles.question}>
              <div className={styles.questionHeader}><strong>Question {question.order} · {question.code}</strong><span className={question.isCorrect ? styles.correct : styles.incorrect}>{question.isCorrect ? "Correct" : "Incorrect"} · {question.marksAwarded} marks</span></div>
              <div className={styles.rich} dangerouslySetInnerHTML={{ __html: question.content }} />
              {question.explanation ? <div className={styles.explanation}><strong>Explanation</strong><div className={styles.rich} dangerouslySetInnerHTML={{ __html: question.explanation }} /></div> : null}
            </article>
          ))}
        </section>
      ) : null}
      <footer><Link href="/student/my-courses">Back to My Courses</Link></footer>
    </main>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Target; label: string; value: string | number; tone?: "green" | "red" }) {
  return <div className={`${styles.stat} ${tone ? styles[tone] : ""}`}><Icon size={21} /><div><strong>{value}</strong><span>{label}</span></div></div>;
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
}
