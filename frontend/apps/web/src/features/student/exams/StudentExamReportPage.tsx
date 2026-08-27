"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { studentsApi } from "@repo/api";
import type { StudentExamPerformanceMetric } from "@repo/types";
import {
  Award,
  BarChart3,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Target,
  TrendingUp,
  Trophy,
  XCircle,
} from "lucide-react";

import styles from "./StudentExamReportPage.module.css";

export function StudentExamReportPage({
  attemptUuid,
}: {
  attemptUuid: string;
}) {
  const query = useQuery({
    queryKey: ["student-exam-report", attemptUuid],
    queryFn: () => studentsApi.findMyExamReport(attemptUuid),
  });
  if (query.isLoading)
    return (
      <div className={styles.state}>
        <Trophy size={36} />
        <strong>Preparing your report...</strong>
      </div>
    );
  if (query.isError || !query.data)
    return (
      <div className={styles.state}>
        <XCircle size={36} />
        <strong>Unable to load this report</strong>
        <button onClick={() => query.refetch()}>
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  const report = query.data;
  if (!report.released)
    return (
      <main className={styles.page}>
        <section className={styles.pending}>
          <Clock3 size={42} />
          <h1>Result pending</h1>
          <p>{report.message}</p>
          <Link href="/student/my-courses">Back to My Courses</Link>
        </section>
      </main>
    );

  const topicPerformance = report.performance?.topics ?? [];
  const strongTopics = topicPerformance.filter(
    (topic) => topic.classification === "STRONG",
  ).length;
  const weakTopics = topicPerformance.filter(
    (topic) => topic.classification === "WEAK",
  ).length;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span>ATTEMPT {report.attemptNumber}</span>
          <h1>{report.title}</h1>
          <p>
            Submitted{" "}
            {report.submittedAt
              ? new Date(report.submittedAt).toLocaleString()
              : "recently"}
          </p>
        </div>
        {report.score !== undefined ? (
          <div className={styles.score}>
            <Trophy size={25} />
            <strong>
              {report.score}
              <small> / {report.maximumScore}</small>
            </strong>
            <span>{report.percentage}% overall</span>
          </div>
        ) : null}
      </header>

      {report.summary ? (
        <section className={styles.stats} aria-label="Exam summary">
          <Stat
            icon={Target}
            label="Accuracy"
            value={`${report.summary.accuracy}%`}
          />
          <Stat
            icon={Award}
            label={`Rank of ${report.cohortSize ?? 0}`}
            value={report.rank ? `#${report.rank}` : "—"}
            tone="green"
          />
          <Stat
            icon={TrendingUp}
            label="Percentile"
            value={report.percentile == null ? "—" : `${report.percentile}%`}
          />
          <Stat
            icon={Clock3}
            label="Time used"
            value={formatDuration(report.durationSeconds ?? 0)}
          />
          <Stat
            icon={CheckCircle2}
            label="Correct"
            value={report.summary.correct}
            tone="green"
          />
          <Stat
            icon={XCircle}
            label="Incorrect"
            value={report.summary.incorrect}
            tone="red"
          />
          <Stat
            icon={BarChart3}
            label="Attempted"
            value={`${report.summary.attempted} / ${report.summary.total}`}
          />
          <Stat
            icon={Target}
            label="Unattempted"
            value={report.summary.unattempted}
          />
        </section>
      ) : null}

      {report.performance ? (
        <section className={styles.performanceGrid}>
          <PerformancePanel
            heading="Section performance"
            metrics={report.performance.sections}
          />
          <section className={styles.performancePanel}>
            <div className={styles.panelHeading}>
              <div>
                <span>LEARNING AREAS</span>
                <h2>Topic performance</h2>
              </div>
              <div className={styles.topicCounts}>
                <b>{strongTopics} strong</b>
                <b data-tone="weak">{weakTopics} need focus</b>
              </div>
            </div>
            <div className={styles.metricList}>
              {topicPerformance.map((topic) => (
                <MetricRow
                  key={topic.key}
                  metric={topic}
                  context={topic.subjectName}
                  classification={topic.classification}
                />
              ))}
              {!topicPerformance.length ? (
                <p className={styles.noMetrics}>No topic data is available.</p>
              ) : null}
            </div>
          </section>
        </section>
      ) : null}

      {report.trend?.length ? (
        <section className={styles.trendPanel}>
          <div className={styles.panelHeading}>
            <div>
              <span>RECENT RESULTS</span>
              <h2>Performance trend</h2>
            </div>
            <p>Up to 10 completed exams in this course</p>
          </div>
          <div className={styles.trendChart}>
            {report.trend.map((point) => (
              <div className={styles.trendItem} key={point.attemptUuid}>
                <strong>{point.percentage}%</strong>
                <div>
                  <span
                    style={{ height: `${Math.max(4, point.percentage)}%` }}
                  />
                </div>
                <small title={point.exam.title}>{point.exam.code}</small>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {report.questions?.length ? (
        <section className={styles.review}>
          <h2>Question review</h2>
          {report.questions.map((question) => (
            <article key={question.id} className={styles.question}>
              <div className={styles.questionHeader}>
                <div>
                  <strong>
                    Question {question.order} · {question.code}
                  </strong>
                  <small>
                    {question.section.name} · {question.subject.name}
                    {question.topic ? ` · ${question.topic.name}` : ""}
                  </small>
                </div>
                <span
                  className={
                    question.answerState === "CORRECT"
                      ? styles.correct
                      : question.answerState === "INCORRECT"
                        ? styles.incorrect
                        : styles.unattempted
                  }
                >
                  {question.answerState === "UNATTEMPTED"
                    ? "Unattempted"
                    : question.answerState === "CORRECT"
                      ? "Correct"
                      : "Incorrect"}{" "}
                  · {question.marksAwarded} marks
                </span>
              </div>
              <div
                className={styles.rich}
                dangerouslySetInnerHTML={{ __html: question.content }}
              />
              {question.explanation ? (
                <div className={styles.explanation}>
                  <strong>Explanation</strong>
                  <div
                    className={styles.rich}
                    dangerouslySetInnerHTML={{ __html: question.explanation }}
                  />
                </div>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}
      <footer>
        <Link href="/student/my-courses">Back to My Courses</Link>
      </footer>
    </main>
  );
}

function PerformancePanel({
  heading,
  metrics,
}: {
  heading: string;
  metrics: StudentExamPerformanceMetric[];
}) {
  return (
    <section className={styles.performancePanel}>
      <div className={styles.panelHeading}>
        <div>
          <span>BREAKDOWN</span>
          <h2>{heading}</h2>
        </div>
      </div>
      <div className={styles.metricList}>
        {metrics.map((metric) => (
          <MetricRow key={metric.key} metric={metric} />
        ))}
        {!metrics.length ? (
          <p className={styles.noMetrics}>No performance data is available.</p>
        ) : null}
      </div>
    </section>
  );
}

function MetricRow({
  metric,
  context,
  classification,
}: {
  metric: StudentExamPerformanceMetric;
  context?: string;
  classification?: "STRONG" | "DEVELOPING" | "WEAK" | "NOT_ATTEMPTED";
}) {
  return (
    <article className={styles.metricRow}>
      <div className={styles.metricTitle}>
        <div>
          <strong>{metric.label}</strong>
          <span>
            {context ? `${context} · ` : ""}
            {metric.correct} correct · {metric.incorrect} incorrect ·{" "}
            {metric.unattempted} skipped
          </span>
        </div>
        {classification ? (
          <b data-classification={classification}>
            {classification.replace("_", " ")}
          </b>
        ) : null}
      </div>
      <div className={styles.metricBar} aria-hidden="true">
        <span style={{ width: `${Math.max(0, metric.percentage)}%` }} />
      </div>
      <div className={styles.metricValues}>
        <strong>{metric.percentage}%</strong>
        <span>{metric.accuracy}% accuracy</span>
        <span>
          {metric.marksAwarded} / {metric.maximumMarks} marks
        </span>
        <span>{formatDuration(metric.timeSpentSeconds)}</span>
      </div>
    </article>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Target;
  label: string;
  value: string | number;
  tone?: "green" | "red";
}) {
  return (
    <div className={`${styles.stat} ${tone ? styles[tone] : ""}`}>
      <Icon size={21} />
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
}
