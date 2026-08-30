"use client";

import Link from "next/link";
import {
  useState,
  type CSSProperties,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { studentsApi } from "@repo/api";
import type {
  StudentExamPerformanceMetric,
  StudentExamReport,
} from "@repo/types";
import {
  AlertTriangle,
  Award,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Download,
  Flag,
  Gauge,
  Lightbulb,
  RefreshCw,
  Search,
  Target,
  TimerReset,
  TrendingUp,
  Trophy,
  XCircle,
} from "lucide-react";

import styles from "./StudentExamReportPage.module.css";

type QuestionFilter =
  "ALL" | "CORRECT" | "INCORRECT" | "UNATTEMPTED" | "MARKED";
type QuestionSort = "ORDER" | "MARKS_LOST" | "SLOWEST";

export function StudentExamReportPage({
  attemptId,
  attemptUuid,
}: {
  attemptId: number;
  attemptUuid: string;
}) {
  const [questionFilter, setQuestionFilter] = useState<QuestionFilter>("ALL");
  const [questionSearch, setQuestionSearch] = useState("");
  const [questionSort, setQuestionSort] = useState<QuestionSort>("ORDER");
  const [activeSection, setActiveSection] = useState("overview");
  const query = useQuery({
    queryKey: ["student-exam-report", attemptId, attemptUuid],
    queryFn: () => studentsApi.findMyExamReport(attemptId, attemptUuid),
  });

  if (query.isLoading) {
    return (
      <div className={styles.state}>
        <Trophy size={36} />
        <strong>Preparing your detailed report…</strong>
      </div>
    );
  }
  if (query.isError || !query.data) {
    return (
      <div className={styles.state}>
        <XCircle size={36} />
        <strong>Unable to load this report</strong>
        <button onClick={() => query.refetch()} type="button">
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  const report = query.data;
  if (!report.released) {
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
  }

  const summary = report.summary;
  const sectionPerformance = report.performance?.sections ?? [];
  const subjectPerformance = report.performance?.subjects ?? [];
  const topicPerformance = report.performance?.topics ?? [];
  const questionTypePerformance = report.performance?.questionTypes ?? [];
  const difficultyPerformance = [
    ...(report.performance?.difficulties ?? []),
  ].sort(
    (left, right) =>
      difficultyOrder(left.difficulty) - difficultyOrder(right.difficulty),
  );
  const strongTopics = topicPerformance.filter(
    (topic) => topic.classification === "STRONG",
  );
  const weakTopics = topicPerformance.filter(
    (topic) => topic.classification === "WEAK",
  );
  const normalizedSearch = questionSearch.trim().toLowerCase();
  const questions = report.questions ?? [];
  const filteredQuestions = questions
    .filter((question) => {
      const matchesState =
        questionFilter === "ALL" ||
        (questionFilter === "MARKED"
          ? question.markedForReview
          : question.answerState === questionFilter);
      const matchesSearch =
        !normalizedSearch ||
        question.code.toLowerCase().includes(normalizedSearch) ||
        question.section.name.toLowerCase().includes(normalizedSearch) ||
        question.subject.name.toLowerCase().includes(normalizedSearch) ||
        question.topic?.name.toLowerCase().includes(normalizedSearch) ||
        question.questionType.name.toLowerCase().includes(normalizedSearch) ||
        question.difficulty.toLowerCase().includes(normalizedSearch);
      return matchesState && matchesSearch;
    })
    .sort((left, right) => {
      if (questionSort === "SLOWEST") {
        return right.timeSpentSeconds - left.timeSpentSeconds;
      }
      if (questionSort === "MARKS_LOST") {
        return (
          right.maximumMarks -
          right.marksAwarded -
          (left.maximumMarks - left.marksAwarded)
        );
      }
      return left.order - right.order;
    });
  const distributionStyle = {
    "--correct": `${summary?.total ? (summary.correct / summary.total) * 100 : 0}%`,
    "--attempted": `${
      summary?.total
        ? ((summary.correct + summary.incorrect) / summary.total) * 100
        : 0
    }%`,
  } as CSSProperties;
  const scoreStyle = {
    "--score": `${Math.min(100, Math.max(0, report.percentage ?? 0))}%`,
  } as CSSProperties;
  const passingPercentage = report.result?.passingPercentage;
  const cohortReady = (report.cohortSize ?? 0) > 1;
  const correctShare = summary?.attempted
    ? roundPercentage((summary.correct / summary.attempted) * 100)
    : 0;
  const incorrectShare = summary?.attempted
    ? roundPercentage((summary.incorrect / summary.attempted) * 100)
    : 0;
  const unansweredShare = summary?.total
    ? roundPercentage((summary.unattempted / summary.total) * 100)
    : 0;
  const sortedTopics = [...topicPerformance].sort(
    (left, right) =>
      right.maximumMarks -
      right.marksAwarded -
      (left.maximumMarks - left.marksAwarded),
  );
  const focusTopics = sortedTopics.filter(
    (topic) =>
      topic.classification === "WEAK" || topic.classification === "DEVELOPING",
  );
  const timedQuestions = questions.filter(
    (question) => question.timeSpentSeconds > 0,
  );
  const slowestQuestions = [...timedQuestions]
    .sort((left, right) => right.timeSpentSeconds - left.timeSpentSeconds)
    .slice(0, 3);
  const medianQuestionSeconds = median(
    timedQuestions.map((question) => question.timeSpentSeconds),
  );
  const rushedIncorrect = questions
    .filter(
      (question) =>
        question.answerState === "INCORRECT" &&
        question.timeSpentSeconds > 0 &&
        question.timeSpentSeconds < medianQuestionSeconds,
    )
    .sort((left, right) => left.timeSpentSeconds - right.timeSpentSeconds)
    .slice(0, 3);
  const trendDelta =
    report.trend && report.trend.length > 1
      ? roundPercentage(
          report.trend.at(-1)!.percentage - report.trend.at(-2)!.percentage,
        )
      : null;

  return (
    <main className={styles.page}>
      <header className={styles.resultHero}>
        <div className={styles.resultIdentity}>
          <nav aria-label="Breadcrumb">
            <Link href="/student/my-courses">My Courses</Link>
            <span>/</span>
            <span>Exam Report</span>
          </nav>
          <p>STUDENT EXAM REPORT</p>
          <h1>{report.title}</h1>
          <span>
            Attempt {report.attemptNumber ?? "—"} · Submitted{" "}
            {report.submittedAt
              ? new Date(report.submittedAt).toLocaleString()
              : "recently"}
          </span>
          <small className={styles.submissionContext}>
            · {submissionReasonLabel(report.submissionReason)}
          </small>
        </div>

        {report.score !== undefined ? (
          <div className={styles.resultScore}>
            <div className={styles.scoreRing} style={scoreStyle}>
              <strong>{report.percentage ?? 0}%</strong>
              <span>overall</span>
            </div>
            <div>
              {report.result ? (
                <span
                  className={styles.resultBadge}
                  data-status={report.result.status}
                >
                  <CheckCircle2 size={14} />
                  {formatResultStatus(report.result.status)}
                </span>
              ) : null}
              <strong>
                {report.score} <small>/ {report.maximumScore} marks</small>
              </strong>
              <span>
                {passingPercentage === null || passingPercentage === undefined
                  ? "Passing threshold not configured"
                  : `Pass threshold: ${passingPercentage}%`}
              </span>
            </div>
          </div>
        ) : null}

        <div className={styles.heroActions}>
          <button onClick={() => window.print()} type="button">
            <Download size={16} /> Print / save PDF
          </button>
          <Link href="/student/my-courses">Back to course</Link>
        </div>
      </header>

      <nav className={styles.reportNav} aria-label="Report sections">
        {[
          ["overview", "Overview"],
          ["sections", "Sections"],
          ["topics", "Topics"],
          ["difficulty", "Difficulty"],
          ["time-analysis", "Time Analysis"],
          ["questions", "Questions"],
        ].map(([id, label]) => (
          <a
            data-active={activeSection === id}
            href={`#${id}`}
            key={id}
            onClick={() => setActiveSection(id)}
          >
            {label}
          </a>
        ))}
      </nav>

      {summary ? (
        <section className={styles.kpiGrid} aria-label="Exam summary">
          <Kpi
            detail={`${correctShare}% of attempted`}
            icon={CheckCircle2}
            label="Correct"
            tone="green"
            value={summary.correct}
          />
          <Kpi
            detail={`${incorrectShare}% of attempted`}
            icon={XCircle}
            label="Incorrect"
            tone="red"
            value={summary.incorrect}
          />
          <Kpi
            detail={`${unansweredShare}% of total`}
            icon={BookOpenCheck}
            label="Unanswered"
            value={summary.unattempted}
          />
          <Kpi
            detail={`${summary.attempted} questions attempted`}
            icon={Target}
            label="Accuracy"
            tone="blue"
            value={`${summary.accuracy}%`}
          />
          <Kpi
            detail={
              cohortReady
                ? `of ${report.cohortSize} students`
                : "More students are required"
            }
            icon={Award}
            label="Rank"
            tone="green"
            value={cohortReady && report.rank ? `#${report.rank}` : "—"}
          />
          <Kpi
            detail={`Average ${formatDuration(report.timeAnalysis?.averageTimePerQuestion ?? 0)} / question`}
            icon={Clock3}
            label="Time used"
            tone="purple"
            value={formatDuration(report.durationSeconds ?? 0)}
          />
        </section>
      ) : null}

      {summary ? (
        <aside
          className={styles.reportGuide}
          aria-label="How to read this report"
        >
          <Lightbulb size={18} />
          <div>
            <strong>How to read this report</strong>
            <span>
              <b>Score</b> includes marks and penalties. <b>Accuracy</b>{" "}
              measures correct answers among attempted questions.{" "}
              <b>Completion</b> shows how much of the exam you attempted.
              Question timing is estimated.
            </span>
          </div>
        </aside>
      ) : null}

      {summary ? (
        <section className={styles.overviewGrid} id="overview">
          <article className={styles.panel}>
            <PanelHeading
              eyebrow="PERFORMANCE OVERVIEW"
              heading="Answer distribution"
              text="See how many questions were correct, incorrect, or left unanswered."
            />
            <div className={styles.distributionBody}>
              <div
                className={styles.distributionRing}
                style={distributionStyle}
              >
                <strong>{summary.attempted}</strong>
                <small>attempted</small>
              </div>
              <div className={styles.legend}>
                <Legend
                  label="Correct"
                  tone="correct"
                  value={summary.correct}
                />
                <Legend
                  label="Incorrect"
                  tone="incorrect"
                  value={summary.incorrect}
                />
                <Legend
                  label="Unanswered"
                  tone="unattempted"
                  value={summary.unattempted}
                />
              </div>
            </div>
            <InsightText>
              You answered {summary.accuracy}% of attempted questions correctly.
              Review incorrect answers before your next attempt.
            </InsightText>
          </article>

          <article className={styles.panel}>
            <PanelHeading
              eyebrow="SCORE & PACE"
              heading="Progress against the target"
              text="Compare your score with the pass threshold and review your examination pace."
            />
            <div className={styles.scoreProgress}>
              <div>
                <span>Score progress</span>
                <strong>{report.percentage ?? 0}%</strong>
              </div>
              <div className={styles.scoreTrack}>
                <span style={{ width: `${report.percentage ?? 0}%` }} />
                {passingPercentage !== null &&
                passingPercentage !== undefined ? (
                  <i style={{ left: `${passingPercentage}%` }}>
                    <b>Pass</b>
                  </i>
                ) : null}
              </div>
            </div>
            <div className={styles.paceGrid}>
              <MiniMetric
                icon={TimerReset}
                label="Average / question"
                value={formatDuration(
                  report.timeAnalysis?.averageTimePerQuestion ?? 0,
                )}
              />
              <MiniMetric
                icon={Gauge}
                label="Average / attempted"
                value={formatDuration(
                  report.timeAnalysis?.averageTimePerAttemptedQuestion ?? 0,
                )}
              />
              <MiniMetric
                icon={TrendingUp}
                label="Percentile"
                value={
                  cohortReady && report.percentile !== null
                    ? `${report.percentile}%`
                    : "—"
                }
              />
            </div>
            <InsightText>
              {report.result?.status === "PASSED"
                ? "You cleared the configured passing threshold. Use the breakdowns below to identify where more marks are available."
                : "Focus on the weakest sections and topics below, then practise at the same time limit before retrying."}
            </InsightText>
          </article>
        </section>
      ) : null}

      <section className={styles.tablePanel} id="sections">
        <PanelHeading
          eyebrow="SECTION ANALYSIS"
          heading="Section-wise breakdown"
          text="Compare accuracy, marks, completion, and time across the major parts of this exam."
        />
        <MetricTable
          empty="No section data is available."
          metrics={sectionPerformance}
        />
      </section>

      <section className={styles.breakdownGrid}>
        <article className={styles.tablePanel}>
          <PanelHeading
            eyebrow="SUBJECT ANALYSIS"
            heading="Subject-wise performance"
            text="See which subjects contributed marks and where the largest score gaps remain."
          />
          <MetricTable
            compact
            empty="No subject data is available."
            metrics={subjectPerformance}
          />
        </article>
        <article className={styles.tablePanel}>
          <PanelHeading
            eyebrow="ANSWER FORMAT"
            heading="Question-type performance"
            text="Compare accuracy and pace across choice, numerical, and written-answer questions."
          />
          <MetricTable
            compact
            empty="Question-type data is not available."
            metrics={questionTypePerformance}
          />
        </article>
      </section>

      <section className={styles.breakdownGrid}>
        <article className={styles.tablePanel} id="topics">
          <PanelHeading
            eyebrow="LEARNING AREAS"
            heading="Topic-wise breakdown"
            text="Topic results reveal the concepts that are strong and those that need more practice."
          />
          <MetricTable
            compact
            empty="Questions in this attempt are not assigned to topics."
            metrics={topicPerformance}
            showClassification
          />
        </article>
        <article className={styles.tablePanel} id="difficulty">
          <PanelHeading
            eyebrow="QUESTION LEVEL"
            heading="Difficulty-wise performance"
            text="Understand how your accuracy and pace change from easy to hard questions."
          />
          <MetricTable
            compact
            empty="Difficulty data is not available for this attempt."
            metrics={difficultyPerformance}
          />
        </article>
      </section>

      {report.opportunity ? (
        <section
          className={styles.opportunityPanel}
          aria-label="Marks opportunity"
        >
          <div className={styles.opportunityIntro}>
            <span>MARKS OPPORTUNITY</span>
            <h2>Where your next marks can come from</h2>
            <p>
              Use this breakdown to prioritize revision. Potential marks show
              the value of the affected questions, not a guaranteed future
              score.
            </p>
          </div>
          <div className={styles.opportunityGrid}>
            <OpportunityMetric
              detail={
                report.result?.status === "PASSED"
                  ? "Passing target cleared"
                  : "Additional marks needed"
              }
              icon={Target}
              label="Marks to pass"
              tone="green"
              value={
                report.opportunity.marksToPass === null
                  ? "—"
                  : formatMarks(report.opportunity.marksToPass)
              }
            />
            <OpportunityMetric
              detail="Available on incorrect questions"
              icon={XCircle}
              label="Incorrect opportunity"
              tone="red"
              value={formatMarks(report.opportunity.incorrectQuestionMarks)}
            />
            <OpportunityMetric
              detail="Available on unanswered questions"
              icon={BookOpenCheck}
              label="Unanswered opportunity"
              tone="neutral"
              value={formatMarks(report.opportunity.unansweredQuestionMarks)}
            />
            <OpportunityMetric
              detail="Penalty already included in score"
              icon={AlertTriangle}
              label="Negative marks"
              tone="amber"
              value={formatMarks(report.opportunity.negativeMarksDeducted)}
            />
          </div>
        </section>
      ) : null}

      <section className={styles.analysisGrid} id="time-analysis">
        <article className={styles.panel}>
          <PanelHeading
            eyebrow="TIME ANALYSIS"
            heading="How your time was used"
            text="Question time is estimated from saved activity heartbeats and may not include every idle second."
          />
          <div className={styles.timeCards}>
            <MiniMetric
              icon={Clock3}
              label="Total attempt"
              value={formatDuration(report.timeAnalysis?.totalSeconds ?? 0)}
            />
            <MiniMetric
              icon={Target}
              label="Tracked on questions"
              value={formatDuration(
                report.timeAnalysis?.trackedQuestionSeconds ?? 0,
              )}
            />
            <MiniMetric
              icon={TimerReset}
              label="Untracked / transition"
              value={formatDuration(report.timeAnalysis?.untrackedSeconds ?? 0)}
            />
          </div>
          <InsightText>
            Timing is an estimate. Use it to compare relative pace between
            sections, topics, and difficulty levels rather than as an exact
            proctoring measurement.
          </InsightText>
          {slowestQuestions.length ? (
            <QuestionSignalList
              heading="Slowest questions"
              questions={slowestQuestions}
            />
          ) : null}
        </article>
        <article className={styles.panel}>
          <PanelHeading
            eyebrow="PERSONALIZED INSIGHTS"
            heading="Strengths and next priorities"
            text="Topic classifications require enough answered questions; priorities also consider marks still available."
          />
          <div className={styles.insightGrid}>
            <div data-tone="strong">
              <CheckCircle2 size={20} />
              <div>
                <strong>Strong topics</strong>
                <p>
                  {strongTopics.length
                    ? strongTopics.map((topic) => topic.label).join(", ")
                    : "No topic has enough evidence for a strong classification yet."}
                </p>
              </div>
            </div>
            <div data-tone="focus">
              <Lightbulb size={20} />
              <div>
                <strong>Focus first</strong>
                <p>
                  {focusTopics.length
                    ? focusTopics
                        .slice(0, 3)
                        .map(
                          (topic) =>
                            `${topic.label} (${formatMarks(topic.maximumMarks - topic.marksAwarded)} available)`,
                        )
                        .join(", ")
                    : weakTopics.length
                      ? weakTopics.map((topic) => topic.label).join(", ")
                      : "No topic with sufficient evidence currently needs priority intervention."}
                </p>
              </div>
            </div>
          </div>
          {rushedIncorrect.length ? (
            <QuestionSignalList
              heading="Possible rushed mistakes"
              questions={rushedIncorrect}
            />
          ) : null}
        </article>
      </section>

      {report.trend?.length ? (
        <section className={styles.trendPanel}>
          <div className={styles.trendHeading}>
            <PanelHeading
              eyebrow="RECENT RESULTS"
              heading="Performance trend"
              text="Your most recent completed exams in this course, ordered over time."
            />
            {trendDelta !== null ? (
              <span data-tone={trendDelta >= 0 ? "up" : "down"}>
                <TrendingUp size={15} /> {trendDelta > 0 ? "+" : ""}
                {trendDelta} points from the previous result
              </span>
            ) : null}
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
        <section className={styles.review} id="questions">
          <div className={styles.reviewHeader}>
            <PanelHeading
              eyebrow="DETAILED REVIEW"
              heading="Question-level review"
              text="Filter and sort questions to find the mistakes, timing patterns, and marks that deserve attention first."
            />
            <div className={styles.reviewTools}>
              <label className={styles.questionSearch}>
                <Search size={15} />
                <input
                  onChange={(event) => setQuestionSearch(event.target.value)}
                  placeholder="Search code, section, topic, type, or level"
                  type="search"
                  value={questionSearch}
                />
              </label>
              <label className={styles.sortControl}>
                <BarChart3 size={15} />
                <select
                  aria-label="Sort questions"
                  onChange={(event) =>
                    setQuestionSort(event.target.value as QuestionSort)
                  }
                  value={questionSort}
                >
                  <option value="ORDER">Question order</option>
                  <option value="MARKS_LOST">Most marks available</option>
                  <option value="SLOWEST">Slowest first</option>
                </select>
              </label>
            </div>
          </div>
          <div className={styles.filterBar} aria-label="Question filters">
            {questionFilters(report).map((filter) => (
              <button
                aria-pressed={questionFilter === filter.value}
                data-active={questionFilter === filter.value}
                key={filter.value}
                onClick={() => setQuestionFilter(filter.value)}
                type="button"
              >
                {filter.label} <b>{filter.count}</b>
              </button>
            ))}
          </div>
          <div className={styles.questionList}>
            {filteredQuestions.map((question) => (
              <QuestionReview key={question.id} question={question} />
            ))}
            {!filteredQuestions.length ? (
              <div className={styles.emptyReview}>
                <Search size={22} />
                <strong>No matching questions</strong>
                <span>Change the search or result filter and try again.</span>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <footer className={styles.footer}>
        <Link href="/student/my-courses">Back to My Courses</Link>
      </footer>
    </main>
  );
}

function Kpi({
  detail,
  icon: Icon,
  label,
  tone,
  value,
}: {
  detail: string;
  icon: typeof Target;
  label: string;
  tone?: "green" | "red" | "blue" | "purple";
  value: string | number;
}) {
  return (
    <article className={styles.kpi} data-tone={tone}>
      <span>
        <Icon size={19} />
      </span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
    </article>
  );
}

function PanelHeading({
  eyebrow,
  heading,
  text,
}: {
  eyebrow: string;
  heading: string;
  text: string;
}) {
  return (
    <div className={styles.panelHeading}>
      <span>{eyebrow}</span>
      <h2>{heading}</h2>
      <p>{text}</p>
    </div>
  );
}

function Legend({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "correct" | "incorrect" | "unattempted";
  value: number;
}) {
  return (
    <span data-tone={tone}>
      <i /> {label} <b>{value}</b>
    </span>
  );
}

function MiniMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target;
  label: string;
  value: string;
}) {
  return (
    <div className={styles.miniMetric}>
      <Icon size={19} />
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function OpportunityMetric({
  detail,
  icon: Icon,
  label,
  tone,
  value,
}: {
  detail: string;
  icon: typeof Target;
  label: string;
  tone: "green" | "red" | "amber" | "neutral";
  value: string;
}) {
  return (
    <article className={styles.opportunityMetric} data-tone={tone}>
      <span>
        <Icon size={18} />
      </span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
    </article>
  );
}

function QuestionSignalList({
  heading,
  questions,
}: {
  heading: string;
  questions: NonNullable<StudentExamReport["questions"]>;
}) {
  return (
    <div className={styles.signalList}>
      <strong>{heading}</strong>
      <div>
        {questions.map((question) => (
          <a href={`#question-${question.id}`} key={question.id}>
            <span>
              Q{question.order} ·{" "}
              {question.topic?.name ?? question.subject.name}
            </span>
            <b>{formatDuration(question.timeSpentSeconds)}</b>
          </a>
        ))}
      </div>
    </div>
  );
}

function InsightText({ children }: { children: ReactNode }) {
  return (
    <div className={styles.insightText}>
      <strong>What this means</strong>
      <p>{children}</p>
    </div>
  );
}

function MetricTable({
  compact = false,
  empty,
  metrics,
  showClassification = false,
}: {
  compact?: boolean;
  empty: string;
  metrics: Array<
    StudentExamPerformanceMetric & {
      classification?: string;
      subjectName?: string;
    }
  >;
  showClassification?: boolean;
}) {
  if (!metrics.length) return <p className={styles.noMetrics}>{empty}</p>;
  return (
    <div className={styles.metricTable} data-compact={compact}>
      <table>
        <thead>
          <tr>
            <th>Area</th>
            <th>Attempted</th>
            <th>Correct</th>
            <th>Accuracy</th>
            <th>Score</th>
            <th>Time</th>
            <th>Performance</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric) => (
            <tr key={metric.key}>
              <td>
                <strong>{metric.label}</strong>
                {metric.subjectName ? (
                  <small>{metric.subjectName}</small>
                ) : null}
                {showClassification && metric.classification ? (
                  <b data-classification={metric.classification}>
                    {classificationLabel(metric.classification)}
                  </b>
                ) : null}
              </td>
              <td>
                {metric.attempted} / {metric.total}
              </td>
              <td>{metric.correct}</td>
              <td>{metric.accuracy}%</td>
              <td>
                {metric.marksAwarded} / {metric.maximumMarks}
              </td>
              <td>{formatDuration(metric.timeSpentSeconds)}</td>
              <td>
                <div className={styles.tableProgress}>
                  <span
                    style={{ width: `${Math.max(0, metric.percentage)}%` }}
                  />
                </div>
                <b>{metric.percentage}%</b>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QuestionReview({
  question,
}: {
  question: NonNullable<StudentExamReport["questions"]>[number];
}) {
  return (
    <details className={styles.question} id={`question-${question.id}`}>
      <summary className={styles.questionHeader}>
        <div>
          <strong>
            Question {question.order} · {question.code}
          </strong>
          <small>
            {question.questionType.name} · {question.section.name} ·{" "}
            {question.topic?.name ?? question.subject.name}
          </small>
        </div>
        <div className={styles.questionResult}>
          <span className={styles.difficulty} data-level={question.difficulty}>
            {difficultyLabel(question.difficulty)}
          </span>
          {question.markedForReview ? (
            <span className={styles.reviewFlag}>
              <Flag size={12} /> Marked
            </span>
          ) : null}
          <span data-state={question.answerState}>
            {question.answerState === "UNATTEMPTED"
              ? "Unanswered"
              : question.answerState === "CORRECT"
                ? "Correct"
                : "Incorrect"}
          </span>
          <b>
            {question.marksAwarded} / {question.maximumMarks} marks
          </b>
          <small>{formatDuration(question.timeSpentSeconds)}</small>
        </div>
      </summary>
      <div className={styles.questionBody}>
        {question.comprehension ? (
          <section className={styles.passage}>
            <strong>Passage</strong>
            <div
              className={styles.rich}
              dangerouslySetInnerHTML={{
                __html: question.comprehension.content,
              }}
              onErrorCapture={handleRichContentError}
            />
          </section>
        ) : null}
        <div
          className={styles.rich}
          dangerouslySetInnerHTML={{ __html: question.content }}
          onErrorCapture={handleRichContentError}
        />
        <div className={styles.answerComparison}>
          <AnswerCard
            answer={question.studentAnswer}
            empty={question.answerState === "UNATTEMPTED"}
            label="Your answer"
            tone={question.answerState === "CORRECT" ? "correct" : "your"}
          />
          {question.correctAnswer ? (
            <AnswerCard
              answer={question.correctAnswer}
              label="Correct answer"
              tone="correct"
            />
          ) : (
            <div className={styles.answerUnavailable}>
              <BookOpenCheck size={18} />
              <div>
                <strong>Correct answer</strong>
                <span>Not released for this exam</span>
              </div>
            </div>
          )}
        </div>
        {question.explanation ? (
          <div className={styles.explanation}>
            <strong>Explanation</strong>
            <div
              className={styles.rich}
              dangerouslySetInnerHTML={{ __html: question.explanation }}
              onErrorCapture={handleRichContentError}
            />
          </div>
        ) : null}
        {question.negativeMarks > 0 ? (
          <p className={styles.negativeMarking}>
            <Flag size={14} /> Incorrect-answer penalty: -
            {question.negativeMarks} marks
          </p>
        ) : null}
      </div>
    </details>
  );
}

type ReviewAnswer = {
  options: Array<{ id: number; code: string; content: string }>;
  text?: string | null;
  numeric?: number | null;
  acceptedAnswers?: string[];
};

function AnswerCard({
  answer,
  empty = false,
  label,
  tone,
}: {
  answer: ReviewAnswer;
  empty?: boolean;
  label: string;
  tone: "your" | "correct";
}) {
  const values: Array<{
    key: string;
    code: string;
    html?: string;
    text?: string;
  }> = answer.options.length
    ? answer.options.map((option) => ({
        key: String(option.id),
        code: option.code,
        html: option.content,
      }))
    : answer.acceptedAnswers?.length
      ? answer.acceptedAnswers.map((value, index) => ({
          key: `${index}:${value}`,
          code: "",
          text: value,
        }))
      : answer.numeric !== null && answer.numeric !== undefined
        ? [{ key: "numeric", code: "", text: String(answer.numeric) }]
        : answer.text?.trim()
          ? [{ key: "text", code: "", text: answer.text }]
          : [];
  return (
    <section className={styles.answerCard} data-tone={tone}>
      <strong>{label}</strong>
      {empty || !values.length ? (
        <span className={styles.emptyAnswer}>No answer submitted</span>
      ) : (
        <div className={styles.answerValues}>
          {values.map((value) => (
            <div key={value.key}>
              {value.code ? <b>{value.code}</b> : null}
              {value.html ? (
                <span
                  className={styles.rich}
                  dangerouslySetInnerHTML={{ __html: value.html }}
                  onErrorCapture={handleRichContentError}
                />
              ) : (
                <span>{value.text}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function questionFilters(report: StudentExamReport) {
  const questions = report.questions ?? [];
  return [
    { label: "All", value: "ALL" as const, count: questions.length },
    {
      label: "Correct",
      value: "CORRECT" as const,
      count: questions.filter((question) => question.answerState === "CORRECT")
        .length,
    },
    {
      label: "Incorrect",
      value: "INCORRECT" as const,
      count: questions.filter(
        (question) => question.answerState === "INCORRECT",
      ).length,
    },
    {
      label: "Unanswered",
      value: "UNATTEMPTED" as const,
      count: questions.filter(
        (question) => question.answerState === "UNATTEMPTED",
      ).length,
    },
    {
      label: "Marked",
      value: "MARKED" as const,
      count: questions.filter((question) => question.markedForReview).length,
    },
  ];
}

function formatResultStatus(
  status: NonNullable<StudentExamReport["result"]>["status"],
) {
  if (status === "NOT_CONFIGURED") return "Pass rule not configured";
  return status === "PASSED" ? "Passed" : "Failed";
}

function submissionReasonLabel(reason: StudentExamReport["submissionReason"]) {
  if (reason === "EXAM_TIMEOUT")
    return "Auto-submitted when the exam timer ended";
  if (reason === "SLOT_TIMEOUT")
    return "Auto-submitted when a timed slot ended";
  if (reason === "SECTION_TIMEOUT")
    return "Auto-submitted when a timed section ended";
  if (reason === "ADMIN_FORCED") return "Submitted by an administrator";
  return "Submitted by student";
}

function classificationLabel(classification: string) {
  if (classification === "LIMITED_DATA") return "Limited data";
  if (classification === "NOT_ATTEMPTED") return "Not attempted";
  return classification.charAt(0) + classification.slice(1).toLowerCase();
}

function difficultyLabel(difficulty: string) {
  return difficulty.charAt(0) + difficulty.slice(1).toLowerCase();
}

function difficultyOrder(difficulty: string) {
  return difficulty === "EASY" ? 0 : difficulty === "MEDIUM" ? 1 : 2;
}

function handleRichContentError(event: SyntheticEvent<HTMLElement>) {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || image.dataset.failed) return;
  image.dataset.failed = "true";
  image.hidden = true;
  const fallback = document.createElement("span");
  fallback.className = styles.missingMedia;
  fallback.setAttribute("role", "status");
  fallback.textContent = image.alt
    ? `Image unavailable: ${image.alt}`
    : "Image unavailable";
  image.insertAdjacentElement("afterend", fallback);
}

function formatDuration(seconds: number) {
  const rounded = Math.max(0, Math.round(seconds));
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const remainingSeconds = rounded % 60;
  return hours ? `${hours}h ${minutes}m` : `${minutes}m ${remainingSeconds}s`;
}

function formatMarks(value: number) {
  return `${Number.isInteger(value) ? value : value.toFixed(2)} marks`;
}

function roundPercentage(value: number) {
  return Math.round(value * 100) / 100;
}

function median(values: number[]) {
  if (!values.length) return 0;
  const ordered = [...values].sort((left, right) => left - right);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2
    ? ordered[middle]!
    : (ordered[middle - 1]! + ordered[middle]!) / 2;
}
