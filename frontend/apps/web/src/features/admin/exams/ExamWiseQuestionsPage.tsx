"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { examsApi } from "@repo/api";
import type { QuestionDifficulty } from "@repo/types";
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Layers3,
  Search,
} from "lucide-react";

import styles from "./ExamWiseQuestionsPage.module.css";

const plainText = (value: string) =>
  value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();

export function ExamWiseQuestionsPage({ examId }: { examId: number }) {
  const [activeSlotId, setActiveSlotId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<"ALL" | QuestionDifficulty>(
    "ALL",
  );
  const [questionType, setQuestionType] = useState("ALL");
  const [topic, setTopic] = useState("ALL");
  const examQuestions = useQuery({
    queryKey: ["exam-wise-questions", examId],
    queryFn: () => examsApi.scheduled.questions(examId),
    enabled: Number.isInteger(examId) && examId > 0,
  });
  const data = examQuestions.data;

  const totals = useMemo(() => {
    const questions =
      data?.slots.flatMap((slot) =>
        slot.sections.flatMap((section) =>
          section.subjects.flatMap((subject) => subject.questions),
        ),
      ) ?? [];
    return {
      questions: questions.length,
      marks: questions.reduce(
        (sum, question) => sum + Number(question.marks),
        0,
      ),
      sections:
        data?.slots.reduce((sum, slot) => sum + slot.sections.length, 0) ?? 0,
    };
  }, [data]);
  const filterOptions = useMemo(() => {
    const versions =
      data?.slots.flatMap((slot) =>
        slot.sections.flatMap((section) =>
          section.subjects.flatMap((subject) =>
            subject.questions.map((question) => question.questionVersion),
          ),
        ),
      ) ?? [];
    return {
      questionTypes: Array.from(
        new Map(
          versions.map((version) => [
            version.questionType.code,
            version.questionType.name,
          ]),
        ),
      ),
      topics: Array.from(
        new Map(
          versions
            .filter((version) => version.topic)
            .map((version) => [
              String(version.topic!.id),
              version.topic!.name,
            ]),
        ),
      ),
    };
  }, [data]);

  if (examQuestions.isLoading)
    return <main className={styles.state}>Loading exam questions…</main>;
  if (examQuestions.isError || !data)
    return (
      <main className={styles.state}>
        <strong>Exam questions could not be loaded.</strong>
        <Link href="/admin/exams/schedule">Return to scheduled exams</Link>
      </main>
    );

  const activeSlot =
    data.slots.find((slot) => slot.id === activeSlotId) ?? data.slots[0];

  return (
    <main className={styles.page}>
      <Link className={styles.backLink} href="/admin/exams/schedule">
        <ArrowLeft size={16} />
        Scheduled exams
      </Link>
      <section className={styles.hero}>
        <div>
          <span>Exam question blueprint</span>
          <h1>{data.exam.title}</h1>
          <p>
            {data.exam.code} · {data.exam.template.name} · Version{" "}
            {data.exam.template.versionNumber}
          </p>
          <div className={styles.heroBadges}>
            <b>{data.exam.status.replaceAll("_", " ")}</b>
            <b>{data.exam.session.name}</b>
          </div>
        </div>
        <div className={styles.heroMetric}>
          <BookOpenCheck size={25} />
          <strong>{totals.questions}</strong>
          <span>Questions</span>
        </div>
        <div className={styles.heroMetric}>
          <Layers3 size={25} />
          <strong>{data.slots.length}</strong>
          <span>Selected slots</span>
        </div>
      </section>

      <section className={styles.summaryGrid}>
        <article>
          <Clock3 size={19} />
          <div><strong>{data.exam.durationMinutes} min</strong><span>Exam duration</span></div>
        </article>
        <article>
          <CheckCircle2 size={19} />
          <div><strong>{totals.marks}</strong><span>Available marks</span></div>
        </article>
        <article>
          <Layers3 size={19} />
          <div><strong>{totals.sections}</strong><span>Sections</span></div>
        </article>
        <article>
          <CalendarClock size={19} />
          <div>
            <strong>{new Date(data.exam.availableFrom).toLocaleDateString()}</strong>
            <span>Starts</span>
          </div>
        </article>
      </section>

      <section className={styles.toolbar}>
        <label>
          <Search size={16} />
          <input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search question text, code, subject, or topic"
            value={search}
          />
        </label>
        <select
          aria-label="Filter by difficulty"
          onChange={(event) =>
            setDifficulty(event.target.value as "ALL" | QuestionDifficulty)
          }
          value={difficulty}
        >
          <option value="ALL">All difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
        <select
          aria-label="Filter by question type"
          onChange={(event) => setQuestionType(event.target.value)}
          value={questionType}
        >
          <option value="ALL">All question types</option>
          {filterOptions.questionTypes.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by topic"
          onChange={(event) => setTopic(event.target.value)}
          value={topic}
        >
          <option value="ALL">All topics</option>
          {filterOptions.topics.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </section>
      {!data.canViewAnswers ? (
        <p className={styles.answerNotice}>
          Correct answers and explanations are hidden. The
          exam-answer.read permission is required to review them.
        </p>
      ) : null}

      <nav className={styles.slotTabs} aria-label="Exam slots">
        {data.slots.map((slot, index) => (
          <button
            data-active={slot.id === activeSlot?.id}
            key={slot.id}
            onClick={() => setActiveSlotId(slot.id)}
            type="button"
          >
            <b>{index + 1}</b>
            <span>{slot.name}</span>
            <small>{slot.durationMinutes} min</small>
          </button>
        ))}
      </nav>

      {!activeSlot ? (
        <section className={styles.state}>No slots are selected for this exam.</section>
      ) : (
        <section className={styles.slotContent}>
          {activeSlot.sections.map((section, sectionIndex) => {
            const visibleSubjects = section.subjects
              .map((subject) => ({
                ...subject,
                questions: subject.questions.filter((question) => {
                  const version = question.questionVersion;
                  const haystack = [
                    version.question.code,
                    plainText(version.content),
                    subject.subject.name,
                    version.topic?.name ?? "",
                  ]
                    .join(" ")
                    .toLowerCase();
                  return (
                    (!search.trim() ||
                      haystack.includes(search.trim().toLowerCase())) &&
                    (difficulty === "ALL" ||
                      version.difficulty === difficulty) &&
                    (questionType === "ALL" ||
                      version.questionType.code === questionType) &&
                    (topic === "ALL" ||
                      String(version.topic?.id) === topic)
                  );
                }),
              }))
              .filter((subject) => subject.questions.length);
            return (
              <details className={styles.section} key={section.id} open>
                <summary>
                  <span>{sectionIndex + 1}</span>
                  <div>
                    <strong>{section.name}</strong>
                    <small>
                      {section.code} · {section.durationMinutes} min ·{" "}
                      {section.questionsToAttempt ?? "All"} to attempt
                    </small>
                  </div>
                  <b>
                    {visibleSubjects.reduce(
                      (sum, subject) => sum + subject.questions.length,
                      0,
                    )}{" "}
                    questions
                  </b>
                </summary>
                <div className={styles.subjects}>
                  {visibleSubjects.map((subject) => (
                    <section key={subject.id}>
                      <header>
                        <div>
                          <strong>{subject.subject.name}</strong>
                          <span>{subject.subject.code}</span>
                        </div>
                        <small>{subject.questions.length} questions</small>
                      </header>
                      <div className={styles.questions}>
                        {subject.questions.map((question, questionIndex) => {
                          const version = question.questionVersion;
                          return (
                            <article key={question.id}>
                              <div className={styles.questionMeta}>
                                <b>Q{questionIndex + 1}</b>
                                <span>{version.question.code}</span>
                                <span>{version.questionType.name}</span>
                                <span data-difficulty={version.difficulty}>
                                  {version.difficulty.toLowerCase()}
                                </span>
                                <strong>
                                  +{question.marks} / −{question.negativeMarks}
                                </strong>
                              </div>
                              {version.comprehension?.content ? (
                                <details className={styles.comprehension}>
                                  <summary>Passage / directions</summary>
                                  <div
                                    dangerouslySetInnerHTML={{
                                      __html: version.comprehension.content,
                                    }}
                                  />
                                </details>
                              ) : null}
                              <div
                                className={styles.questionContent}
                                dangerouslySetInnerHTML={{
                                  __html: version.content,
                                }}
                              />
                              {version.options.length ? (
                                <div className={styles.options}>
                                  {version.options.map((option) => (
                                    <span
                                      data-correct={option.isCorrect}
                                      key={option.id ?? option.code}
                                    >
                                      <b>{option.code}</b>
                                      <i
                                        dangerouslySetInnerHTML={{
                                          __html: option.content,
                                        }}
                                      />
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                              {version.explanation ? (
                                <details className={styles.explanation}>
                                  <summary>Answer explanation</summary>
                                  <div
                                    dangerouslySetInnerHTML={{
                                      __html: version.explanation,
                                    }}
                                  />
                                </details>
                              ) : null}
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                  {!visibleSubjects.length ? (
                    <div className={styles.state}>
                      No questions match the selected filters.
                    </div>
                  ) : null}
                </div>
              </details>
            );
          })}
        </section>
      )}
    </main>
  );
}
