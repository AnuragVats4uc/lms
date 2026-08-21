"use client";

import { Fragment, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  examsApi,
  foldersApi,
  organizationsApi,
  sessionCoursesApi,
  sessionsApi,
} from "@repo/api";
import { useCurrentUser } from "@repo/auth";
import type {
  ExamImportJob,
  ExamImportRow,
  ExamQuestion,
  ExamQuestionSort,
  ExamQuestionType,
  ExamSubject,
  ExamTemplate,
  ExamTemplateListItem,
  ExamTemplateVersion,
  SaveExamTemplateStructureRequest,
  ScheduledExam,
} from "@repo/types";
import {
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CirclePlus,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  FileUp,
  Layers3,
  Library,
  Plus,
  Save,
  Search,
  Send,
  Trash2,
  UsersRound,
} from "lucide-react";
import {
  CrudDateTimePicker,
  CrudMultiSelectField,
  CrudSearch,
  CrudSelect,
  CrudSelectField,
} from "../components/crud";
import styles from "./ExamManagementPage.module.css";

type Tab = "templates" | "subjects" | "questions" | "imports" | "schedule";
type BuilderQuestion = {
  questionVersionId: number;
  marks: number;
  negativeMarks: number;
  code?: string;
  content?: string;
};
type Report = (
  promise: Promise<unknown>,
  success: string,
  afterSuccess?: () => void | Promise<void>,
) => void;
type BuilderSection = {
  code: string;
  name: string;
  durationMinutes: number;
  questionsToAttempt: number;
  subjectId: number;
  questions: BuilderQuestion[];
};
type BuilderSlot = {
  code: string;
  name: string;
  durationMinutes: number;
  sections: BuilderSection[];
};

const emptySection = (): BuilderSection => ({
  code: "SECTION_1",
  name: "New section",
  durationMinutes: 30,
  questionsToAttempt: 1,
  subjectId: 0,
  questions: [],
});
const emptySlot = (): BuilderSlot => ({
  code: "SLOT_1",
  name: "Slot 1",
  durationMinutes: 30,
  sections: [emptySection()],
});

const questionLimitOptions = [1, 5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100];

function messageOf(error: unknown) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: { message?: string | string[]; error?: { message?: string } };
        };
      }
    ).response;
    const message = response?.data?.message ?? response?.data?.error?.message;
    return Array.isArray(message)
      ? message.join(", ")
      : (message ?? "Request failed");
  }
  return error instanceof Error ? error.message : "Request failed";
}

function RichContent({ value }: { value?: string | null }) {
  if (!value) return <span>No content</span>;
  if (
    !/<(?:p|br|strong|em|u|ol|ul|li|table|thead|tbody|tr|td|th|h1|h2|h3|sub|sup|img)\b/i.test(
      value,
    )
  )
    return <p>{value}</p>;
  return (
    <div
      className={styles.richContent}
      dangerouslySetInnerHTML={{ __html: value }}
    />
  );
}

function contentSummary(value?: string | null) {
  if (!value) return "No question content";
  const hasImage = /<img\b/i.test(value);
  const text = value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return hasImage ? "Image-based question" : "No question content";
  return `${text.slice(0, 150)}${text.length > 150 ? "…" : ""}${hasImage ? " · Includes image" : ""}`;
}

const questionStatusOptions = [
  { label: "All statuses", value: "all" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Draft", value: "DRAFT" },
  { label: "Archived", value: "ARCHIVED" },
] as const;

const questionSortOptions: Array<{
  label: string;
  value: ExamQuestionSort;
}> = [
  { label: "Latest first", value: "LATEST" },
  { label: "Oldest first", value: "OLDEST" },
  { label: "Question code", value: "CODE" },
  { label: "Recently updated", value: "RECENTLY_UPDATED" },
];

function SectionQuestionPicker({
  organizationId,
  subjectId,
  questionTypes,
  selectedQuestions,
  onSelectionChange,
}: {
  organizationId: number;
  subjectId: number;
  questionTypes: ExamQuestionType[];
  selectedQuestions: BuilderQuestion[];
  onSelectionChange: (questions: BuilderQuestion[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [questionType, setQuestionType] = useState("all");
  const [status, setStatus] = useState("PUBLISHED");
  const [sort, setSort] = useState<ExamQuestionSort>("LATEST");
  const [limit, setLimit] = useState("20");

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      350,
    );
    return () => window.clearTimeout(timer);
  }, [search]);

  const pool = useQuery({
    queryKey: [
      "exam-template-question-pool",
      organizationId,
      subjectId,
      debouncedSearch,
      questionType,
      status,
      sort,
      limit,
    ],
    queryFn: () =>
      examsApi.questions.list({
        organizationId,
        subjectId,
        search: debouncedSearch || undefined,
        questionTypeId:
          questionType === "all" ? undefined : Number(questionType),
        status:
          status === "all" ? undefined : (status as ExamQuestion["status"]),
        sort,
        limit: Math.min(100, Math.max(1, Number(limit))),
      }),
    enabled: subjectId > 0,
    staleTime: 30_000,
  });

  const visibleQuestions = (pool.data ?? []).flatMap((question) => {
    const version = question.versions[0];
    return version ? [{ question, version }] : [];
  });
  const visibleIds = new Set(visibleQuestions.map(({ version }) => version.id));
  const selectedVisibleCount = selectedQuestions.filter((question) =>
    visibleIds.has(question.questionVersionId),
  ).length;
  const allVisibleSelected =
    visibleQuestions.length > 0 &&
    selectedVisibleCount === visibleQuestions.length;

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setQuestionType("all");
    setStatus("PUBLISHED");
    setSort("LATEST");
    setLimit("20");
  };

  const selectAllVisible = () => {
    const selectedIds = new Set(
      selectedQuestions.map((question) => question.questionVersionId),
    );
    onSelectionChange([
      ...selectedQuestions,
      ...visibleQuestions
        .filter(({ version }) => !selectedIds.has(version.id))
        .map(({ question, version }) => ({
          questionVersionId: version.id,
          marks: Number(version.defaultMarks),
          negativeMarks: Number(version.defaultNegativeMarks),
          code: question.code,
          content: version.content,
        })),
    ]);
  };

  const clearVisibleSelection = () =>
    onSelectionChange(
      selectedQuestions.filter(
        (question) => !visibleIds.has(question.questionVersionId),
      ),
    );

  if (!subjectId) {
    return (
      <div className={styles.questionEmpty} role="status">
        <ClipboardList size={20} aria-hidden="true" />
        <strong>Choose a subject</strong>
        <span>Select the section subject to load its question pool.</span>
      </div>
    );
  }

  return (
    <div className={styles.questionPool}>
      <div className={styles.questionPoolToolbar}>
        <div className={styles.questionPoolSearch}>
          <span>Search questions</span>
          <CrudSearch
            ariaLabel="Search questions by code or text"
            loading={pool.isFetching && !pool.data}
            maxWidth={700}
            onChange={setSearch}
            placeholder="Search question code or text..."
            value={search}
          />
        </div>
        <CrudSelect
          ariaLabel="Filter by question type"
          label="Question type"
          onChange={setQuestionType}
          options={[
            { label: "All types", value: "all" },
            ...questionTypes.map((type) => ({
              label: type.name,
              value: String(type.id),
            })),
          ]}
          value={questionType}
          width="100%"
        />
        <CrudSelect
          ariaLabel="Filter by question status"
          label="Status"
          onChange={setStatus}
          options={questionStatusOptions}
          value={status}
          width="100%"
        />
        <CrudSelect
          ariaLabel="Choose number of latest questions"
          label="Show latest"
          onChange={setLimit}
          options={questionLimitOptions.map((value) => ({
            label: `${value} ${value === 1 ? "question" : "questions"}`,
            value: String(value),
          }))}
          value={limit}
          width="100%"
        />
        <CrudSelect
          ariaLabel="Sort questions"
          label="Sort by"
          onChange={(value) => setSort(value as ExamQuestionSort)}
          options={questionSortOptions}
          value={sort}
          width="100%"
        />
        <button
          className={styles.filterResetButton}
          onClick={resetFilters}
          type="button"
        >
          Reset filters
        </button>
      </div>

      <div className={styles.questionSelectionBar}>
        <span>
          <strong>{selectedQuestions.length}</strong> questions selected
          {pool.isFetching ? " · Updating list..." : ""}
        </span>
        <div>
          <button
            className={styles.textButton}
            disabled={!visibleQuestions.length || allVisibleSelected}
            onClick={selectAllVisible}
            type="button"
          >
            Select all visible
          </button>
          <button
            className={styles.textButton}
            disabled={!selectedVisibleCount}
            onClick={clearVisibleSelection}
            type="button"
          >
            Clear visible
          </button>
        </div>
      </div>

      <div className={styles.questionPicker}>
        {pool.isPending ? (
          <div
            className={styles.questionLoading}
            aria-label="Loading questions"
          >
            <span />
            <span />
            <span />
          </div>
        ) : pool.isError ? (
          <div className={styles.questionEmpty} role="alert">
            <ClipboardList size={20} aria-hidden="true" />
            <strong>Questions could not be loaded</strong>
            <span>Please try the request again.</span>
            <button
              className={styles.secondaryButton}
              onClick={() => void pool.refetch()}
              type="button"
            >
              Retry
            </button>
          </div>
        ) : !visibleQuestions.length ? (
          <div className={styles.questionEmpty} role="status">
            <ClipboardList size={20} aria-hidden="true" />
            <strong>No questions found</strong>
            <span>Try changing the question filters.</span>
          </div>
        ) : (
          visibleQuestions.map(({ question, version }) => {
            const chosen = selectedQuestions.find(
              (item) => item.questionVersionId === version.id,
            );
            const setSelected = (checked: boolean) =>
              onSelectionChange(
                checked
                  ? [
                      ...selectedQuestions,
                      {
                        questionVersionId: version.id,
                        marks: Number(version.defaultMarks),
                        negativeMarks: Number(version.defaultNegativeMarks),
                        code: question.code,
                        content: version.content,
                      },
                    ]
                  : selectedQuestions.filter(
                      (item) => item.questionVersionId !== version.id,
                    ),
              );
            return (
              <article
                className={styles.questionChoice}
                data-selected={Boolean(chosen)}
                key={question.id}
              >
                <input
                  aria-label={`Select ${question.code}`}
                  checked={Boolean(chosen)}
                  onChange={(event) => setSelected(event.target.checked)}
                  type="checkbox"
                />
                <div className={styles.questionChoiceContent}>
                  <strong>{question.code}</strong>
                  <RichContent value={version.content} />
                </div>
                <div className={styles.questionMarks}>
                  <label>
                    <span>Marks</span>
                    <input
                      aria-label={`Marks for ${question.code}`}
                      disabled={!chosen}
                      onChange={(event) =>
                        onSelectionChange(
                          selectedQuestions.map((item) =>
                            item.questionVersionId === version.id
                              ? { ...item, marks: Number(event.target.value) }
                              : item,
                          ),
                        )
                      }
                      step="0.25"
                      type="number"
                      value={chosen?.marks ?? Number(version.defaultMarks)}
                    />
                  </label>
                  <label>
                    <span>Negative</span>
                    <input
                      aria-label={`Negative marks for ${question.code}`}
                      disabled={!chosen}
                      onChange={(event) =>
                        onSelectionChange(
                          selectedQuestions.map((item) =>
                            item.questionVersionId === version.id
                              ? {
                                  ...item,
                                  negativeMarks: Number(event.target.value),
                                }
                              : item,
                          ),
                        )
                      }
                      step="0.25"
                      type="number"
                      value={
                        chosen?.negativeMarks ??
                        Number(version.defaultNegativeMarks)
                      }
                    />
                  </label>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

type QuestionDetailOption = {
  code: string;
  content: string;
  isCorrect: boolean;
};

function QuestionDetails({
  id,
  placement,
  comprehensionCode,
  comprehensionContent,
  questionContent,
  options,
  correctAnswer,
  acceptedAnswers,
  numericTolerance,
  caseSensitive,
  explanation,
  isMandatory,
  validationMessage,
}: {
  id: string;
  placement?: Array<{ label: string; value?: string | number | null }>;
  comprehensionCode?: string | null;
  comprehensionContent?: string | null;
  questionContent?: string | null;
  options?: QuestionDetailOption[] | null;
  correctAnswer?: string | null;
  acceptedAnswers?: string[] | null;
  numericTolerance?: string | number | null;
  caseSensitive?: boolean;
  explanation?: string | null;
  isMandatory?: boolean;
  validationMessage?: string | null;
}) {
  const visiblePlacement =
    placement?.filter(
      (item) =>
        item.value !== null && item.value !== undefined && item.value !== "",
    ) ?? [];
  return (
    <div className={styles.questionDetails} id={id}>
      {visiblePlacement.length ? (
        <dl className={styles.detailMeta}>
          {visiblePlacement.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {comprehensionContent ? (
        <section className={styles.detailSection}>
          <div className={styles.detailHeading}>
            <strong>Comprehension</strong>
            {comprehensionCode ? <span>{comprehensionCode}</span> : null}
          </div>
          <RichContent value={comprehensionContent} />
        </section>
      ) : null}
      <section className={styles.detailSection}>
        <div className={styles.detailHeading}>
          <strong>Question</strong>
        </div>
        <RichContent value={questionContent} />
      </section>
      {options?.length ? (
        <section className={styles.detailSection}>
          <div className={styles.detailHeading}>
            <strong>Options</strong>
          </div>
          <div className={styles.optionList}>
            {options.map((option) => {
              const isCorrect =
                option.isCorrect || option.code === correctAnswer;
              return (
                <div
                  className={styles.optionItem}
                  data-correct={isCorrect}
                  key={option.code}
                >
                  <span className={styles.optionCode}>{option.code}</span>
                  <RichContent value={option.content} />
                  {isCorrect ? (
                    <span className={styles.correctBadge}>Correct</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
      {correctAnswer ||
      acceptedAnswers?.length ||
      (numericTolerance !== null && numericTolerance !== undefined) ||
      caseSensitive ||
      isMandatory !== undefined ? (
        <section className={styles.detailSection}>
          <div className={styles.detailHeading}>
            <strong>Answer rules</strong>
          </div>
          <dl className={styles.answerRules}>
            {correctAnswer ? (
              <div>
                <dt>Correct option</dt>
                <dd>{correctAnswer}</dd>
              </div>
            ) : null}
            {acceptedAnswers?.length ? (
              <div>
                <dt>Accepted answers</dt>
                <dd>{acceptedAnswers.join(" · ")}</dd>
              </div>
            ) : null}
            {numericTolerance !== null && numericTolerance !== undefined ? (
              <div>
                <dt>Numeric tolerance</dt>
                <dd>{numericTolerance}</dd>
              </div>
            ) : null}
            <div>
              <dt>Case sensitive</dt>
              <dd>{caseSensitive ? "Yes" : "No"}</dd>
            </div>
            {isMandatory !== undefined ? (
              <div>
                <dt>Mandatory</dt>
                <dd>{isMandatory ? "Yes" : "No"}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}
      {explanation ? (
        <section className={styles.detailSection}>
          <div className={styles.detailHeading}>
            <strong>Explanation</strong>
          </div>
          <RichContent value={explanation} />
        </section>
      ) : null}
      {validationMessage ? (
        <div className={styles.detailValidation} role="alert">
          <strong>Validation issue</strong>
          <span>{validationMessage}</span>
        </div>
      ) : null}
    </div>
  );
}

function ImportQuestionDetails({ row }: { row: ExamImportRow }) {
  return (
    <QuestionDetails
      acceptedAnswers={row.acceptedAnswersJson}
      caseSensitive={row.caseSensitive}
      comprehensionCode={row.comprehensionCode}
      comprehensionContent={row.comprehensionText}
      correctAnswer={row.correctAnswer}
      explanation={row.explanation}
      id={`import-question-detail-${row.id}`}
      isMandatory={row.isMandatory}
      numericTolerance={row.numericTolerance}
      options={row.optionsJson}
      placement={[
        { label: "Slot", value: row.slotCode },
        { label: "Section", value: row.sectionCode },
        { label: "Subject", value: row.subjectCode },
        { label: "Order", value: row.sortOrder },
        {
          label: "Marking",
          value:
            row.marks !== null && row.negativeMarks !== null
              ? `+${row.marks} / −${row.negativeMarks}`
              : null,
        },
      ]}
      questionContent={row.questionText}
      validationMessage={row.validationMessage}
    />
  );
}

export function ExamManagementPage() {
  const currentUser = useCurrentUser();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("templates");
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<
    number | undefined
  >(currentUser?.organizationId ?? undefined);
  const organizationId = currentUser?.organizationId ?? selectedOrganizationId;
  const [notice, setNotice] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  const organizations = useQuery({
    queryKey: ["exam-organizations"],
    queryFn: () => organizationsApi.findAll({ page: 1, limit: 100 }),
    enabled: !currentUser?.organizationId,
  });
  const subjects = useQuery({
    queryKey: ["exam-subjects", organizationId],
    queryFn: () => examsApi.subjects.list(organizationId),
    enabled: Boolean(organizationId),
  });
  const questions = useQuery({
    queryKey: ["exam-questions", organizationId],
    queryFn: () => examsApi.questions.list({ organizationId, limit: 100 }),
    enabled: Boolean(organizationId),
  });
  const questionTypes = useQuery({
    queryKey: ["exam-question-types"],
    queryFn: () => examsApi.questionTypes.list(),
  });
  const templates = useQuery({
    queryKey: ["exam-templates", organizationId],
    queryFn: () => examsApi.templates.list(organizationId),
    enabled: Boolean(organizationId),
  });
  const scheduled = useQuery({
    queryKey: ["scheduled-exams", organizationId],
    queryFn: () => examsApi.scheduled.list(organizationId),
    enabled: Boolean(organizationId),
  });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["exam-subjects", organizationId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["exam-questions", organizationId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["exam-templates", organizationId],
      }),
      queryClient.invalidateQueries({ queryKey: ["exam-template-detail"] }),
      queryClient.invalidateQueries({
        queryKey: ["scheduled-exams", organizationId],
      }),
    ]);
  };
  const report: Report = (promise, success, afterSuccess) => {
    setNotice(null);
    void promise
      .then(async () => {
        await refresh();
        await afterSuccess?.();
        setNotice({ kind: "success", text: success });
      })
      .catch((error) => setNotice({ kind: "error", text: messageOf(error) }));
  };

  if (!organizationId) {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Assessment workspace</p>
            <h1>Exam Management</h1>
            <p>Select an organization to work within its isolated exam data.</p>
          </div>
        </header>
        <section className={styles.organizationCard}>
          <div className={styles.organizationField}>
            <label
              className={styles.organizationLabel}
              htmlFor="exam-organization"
            >
              Organization
            </label>
            <CrudSelect
              ariaLabel="Organization"
              id="exam-organization"
              loading={organizations.isLoading}
              onChange={(value) =>
                setSelectedOrganizationId(Number(value) || undefined)
              }
              options={
                organizations.data?.items.map((organization) => ({
                  label: organization.name,
                  value: String(organization.id),
                })) ?? []
              }
              placeholder="Choose organization"
              value={selectedOrganizationId?.toString() ?? ""}
              variant="form"
              width="100%"
            />
          </div>
        </section>
      </main>
    );
  }

  const tabs: Array<{
    id: Tab;
    label: string;
    icon: typeof Layers3;
    count?: number;
  }> = [
    {
      id: "templates",
      label: "Templates",
      icon: Layers3,
      count: templates.data?.length,
    },
    {
      id: "subjects",
      label: "Subjects",
      icon: Library,
      count: subjects.data?.length,
    },
    {
      id: "questions",
      label: "Question bank",
      icon: ClipboardList,
      count: questions.data?.length,
    },
    { id: "imports", label: "Word / Excel import", icon: FileUp },
    {
      id: "schedule",
      label: "Schedule exams",
      icon: CalendarClock,
      count: scheduled.data?.length,
    },
  ];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Assessment workspace</p>
          <h1>Exam Management</h1>
          <p>
            Build reusable exam blueprints, validate questions, and schedule
            controlled attempts.
          </p>
        </div>
        <div className={styles.headerBadge}>
          <BookOpenCheck size={22} />
          <div>
            <strong>
              {templates.data?.filter((item) => item.status === "PUBLISHED")
                .length ?? 0}
            </strong>
            <span>Published templates</span>
          </div>
        </div>
      </header>
      {notice ? (
        <div
          className={notice.kind === "success" ? styles.success : styles.error}
        >
          {notice.text}
        </div>
      ) : null}
      <nav className={styles.tabs} aria-label="Exam module sections">
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            className={tab === id ? styles.activeTab : ""}
            onClick={() => setTab(id)}
          >
            <Icon size={17} />
            {label}
            {count !== undefined ? <span>{count}</span> : null}
          </button>
        ))}
      </nav>
      {tab === "templates" ? (
        <TemplatesPanel
          organizationId={organizationId}
          templates={templates.data ?? []}
          subjects={subjects.data ?? []}
          questionTypes={questionTypes.data ?? []}
          clearNotice={() => setNotice(null)}
          report={report}
        />
      ) : null}
      {tab === "subjects" ? (
        <SubjectsPanel
          organizationId={organizationId}
          subjects={subjects.data ?? []}
          report={report}
        />
      ) : null}
      {tab === "questions" ? (
        <QuestionsPanel
          organizationId={organizationId}
          subjects={subjects.data ?? []}
          questions={questions.data ?? []}
          questionTypes={questionTypes.data ?? []}
          report={report}
        />
      ) : null}
      {tab === "imports" ? (
        <ImportsPanel templates={templates.data ?? []} report={report} />
      ) : null}
      {tab === "schedule" ? (
        <SchedulePanel
          organizationId={organizationId}
          templates={templates.data ?? []}
          exams={scheduled.data ?? []}
          report={report}
        />
      ) : null}
    </main>
  );
}

function TemplatesPanel({
  organizationId,
  templates,
  subjects,
  questionTypes,
  clearNotice,
  report,
}: {
  organizationId: number;
  templates: ExamTemplateListItem[];
  subjects: ExamSubject[];
  questionTypes: ExamQuestionType[];
  clearNotice: () => void;
  report: Report;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ExamTemplate | null>(
    null,
  );
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(
    null,
  );
  const [slots, setSlots] = useState<BuilderSlot[]>([emptySlot()]);
  const selected = templates.find((item) => item.id === selectedId);
  const hasDraft =
    selectedTemplate?.versions.some((item) => item.status === "DRAFT") ?? false;
  const selectedVersion = selectedTemplate?.versions.find(
    (item) => item.id === selectedVersionId,
  );
  const isSelectedDraft = selectedVersion?.status === "DRAFT";

  const showVersion = (version: ExamTemplateVersion) => {
    setSelectedVersionId(version.id);
    const versionSlots = version.slots ?? [];
    setSlots(
      versionSlots.length
        ? versionSlots.map((slot) => ({
            code: slot.code,
            name: slot.name,
            durationMinutes: slot.durationMinutes,
            sections: slot.sections.map((section) => ({
              code: section.code,
              name: section.name,
              durationMinutes: section.durationMinutes,
              questionsToAttempt:
                section.questionsToAttempt ??
                section.subjects.reduce(
                  (total, subject) => total + subject.questions.length,
                  0,
                ),
              subjectId: section.subjects[0]?.subjectId ?? 0,
              questions:
                section.subjects[0]?.questions.map((question) => ({
                  questionVersionId: question.questionVersionId,
                  marks: Number(question.marks),
                  negativeMarks: Number(question.negativeMarks),
                  code: question.questionVersion.question.code,
                  content: question.questionVersion.content,
                })) ?? [],
            })),
          }))
        : [emptySlot()],
    );
  };

  const loadBuilder = async (
    template: ExamTemplateListItem,
    preferredVersion: number | "draft" = "draft",
  ) => {
    clearNotice();
    setSelectedId(template.id);
    try {
      const detailedTemplate = await examsApi.templates.get(template.id);
      setSelectedTemplate(detailedTemplate);
      const version =
        (typeof preferredVersion === "number"
          ? detailedTemplate.versions.find(
              (item) => item.id === preferredVersion,
            )
          : detailedTemplate.versions.find(
              (item) => item.status === "DRAFT",
            )) ?? detailedTemplate.versions[0];
      if (version) showVersion(version);
    } catch (error) {
      setSelectedId(null);
      setSelectedTemplate(null);
      setSelectedVersionId(null);
      report(Promise.reject(error), "");
    }
  };

  const create = (formData: FormData) =>
    report(
      examsApi.templates.create({
        organizationId,
        code: String(formData.get("code")),
        name: String(formData.get("name")),
        description: String(formData.get("description") || ""),
        defaultDurationMinutes: Number(formData.get("duration")) || undefined,
      }),
      "Draft template created",
    );

  const updateSlot = (slotIndex: number, patch: Partial<BuilderSlot>) =>
    setSlots((current) =>
      current.map((slot, index) =>
        index === slotIndex ? { ...slot, ...patch } : slot,
      ),
    );
  const updateSection = (
    slotIndex: number,
    sectionIndex: number,
    patch: Partial<BuilderSection>,
  ) =>
    setSlots((current) =>
      current.map((slot, index) =>
        index === slotIndex
          ? {
              ...slot,
              sections: slot.sections.map((section, childIndex) =>
                childIndex === sectionIndex
                  ? { ...section, ...patch }
                  : section,
              ),
            }
          : slot,
      ),
    );
  const save = () => {
    if (!selected) return;
    const payload: SaveExamTemplateStructureRequest = {
      slots: slots.map((slot) => ({
        ...slot,
        sections: slot.sections.map((section) => ({
          code: section.code,
          name: section.name,
          durationMinutes: section.durationMinutes,
          questionsToAttempt: section.questionsToAttempt,
          subjects: [
            {
              subjectId: section.subjectId,
              questions: section.questions.map((question) => ({
                questionVersionId: question.questionVersionId,
                marks: question.marks,
                negativeMarks: question.negativeMarks,
              })),
            },
          ],
        })),
      })),
    };
    report(
      examsApi.templates.saveStructure(selected.id, payload),
      "Template structure saved",
      () => loadBuilder(selected, selectedVersionId ?? "draft"),
    );
  };

  return (
    <div className={styles.twoColumn}>
      <section className={styles.panel}>
        <div className={styles.panelTitle}>
          <div>
            <h2>Exam templates</h2>
            <p>Published versions remain immutable when exams are scheduled.</p>
          </div>
          <span>{templates.length}</span>
        </div>
        <form action={create} className={styles.compactForm}>
          <label>
            Template name
            <input name="name" placeholder="e.g., CUET General Test" required />
          </label>
          <label>
            Template code
            <input name="code" placeholder="e.g., CUET-GT" required />
          </label>
          <label>
            Default duration (minutes)
            <input
              name="duration"
              type="number"
              min="1"
              placeholder="e.g., 120"
            />
          </label>
          <label className={styles.fullWidthField}>
            Purpose and exam pattern
            <textarea
              name="description"
              placeholder="e.g., Reusable CUET mock-test pattern with English, General Knowledge, and Quantitative Aptitude sections."
              rows={3}
            />
          </label>
          <button className={styles.primaryButton}>
            <Plus size={16} />
            Create template
          </button>
        </form>
        <div className={styles.list}>
          {templates.map((template) => (
            <button
              type="button"
              key={template.id}
              onClick={() => void loadBuilder(template)}
              className={`${styles.listRow} ${selectedId === template.id ? styles.selectedRow : ""}`}
            >
              <div>
                <strong>{template.name}</strong>
                <span>
                  {template.code} · latest v
                  {template.versions[0]?.versionNumber ?? 1} ·{" "}
                  {template._count?.versions ?? template.versions.length}{" "}
                  {(template._count?.versions ?? template.versions.length) === 1
                    ? "version"
                    : "versions"}
                </span>
              </div>
              <Status value={template.versions[0]?.status ?? template.status} />
            </button>
          ))}
        </div>
      </section>
      <section className={styles.panel}>
        {!selected ? (
          <Empty
            icon={Layers3}
            title="Select a template"
            text="Choose a draft template to configure its slots, section timers, subjects, and question-wise marks."
          />
        ) : (
          <>
            <div className={styles.panelTitle}>
              <div>
                <h2>{selected.name}</h2>
                <p>
                  {isSelectedDraft
                    ? `Editing version ${selectedVersion?.versionNumber}`
                    : `Version ${selectedVersion?.versionNumber} is published and read-only`}
                </p>
              </div>
              <div className={styles.versionActions}>
                <div className={styles.versionPickerRow}>
                  <div className={styles.versionSelect}>
                    <CrudSelect
                      ariaLabel="Choose template version"
                      label="Template version"
                      onChange={(value) => {
                        const version = selectedTemplate?.versions.find(
                          (item) => item.id === Number(value),
                        );
                        if (version) showVersion(version);
                      }}
                      options={(selectedTemplate?.versions ?? []).map(
                        (version) => ({
                          label: `v${version.versionNumber} — ${version.status}`,
                          value: String(version.id),
                        }),
                      )}
                      value={selectedVersionId ? String(selectedVersionId) : ""}
                      variant="form"
                      width="100%"
                    />
                  </div>
                  {selectedVersion ? (
                    <Status value={selectedVersion.status} />
                  ) : null}
                </div>
                <div className={styles.inlineActions}>
                  <button
                    className={styles.secondaryButton}
                    disabled={!isSelectedDraft}
                    onClick={() =>
                      setSlots((current) => [
                        ...current,
                        {
                          ...emptySlot(),
                          code: `SLOT_${current.length + 1}`,
                          name: `Slot ${current.length + 1}`,
                        },
                      ])
                    }
                  >
                    <CirclePlus size={15} />
                    Slot
                  </button>
                  <button
                    className={styles.primaryButton}
                    disabled={!isSelectedDraft}
                    onClick={save}
                  >
                    <Save size={15} />
                    Save
                  </button>
                  <button
                    className={styles.publishButton}
                    disabled={!isSelectedDraft}
                    onClick={() =>
                      report(
                        examsApi.templates.publish(selected.id),
                        `Version ${selectedVersion?.versionNumber} published and locked`,
                        () =>
                          loadBuilder(selected, selectedVersionId ?? "draft"),
                      )
                    }
                  >
                    <Send size={15} />
                    Publish
                  </button>
                  {!hasDraft ? (
                    <button
                      className={styles.secondaryButton}
                      onClick={() =>
                        report(
                          examsApi.templates.createVersion(selected.id),
                          "New editable template version created",
                          () => loadBuilder(selected, "draft"),
                        )
                      }
                    >
                      <Plus size={15} />
                      New version
                    </button>
                  ) : null}
                  {hasDraft && !isSelectedDraft ? (
                    <button
                      className={styles.secondaryButton}
                      onClick={() => {
                        const draft = selectedTemplate?.versions.find(
                          (version) => version.status === "DRAFT",
                        );
                        if (draft) showVersion(draft);
                      }}
                    >
                      Open draft
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
            <div className={styles.builder}>
              {slots.map((slot, slotIndex) => (
                <article className={styles.slot} key={slotIndex}>
                  <div className={styles.slotHeader}>
                    <div className={styles.rowFields}>
                      <label>
                        Slot code
                        <input
                          disabled={!isSelectedDraft}
                          value={slot.code}
                          onChange={(e) =>
                            updateSlot(slotIndex, {
                              code: e.target.value.toUpperCase(),
                            })
                          }
                        />
                      </label>
                      <label>
                        Slot name
                        <input
                          disabled={!isSelectedDraft}
                          value={slot.name}
                          onChange={(e) =>
                            updateSlot(slotIndex, { name: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        Slot time (min)
                        <input
                          disabled={!isSelectedDraft}
                          type="number"
                          min="1"
                          value={slot.durationMinutes}
                          onChange={(e) =>
                            updateSlot(slotIndex, {
                              durationMinutes: Number(e.target.value),
                            })
                          }
                        />
                      </label>
                    </div>
                    <button
                      className={styles.dangerButton}
                      disabled={!isSelectedDraft || slots.length === 1}
                      onClick={() =>
                        setSlots((current) =>
                          current.length > 1
                            ? current.filter((_, index) => index !== slotIndex)
                            : current,
                        )
                      }
                      title={
                        slots.length === 1
                          ? "A template must contain at least one slot"
                          : `Remove ${slot.name}`
                      }
                      type="button"
                    >
                      <Trash2 size={14} />
                      Remove slot
                    </button>
                  </div>
                  {slot.sections.map((section, sectionIndex) => (
                    <div className={styles.sectionCard} key={sectionIndex}>
                      <div className={styles.rowFields}>
                        <label>
                          Section code
                          <input
                            disabled={!isSelectedDraft}
                            value={section.code}
                            onChange={(e) =>
                              updateSection(slotIndex, sectionIndex, {
                                code: e.target.value.toUpperCase(),
                              })
                            }
                          />
                        </label>
                        <label>
                          Section name
                          <input
                            disabled={!isSelectedDraft}
                            value={section.name}
                            onChange={(e) =>
                              updateSection(slotIndex, sectionIndex, {
                                name: e.target.value,
                              })
                            }
                          />
                        </label>
                        <label>
                          Time (min)
                          <input
                            disabled={!isSelectedDraft}
                            type="number"
                            min="1"
                            value={section.durationMinutes}
                            onChange={(e) =>
                              updateSection(slotIndex, sectionIndex, {
                                durationMinutes: Number(e.target.value),
                              })
                            }
                          />
                        </label>
                        <label>
                          Attempt
                          <input
                            disabled={!isSelectedDraft}
                            type="number"
                            min="1"
                            value={section.questionsToAttempt}
                            onChange={(e) =>
                              updateSection(slotIndex, sectionIndex, {
                                questionsToAttempt: Number(e.target.value),
                              })
                            }
                          />
                        </label>
                      </div>
                      <div className={styles.sectionSubjectField}>
                        <CrudSelectField
                          disabled={!isSelectedDraft}
                          label="Subject"
                          onChange={(value) =>
                            updateSection(slotIndex, sectionIndex, {
                              subjectId: Number(value),
                              questions: [],
                            })
                          }
                          options={subjects.map((subject) => ({
                            label: subject.name,
                            value: String(subject.id),
                          }))}
                          placeholder="Choose subject"
                          value={
                            section.subjectId ? String(section.subjectId) : ""
                          }
                        />
                      </div>
                      {!isSelectedDraft ? (
                        <div className={styles.questionPicker}>
                          {section.questions.length ? (
                            section.questions.map((question) => (
                              <div
                                className={styles.versionQuestion}
                                key={question.questionVersionId}
                              >
                                <CheckCircle2 size={15} aria-hidden="true" />
                                <div className={styles.versionQuestionContent}>
                                  <strong>{question.code}</strong>
                                  <RichContent value={question.content} />
                                </div>
                                <small>+{question.marks}</small>
                                <small>−{question.negativeMarks}</small>
                              </div>
                            ))
                          ) : (
                            <div className={styles.questionEmpty} role="status">
                              <ClipboardList size={20} aria-hidden="true" />
                              <strong>No questions in this version</strong>
                              <span>
                                This published section does not contain any
                                mapped questions.
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <SectionQuestionPicker
                          organizationId={organizationId}
                          onSelectionChange={(nextQuestions) =>
                            updateSection(slotIndex, sectionIndex, {
                              questions: nextQuestions,
                            })
                          }
                          questionTypes={questionTypes}
                          selectedQuestions={section.questions}
                          subjectId={section.subjectId}
                        />
                      )}
                    </div>
                  ))}
                  <button
                    className={styles.textButton}
                    disabled={!isSelectedDraft}
                    onClick={() =>
                      updateSlot(slotIndex, {
                        sections: [
                          ...slot.sections,
                          {
                            ...emptySection(),
                            code: `SECTION_${slot.sections.length + 1}`,
                          },
                        ],
                      })
                    }
                  >
                    <Plus size={14} />
                    Add timed section
                  </button>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function SubjectsPanel({
  organizationId,
  subjects,
  report,
}: {
  organizationId: number;
  subjects: ExamSubject[];
  report: Report;
}) {
  return (
    <div className={styles.twoColumn}>
      <section className={styles.panel}>
        <div className={styles.panelTitle}>
          <div>
            <h2>Add subject</h2>
            <p>Subjects are tenant-scoped and reused across templates.</p>
          </div>
          <UsersRound />
        </div>
        <form
          action={(form) =>
            report(
              examsApi.subjects.create({
                organizationId,
                code: String(form.get("code")),
                name: String(form.get("name")),
                description: String(form.get("description") || ""),
              }),
              "Subject created",
            )
          }
          className={styles.form}
        >
          <label>
            Subject name
            <input name="name" required placeholder="Quantitative Aptitude" />
          </label>
          <label>
            Stable code
            <input name="code" required placeholder="MATHEMATICS" />
          </label>
          <label>
            Description
            <textarea
              name="description"
              placeholder="Coverage and intended use"
            />
          </label>
          <button className={styles.primaryButton}>
            <Plus size={16} />
            Create subject
          </button>
        </form>
      </section>
      <section className={styles.panel}>
        <div className={styles.panelTitle}>
          <div>
            <h2>Subject catalog</h2>
            <p>{subjects.length} available for question mapping</p>
          </div>
        </div>
        <div className={styles.catalog}>
          {subjects.map((subject) => (
            <article key={subject.id}>
              <div className={styles.subjectIcon}>
                {subject.code.slice(0, 2)}
              </div>
              <div>
                <strong>{subject.name}</strong>
                <span>{subject.code}</span>
                <p>{subject.description || "No description"}</p>
              </div>
              <Status value={subject.isActive ? "ACTIVE" : "INACTIVE"} />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function QuestionsPanel({
  organizationId,
  subjects,
  questions,
  questionTypes,
  report,
}: {
  organizationId: number;
  subjects: ExamSubject[];
  questions: ExamQuestion[];
  questionTypes: ExamQuestionType[];
  report: Report;
}) {
  const [newQuestionSubjectId, setNewQuestionSubjectId] = useState(0);
  const [questionTypeId, setQuestionTypeId] = useState(0);
  const [questionSearch, setQuestionSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(
    null,
  );
  const questionType = questionTypes.find((item) => item.id === questionTypeId);
  const typeCode = questionType?.code;
  const normalizedSearch = questionSearch.trim().toLowerCase();
  const filteredQuestions = questions.filter((question) => {
    const version = question.versions[0];
    const matchesSearch =
      !normalizedSearch ||
      question.code.toLowerCase().includes(normalizedSearch) ||
      question.subject.name.toLowerCase().includes(normalizedSearch) ||
      contentSummary(version?.content).toLowerCase().includes(normalizedSearch);
    return (
      matchesSearch &&
      (subjectFilter === "all" ||
        question.subject.id === Number(subjectFilter)) &&
      (typeFilter === "all" ||
        version?.questionTypeId === Number(typeFilter)) &&
      (statusFilter === "all" || question.status === statusFilter)
    );
  });
  const create = (form: FormData) => {
    const answer = String(form.get("answer") || "").trim();
    const options = ["A", "B", "C", "D"]
      .map((code) => ({
        code,
        content: String(form.get(`option_${code}`) || ""),
        isCorrect: answer.toUpperCase() === code,
      }))
      .filter((item) => item.content);
    report(
      examsApi.questions.create({
        organizationId,
        subjectId: newQuestionSubjectId,
        code: String(form.get("code")),
        questionTypeId,
        content: String(form.get("content")),
        explanation: String(form.get("explanation") || ""),
        defaultMarks: Number(form.get("marks")),
        defaultNegativeMarks: Number(form.get("negativeMarks")),
        options: typeCode === "SINGLE_CHOICE" ? options : undefined,
        acceptedAnswers:
          typeCode === "SINGLE_CHOICE"
            ? undefined
            : answer
                .split("|")
                .map((item) => item.trim())
                .filter(Boolean),
        numericTolerance: Number(form.get("tolerance")) || 0,
      }),
      "Question added to the bank",
    );
  };
  return (
    <div className={styles.twoColumn}>
      <section className={styles.panel}>
        <div className={styles.panelTitle}>
          <div>
            <h2>Create question</h2>
            <p>
              Each change is stored as a version so scheduled exams remain
              stable.
            </p>
          </div>
        </div>
        <form action={create} className={styles.form}>
          <div className={styles.rowFields}>
            <label>
              Code
              <input name="code" required placeholder="MAT-SC-002" />
            </label>
            <CrudSelectField
              label="Subject"
              onChange={(value) => setNewQuestionSubjectId(Number(value))}
              options={subjects.map((subject) => ({
                label: subject.name,
                value: String(subject.id),
              }))}
              placeholder="Choose subject"
              value={newQuestionSubjectId ? String(newQuestionSubjectId) : ""}
            />
            <CrudSelectField
              label="Answer type"
              onChange={(value) => setQuestionTypeId(Number(value))}
              options={questionTypes.map((item) => ({
                label: `${item.name} (ID ${item.id})`,
                value: String(item.id),
              }))}
              placeholder="Choose answer type"
              value={questionTypeId ? String(questionTypeId) : ""}
            />
          </div>
          <label>
            Question
            <textarea
              name="content"
              required
              rows={4}
              placeholder="Enter the complete question statement"
            />
          </label>
          {typeCode === "SINGLE_CHOICE" ? (
            <div className={styles.optionGrid}>
              {["A", "B", "C", "D"].map((code) => (
                <label key={code}>
                  Option {code}
                  <input
                    name={`option_${code}`}
                    required
                    placeholder={`Option ${code}`}
                  />
                </label>
              ))}
            </div>
          ) : null}
          <div className={styles.rowFields}>
            <label>
              {typeCode === "SINGLE_CHOICE"
                ? "Correct option code"
                : "Accepted answer(s)"}
              <input
                name="answer"
                required
                placeholder={
                  typeCode === "SINGLE_CHOICE"
                    ? "A"
                    : "Use | between alternatives"
                }
              />
            </label>
            {typeCode === "NUMERIC" ? (
              <label>
                Tolerance
                <input
                  name="tolerance"
                  type="number"
                  step="0.000001"
                  defaultValue="0"
                />
              </label>
            ) : null}
            <label>
              Marks
              <input
                name="marks"
                type="number"
                step="0.25"
                min="0"
                defaultValue="5"
                required
              />
            </label>
            <label>
              Negative marks
              <input
                name="negativeMarks"
                type="number"
                step="0.25"
                min="0"
                defaultValue="1"
                required
              />
            </label>
          </div>
          <label>
            Explanation
            <textarea name="explanation" rows={2} />
          </label>
          <button
            className={styles.primaryButton}
            disabled={!newQuestionSubjectId || !questionTypeId}
          >
            <Plus size={16} />
            Add question
          </button>
        </form>
      </section>
      <section className={styles.panel}>
        <div className={styles.panelTitle}>
          <div>
            <h2>Question bank</h2>
            <p>
              {filteredQuestions.length} of {questions.length} reusable
              questions
            </p>
          </div>
        </div>
        <div className={styles.questionToolbar}>
          <label className={styles.questionSearch}>
            <span>Search questions</span>
            <div>
              <Search aria-hidden="true" size={15} />
              <input
                aria-label="Search question bank"
                onChange={(event) => setQuestionSearch(event.target.value)}
                placeholder="Code, subject, or question"
                type="search"
                value={questionSearch}
              />
            </div>
          </label>
          <CrudSelect
            ariaLabel="Filter question bank by subject"
            label="Subject"
            onChange={setSubjectFilter}
            options={[
              { label: "All subjects", value: "all" },
              ...subjects.map((subject) => ({
                label: subject.name,
                value: String(subject.id),
              })),
            ]}
            value={subjectFilter}
            width="100%"
          />
          <CrudSelect
            ariaLabel="Filter question bank by answer type"
            label="Answer type"
            onChange={setTypeFilter}
            options={[
              { label: "All types", value: "all" },
              ...questionTypes.map((item) => ({
                label: item.name,
                value: String(item.id),
              })),
            ]}
            value={typeFilter}
            width="100%"
          />
          <CrudSelect
            ariaLabel="Filter question bank by status"
            label="Status"
            onChange={setStatusFilter}
            options={[
              { label: "All statuses", value: "all" },
              { label: "Draft", value: "DRAFT" },
              { label: "Published", value: "PUBLISHED" },
              { label: "Archived", value: "ARCHIVED" },
            ]}
            value={statusFilter}
            width="100%"
          />
        </div>
        <div className={styles.questionList}>
          {!filteredQuestions.length ? (
            <div className={styles.questionEmpty} role="status">
              <ClipboardList size={20} aria-hidden="true" />
              <strong>
                {questions.length
                  ? "No matching questions"
                  : "No questions yet"}
              </strong>
              <span>
                {questions.length
                  ? "Adjust the search or filters to see more questions."
                  : "Create a question manually or import a Word and Excel file pair."}
              </span>
            </div>
          ) : null}
          {filteredQuestions.map((question) => {
            const version = question.versions[0];
            const isExpanded = expandedQuestionId === question.id;
            const acceptedAnswers =
              version?.acceptedAnswers
                .map((answer) => answer.textValue ?? answer.numericValue)
                .filter((answer): answer is string => Boolean(answer)) ?? [];
            return (
              <article data-expanded={isExpanded} key={question.id}>
                <button
                  aria-controls={`question-bank-detail-${question.id}`}
                  aria-expanded={isExpanded}
                  className={styles.questionSummary}
                  onClick={() =>
                    setExpandedQuestionId(isExpanded ? null : question.id)
                  }
                  type="button"
                >
                  <div className={styles.questionIdentity}>
                    <strong>{question.code}</strong>
                    <span>{question.subject.name}</span>
                  </div>
                  <p>{contentSummary(version?.content)}</p>
                  <div className={styles.questionSummaryMeta}>
                    <span className={styles.typeBadge}>
                      {version?.questionType.name ?? "Unknown type"}
                    </span>
                    <Status value={question.status} />
                    <span className={styles.markingSummary}>
                      +{version?.defaultMarks ?? "—"} / −
                      {version?.defaultNegativeMarks ?? "—"}
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className={styles.expandIcon}
                      size={17}
                    />
                  </div>
                </button>
                {isExpanded ? (
                  <QuestionDetails
                    acceptedAnswers={acceptedAnswers}
                    caseSensitive={version?.caseSensitive}
                    comprehensionCode={version?.comprehension?.code}
                    comprehensionContent={version?.comprehension?.content}
                    correctAnswer={
                      version?.options.find((option) => option.isCorrect)?.code
                    }
                    explanation={version?.explanation}
                    id={`question-bank-detail-${question.id}`}
                    numericTolerance={
                      version?.acceptedAnswers.find(
                        (answer) => answer.numericTolerance !== null,
                      )?.numericTolerance
                    }
                    options={version?.options}
                    placement={[
                      {
                        label: "Version",
                        value: version ? `v${version.versionNumber}` : null,
                      },
                      {
                        label: "Default marking",
                        value: version
                          ? `+${version.defaultMarks} / −${version.defaultNegativeMarks}`
                          : null,
                      },
                    ]}
                    questionContent={version?.content}
                  />
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ImportsPanel({
  templates,
  report,
}: {
  templates: ExamTemplateListItem[];
  report: Report;
}) {
  const [templateId, setTemplateId] = useState(0);
  const [scope, setScope] = useState<"SINGLE_SECTION" | "FULL_EXAM">(
    "SINGLE_SECTION",
  );
  const [sectionId, setSectionId] = useState(0);
  const [job, setJob] = useState<ExamImportJob | null>(null);
  const [expandedImportRowId, setExpandedImportRowId] = useState<number | null>(
    null,
  );
  const [isCommitting, setIsCommitting] = useState(false);
  const templateDetails = useQuery({
    queryKey: ["exam-template-detail", templateId],
    queryFn: () => examsApi.templates.get(templateId),
    enabled: Boolean(templateId),
  });
  const version = templateDetails.data?.versions.find(
    (item) => item.status === "DRAFT",
  );
  const sections =
    version?.slots.flatMap((slot) =>
      slot.sections.map((section) => ({
        ...section,
        slotId: slot.id,
        slotName: slot.name,
      })),
    ) ?? [];
  const selectedSection = sections.find((section) => section.id === sectionId);
  const downloadTemplate = async (kind: "word" | "excel") => {
    try {
      const blob =
        kind === "word"
          ? await examsApi.imports.downloadWordTemplate()
          : await examsApi.imports.downloadTemplate();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download =
        kind === "word"
          ? "exam-question-content-template.docx"
          : "exam-question-mapping-template.xlsx";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      report(Promise.reject(error), "");
    }
  };
  const stage = async (form: FormData) => {
    const wordFile = form.get("wordFile");
    const excelFile = form.get("excelFile");
    if (!(wordFile instanceof File) || !(excelFile instanceof File) || !version)
      return;
    const payload = new FormData();
    payload.set("wordFile", wordFile);
    payload.set("excelFile", excelFile);
    payload.set("examTemplateVersionId", String(version.id));
    payload.set("scope", scope);
    if (scope === "SINGLE_SECTION") {
      payload.set("examTemplateSectionId", String(sectionId));
      payload.set("examTemplateSlotId", String(selectedSection?.slotId ?? ""));
    }
    try {
      const stagedJob = await examsApi.imports.stage(payload);
      setJob(stagedJob);
      setExpandedImportRowId(null);
    } catch (error) {
      report(Promise.reject(error), "");
    }
  };
  const commit = async () => {
    if (!job || job.status !== "READY_FOR_REVIEW" || isCommitting) return;
    setIsCommitting(true);
    try {
      const committedJob = await examsApi.imports.commit(job.id);
      setJob(committedJob);
      report(Promise.resolve(), "Import committed atomically");
    } catch (error) {
      report(Promise.reject(error), "");
    } finally {
      setIsCommitting(false);
    }
  };
  return (
    <div className={styles.twoColumn}>
      <section className={styles.panel}>
        <div className={styles.panelTitle}>
          <div>
            <h2>Controlled question import</h2>
            <p>
              Files are parsed into staging rows; nothing reaches the question
              bank until you confirm.
            </p>
          </div>
          <FileSpreadsheet />
        </div>
        <div className={styles.guide}>
          <strong>Two files form one controlled import</strong>
          <code>Heading 1: Comprehension - RC-001</code>
          <code>Passage text and/or embedded images</code>
          <code>Heading 2: Question - ENG-RC-001</code>
          <code>Question text and/or diagram images</code>
          <code>Heading 3: Options → two-column Code / Content table</code>
          <code>Heading 3: Answer Rules → Field / Value table</code>
          <code>Heading 3: Explanation → text and/or images</code>
          <code>Heading 1: Standalone Questions</code>
          <p>
            Word owns content, options, answer rules, and explanations. The next
            Heading 2 starts the next question, so no END markers are needed. A
            comprehension applies to consecutive questions until another
            Comprehension heading or Standalone Questions. Excel maps matching
            question codes to slot, section, its single subject, question type
            ID, marks, order, and mandatory status.
          </p>
        </div>
        <div className={styles.templateActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => downloadTemplate("word")}
          >
            <FileText size={16} />
            Download Word template
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => downloadTemplate("excel")}
          >
            <FileSpreadsheet size={16} />
            Download Excel mapping
          </button>
        </div>
        <form action={stage} className={styles.form}>
          <CrudSelectField
            description={
              version
                ? `Questions will be imported into version ${version.versionNumber}, which is the active draft.`
                : undefined
            }
            label="Draft template"
            onChange={(value) => {
              setTemplateId(Number(value));
              setSectionId(0);
            }}
            options={templates
              .filter((item) =>
                item.versions.some(
                  (versionItem) => versionItem.status === "DRAFT",
                ),
              )
              .map((item) => ({
                label: `${item.name} - v${item.versions.find((versionItem) => versionItem.status === "DRAFT")?.versionNumber} Draft`,
                value: String(item.id),
              }))}
            placeholder="Choose template"
            value={templateId ? String(templateId) : ""}
          />
          <CrudSelectField
            label="Import scope"
            onChange={(value) => setScope(value as typeof scope)}
            options={[
              { label: "One section", value: "SINGLE_SECTION" },
              {
                label: "Full exam (destinations from Excel)",
                value: "FULL_EXAM",
              },
            ]}
            value={scope}
          />
          {scope === "SINGLE_SECTION" ? (
            <>
              <CrudSelectField
                label="Destination section"
                onChange={(value) => setSectionId(Number(value))}
                options={sections.map((section) => ({
                  label: `${section.slotName} / ${section.name}`,
                  value: String(section.id),
                }))}
                placeholder="Choose section"
                value={sectionId ? String(sectionId) : ""}
              />
              <label>
                Section subject
                <input
                  readOnly
                  value={
                    selectedSection?.subjects[0]?.subject.name ??
                    "Choose a section"
                  }
                />
              </label>
            </>
          ) : null}
          <label>
            Word content file
            <input type="file" name="wordFile" accept=".docx" required />
          </label>
          <label>
            Excel mapping file
            <input type="file" name="excelFile" accept=".xlsx" required />
          </label>
          <button
            className={styles.primaryButton}
            disabled={!version || (scope === "SINGLE_SECTION" && !sectionId)}
          >
            <FileUp size={16} />
            Stage and validate
          </button>
        </form>
      </section>
      <section className={styles.panel}>
        <div className={styles.panelTitle}>
          <div>
            <h2>Import preview</h2>
            <p>Review row-level validation before the atomic commit.</p>
          </div>
          {job ? <Status value={job.status} /> : null}
        </div>
        {!job ? (
          <Empty
            icon={FileUp}
            title="No staged file pair"
            text="Upload one .docx content file and one .xlsx mapping file to validate their matching question codes."
          />
        ) : (
          <>
            <div className={styles.importStats}>
              <span>
                <strong>{job.totalRows}</strong>Total
              </span>
              <span>
                <strong>{job.validRows}</strong>Valid
              </span>
              <span>
                <strong>{job.warningRows}</strong>Warnings
              </span>
              <span>
                <strong>{job.errorRows}</strong>Errors
              </span>
            </div>
            <div className={styles.previewTable}>
              <table>
                <thead>
                  <tr>
                    <th>View</th>
                    <th>Row</th>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Marks</th>
                    <th>Validation</th>
                  </tr>
                </thead>
                <tbody>
                  {job.rows.map((row) => {
                    const isExpanded = expandedImportRowId === row.id;
                    return (
                      <Fragment key={row.id}>
                        <tr data-expanded={isExpanded}>
                          <td>
                            <button
                              aria-controls={`import-question-detail-${row.id}`}
                              aria-expanded={isExpanded}
                              aria-label={`${isExpanded ? "Hide" : "View"} ${row.questionCode ?? `row ${row.sourceIndex}`} details`}
                              className={styles.rowExpandButton}
                              onClick={() =>
                                setExpandedImportRowId(
                                  isExpanded ? null : row.id,
                                )
                              }
                              type="button"
                            >
                              <ChevronDown aria-hidden="true" size={16} />
                            </button>
                          </td>
                          <td>{row.sourceIndex}</td>
                          <td>
                            <strong className={styles.questionCode}>
                              {row.questionCode ?? "Missing code"}
                            </strong>
                          </td>
                          <td>
                            {row.questionType
                              ? `${row.questionType.name} (ID ${row.questionType.id})`
                              : row.rawQuestionTypeId
                                ? `Unknown ID ${row.rawQuestionTypeId}`
                                : "—"}
                          </td>
                          <td>
                            {row.marks ?? "—"} / −{row.negativeMarks ?? "—"}
                          </td>
                          <td>
                            <Status value={row.status} />
                            {row.validationMessage ? (
                              <small>{row.validationMessage}</small>
                            ) : null}
                          </td>
                        </tr>
                        {isExpanded ? (
                          <tr className={styles.previewDetailRow}>
                            <td colSpan={6}>
                              <ImportQuestionDetails row={row} />
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button
              className={styles.publishButton}
              disabled={job.status !== "READY_FOR_REVIEW" || isCommitting}
              onClick={commit}
            >
              <CheckCircle2 size={16} />
              {isCommitting ? "Importing…" : "Confirm import"}
            </button>
          </>
        )}
      </section>
    </div>
  );
}

function SchedulePanel({
  organizationId,
  templates,
  exams,
  report,
}: {
  organizationId: number;
  templates: ExamTemplateListItem[];
  exams: ScheduledExam[];
  report: Report;
}) {
  const [sessionId, setSessionId] = useState(0);
  const [templateId, setTemplateId] = useState(0);
  const [versionId, setVersionId] = useState(0);
  const [courseIds, setCourseIds] = useState<number[]>([]);
  const [folderId, setFolderId] = useState(0);
  const [availableFrom, setAvailableFrom] = useState<Date | null>(null);
  const [availableUntil, setAvailableUntil] = useState<Date | null>(null);
  const sessions = useQuery({
    queryKey: ["exam-sessions", organizationId],
    queryFn: () => sessionsApi.findAll(organizationId, { page: 1, limit: 100 }),
  });
  const courses = useQuery({
    queryKey: ["exam-session-courses", sessionId],
    queryFn: () =>
      sessionCoursesApi.findAll(sessionId, { page: 1, limit: 100 }),
    enabled: Boolean(sessionId),
  });
  const firstCourseId = courseIds[0];
  const folders = useQuery({
    queryKey: ["exam-resource-folders", firstCourseId],
    queryFn: () => foldersApi.findAll(firstCourseId, { page: 1, limit: 100 }),
    enabled: Boolean(firstCourseId),
  });
  const templateDetails = useQuery({
    queryKey: ["exam-template-detail", templateId],
    queryFn: () => examsApi.templates.get(templateId),
    enabled: Boolean(templateId),
  });
  const publishedVersions =
    templateDetails.data?.versions.filter(
      (item) => item.status === "PUBLISHED",
    ) ?? [];
  const version =
    publishedVersions.find((item) => item.id === versionId) ??
    publishedVersions[0];
  const create = (form: FormData) => {
    if (!version) return;
    report(
      examsApi.scheduled.create({
        organizationId,
        sessionId,
        examTemplateVersionId: version.id,
        code: String(form.get("code")),
        title: String(form.get("title")),
        instructions: String(form.get("instructions") || ""),
        availableFrom: new Date(
          String(form.get("availableFrom")),
        ).toISOString(),
        availableUntil: new Date(
          String(form.get("availableUntil")),
        ).toISOString(),
        durationMinutes: Number(form.get("duration")),
        attemptLimit: Number(form.get("attemptLimit")),
        status: "SCHEDULED",
        selectedSlotIds: version.slots.map((slot) => slot.id),
        sessionCourseIds: courseIds,
        resourceFolderId: folderId || undefined,
      }),
      "Exam scheduled and linked as Resource Type 3",
    );
  };
  return (
    <div className={styles.twoColumn}>
      <section className={styles.panel}>
        <div className={styles.panelTitle}>
          <div>
            <h2>Schedule an exam</h2>
            <p>
              Availability, overall time, slot time, section time, and attempts
              are enforced independently.
            </p>
          </div>
          <CalendarClock />
        </div>
        <form action={create} className={styles.form}>
          <div className={styles.rowFields}>
            <label>
              Exam title
              <input name="title" required placeholder="CUET Mock Test 02" />
            </label>
            <label>
              Code
              <input name="code" required placeholder="CUET-MOCK-02" />
            </label>
          </div>
          <CrudSelectField
            label="Published template"
            onChange={(value) => {
              setTemplateId(Number(value));
              setVersionId(0);
            }}
            options={templates
              .filter((item) =>
                item.versions.some((child) => child.status === "PUBLISHED"),
              )
              .map((item) => ({
                label: item.name,
                value: String(item.id),
              }))}
            placeholder="Choose template"
            value={templateId ? String(templateId) : ""}
          />
          <CrudSelectField
            description="Scheduled attempts remain permanently linked to this version."
            disabled={!publishedVersions.length}
            label="Published version"
            onChange={(value) => setVersionId(Number(value))}
            options={publishedVersions.map((publishedVersion) => ({
              label: `Version ${publishedVersion.versionNumber} - Published`,
              value: String(publishedVersion.id),
            }))}
            placeholder="Choose version"
            value={version ? String(version.id) : ""}
          />
          <CrudSelectField
            label="Session"
            loading={sessions.isLoading}
            onChange={(value) => {
              setSessionId(Number(value));
              setCourseIds([]);
              setFolderId(0);
            }}
            options={(sessions.data?.items ?? []).map((session) => ({
              label: session.name,
              value: String(session.id),
            }))}
            placeholder="Choose session"
            value={sessionId ? String(sessionId) : ""}
          />
          <CrudMultiSelectField
            disabled={!sessionId}
            label="Available to courses"
            loading={courses.isLoading}
            onChange={(values) => {
              setCourseIds(values.map(Number));
              setFolderId(0);
            }}
            options={(courses.data?.items ?? []).map((course) => ({
              label: course.displayName || course.course.name,
              value: String(course.id),
            }))}
            placeholder={
              sessionId ? "Select courses" : "Choose a session first"
            }
            selectedLabel={(count) => `${count} courses selected`}
            value={courseIds.map(String)}
          />
          <CrudSelectField
            description="Choose a folder to expose this exam through the existing Resource Type 3 relationship."
            disabled={!firstCourseId}
            label="Resource folder (optional)"
            loading={folders.isLoading}
            onChange={(value) =>
              setFolderId(value === "none" ? 0 : Number(value))
            }
            options={[
              { label: "Do not create resource card", value: "none" },
              ...(folders.data?.items ?? []).map((folder) => ({
                label: folder.name,
                value: String(folder.id),
              })),
            ]}
            value={folderId ? String(folderId) : "none"}
          />
          <div className={`${styles.rowFields} ${styles.scheduleTimingGrid}`}>
            <CrudDateTimePicker
              label="Available from"
              name="availableFrom"
              onChange={(value) => {
                setAvailableFrom(value);
                if (
                  value &&
                  availableUntil &&
                  availableUntil.getTime() <= value.getTime()
                ) {
                  setAvailableUntil(null);
                }
              }}
              placeholder="Choose start date and time"
              required
              value={availableFrom}
            />
            <CrudDateTimePicker
              label="Available until"
              minDate={availableFrom}
              name="availableUntil"
              onChange={setAvailableUntil}
              placeholder="Choose end date and time"
              required
              value={availableUntil}
            />
            <label>
              Exam time (min)
              <input
                name="duration"
                type="number"
                min="1"
                defaultValue={version?.defaultDurationMinutes ?? 90}
                required
              />
            </label>
            <label>
              Attempt limit
              <input
                name="attemptLimit"
                type="number"
                min="1"
                max="100"
                defaultValue="1"
                required
              />
            </label>
          </div>
          <label>
            Instructions
            <textarea name="instructions" rows={3} />
          </label>
          <button
            className={styles.primaryButton}
            disabled={!version || !courseIds.length}
          >
            <CalendarClock size={16} />
            Schedule exam
          </button>
        </form>
      </section>
      <section className={styles.panel}>
        <div className={styles.panelTitle}>
          <div>
            <h2>Scheduled exams</h2>
            <p>{exams.length} exam instances</p>
          </div>
        </div>
        <div className={styles.examList}>
          {exams.map((exam) => (
            <article key={exam.id}>
              <div>
                <strong>{exam.title}</strong>
                <span>
                  {exam.code} · {exam.templateVersion.examTemplate.name} · v
                  {exam.templateVersion.versionNumber}
                </span>
              </div>
              <Status value={exam.status} />
              <dl>
                <div>
                  <dt>Window</dt>
                  <dd>
                    {new Date(exam.availableFrom).toLocaleString()} –{" "}
                    {new Date(exam.availableUntil).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt>Timing</dt>
                  <dd>
                    {exam.durationMinutes} min · {exam.selectedSlots.length}{" "}
                    slot(s)
                  </dd>
                </div>
                <div>
                  <dt>Attempts</dt>
                  <dd>{exam.attemptLimit}</dd>
                </div>
                <div>
                  <dt>Courses</dt>
                  <dd>
                    {exam.courseAssignments
                      .map((item) => item.sessionCourse.course.name)
                      .join(", ")}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Status({ value }: { value: string }) {
  return (
    <span className={styles.status} data-value={value}>
      {value.replaceAll("_", " ")}
    </span>
  );
}
function Empty({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Layers3;
  title: string;
  text: string;
}) {
  return (
    <div className={styles.empty}>
      <Icon size={34} />
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

export default ExamManagementPage;
