"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
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
  ExamQuestionType,
  ExamSubject,
  ExamTopic,
  ExamTemplate,
  ExamTemplateListItem,
  ExamTemplateVersion,
  ExamNavigationMode,
  SaveExamTemplateStructureRequest,
  ScheduledExam,
  QuestionDifficulty,
} from "@repo/types";
import {
  AlertTriangle,
  BarChart3,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CirclePlus,
  Clock3,
  ClipboardList,
  Eye,
  FileSpreadsheet,
  FileText,
  FileUp,
  GripVertical,
  Layers3,
  Library,
  ListChecks,
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
  CrudSelect,
  CrudSelectField,
} from "../components/crud";
import styles from "./ExamManagementPage.module.css";

export type ExamManagementTab =
  "templates" | "subjects" | "topics" | "questions" | "schedule" | "reports";
type ExamManagementPageProps = {
  activeTab?: ExamManagementTab;
  templateMode?: "builder";
  templateId?: number;
};
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
const difficultyOptions: Array<{
  label: string;
  value: QuestionDifficulty;
}> = [
  { label: "Easy", value: "EASY" },
  { label: "Medium", value: "MEDIUM" },
  { label: "Hard", value: "HARD" },
];
const difficultyLabel = (difficulty: QuestionDifficulty) =>
  difficulty.charAt(0) + difficulty.slice(1).toLowerCase();
type BuilderSection = {
  id?: number;
  sortOrder?: number;
  code?: string;
  name: string;
  durationMinutes: number;
  questionsToAttempt: number;
  instructions: string;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  navigationMode: ExamNavigationMode;
  allowReview: boolean;
  autoSubmitOnTimeout: boolean;
  subjectId: number;
  questions: BuilderQuestion[];
};
type BuilderSlot = {
  id?: number;
  sortOrder?: number;
  code?: string;
  name: string;
  durationMinutes: number;
  description: string;
  instructions: string;
  navigationMode: ExamNavigationMode;
  autoSubmitOnTimeout: boolean;
  sections: BuilderSection[];
};
type BuilderValidationIssue = {
  target: string;
  message: string;
};

const emptySection = (): BuilderSection => ({
  name: "New section",
  durationMinutes: 30,
  questionsToAttempt: 1,
  instructions: "",
  randomizeQuestions: false,
  randomizeOptions: false,
  navigationMode: "FREE",
  allowReview: true,
  autoSubmitOnTimeout: true,
  subjectId: 0,
  questions: [],
});
const emptySlot = (): BuilderSlot => ({
  name: "Slot 1",
  durationMinutes: 30,
  description: "",
  instructions: "",
  navigationMode: "FREE",
  autoSubmitOnTimeout: true,
  sections: [emptySection()],
});

const moveItem = <T,>(items: T[], from: number, to: number) => {
  if (from === to || to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

const messageOf = (error: unknown) => {
  const fallback =
    "We couldn't complete this action. Review the information you entered and try again.";
  const friendly = (value: string) => {
    const message = value.trim();
    return !message ||
      /status code\s*\d+/i.test(message) ||
      /^internal server error$/i.test(message) ||
      /^request failed$/i.test(message)
      ? fallback
      : message;
  };
  if (typeof error === "object" && error && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: { message?: string | string[]; error?: { message?: string } };
        };
      }
    ).response;
    const message = response?.data?.message ?? response?.data?.error?.message;
    if (Array.isArray(message)) return friendly(message.join(" "));
    if (message) return friendly(message);
    return fallback;
  }
  return error instanceof Error ? friendly(error.message) : fallback;
};

const RichContent = ({ value }: { value?: string | null }) => {
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
};

const contentSummary = (value?: string | null) => {
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
};

type QuestionDetailOption = {
  code: string;
  content: string;
  isCorrect: boolean;
};

const QuestionDetails = ({
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
}) => {
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
            <strong>Passage / Directions</strong>
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
};

const ImportQuestionDetails = ({ row }: { row: ExamImportRow }) => {
  return (
    <QuestionDetails
      acceptedAnswers={row.acceptedAnswersJson}
      caseSensitive={row.caseSensitive}
      comprehensionCode={row.comprehensionCode}
      comprehensionContent={row.comprehensionText}
      correctAnswer={row.correctAnswer}
      explanation={row.explanation}
      id={`import-question-detail-${row.id}`}
      numericTolerance={row.numericTolerance}
      options={row.optionsJson}
      placement={[
        { label: "Slot", value: row.slotCode },
        { label: "Section", value: row.sectionCode },
        { label: "Subject", value: row.subjectCode },
        { label: "Topic", value: row.topic?.name ?? row.topicCode },
        { label: "Difficulty", value: difficultyLabel(row.difficulty) },
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
};

export const ExamManagementPage = ({
  activeTab = "templates",
  templateMode,
  templateId,
}: ExamManagementPageProps) => {
  const currentUser = useCurrentUser();
  const queryClient = useQueryClient();
  const tab = activeTab;
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
  const topics = useQuery({
    queryKey: ["exam-topics", organizationId],
    queryFn: () =>
      examsApi.topics.list({ organizationId, includeInactive: true }),
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
        queryKey: ["exam-topics", organizationId],
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
  const organizationSelectId = `exam-${tab}-organization`;
  const organizationSelector = !currentUser?.organizationId ? (
    <div className={styles.embeddedOrganizationField}>
      <label
        className={styles.organizationLabel}
        htmlFor={organizationSelectId}
      >
        Organization
      </label>
      <CrudSelect
        ariaLabel="Organization"
        id={organizationSelectId}
        loading={organizations.isLoading}
        onChange={(value) => {
          setNotice(null);
          setSelectedOrganizationId(Number(value) || undefined);
        }}
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
  ) : null;

  if (tab === "subjects") {
    return (
      <main className={`${styles.page} ${styles.subjectManagementPage}`}>
        {notice ? (
          <div
            className={
              notice.kind === "success" ? styles.success : styles.error
            }
          >
            {notice.text}
          </div>
        ) : null}
        <SubjectsPanel
          key={organizationId ?? "no-organization"}
          organizationId={organizationId}
          organizationSelector={organizationSelector}
          questions={questions.data ?? []}
          subjects={subjects.data ?? []}
          report={report}
        />
      </main>
    );
  }

  if (tab === "questions") {
    return (
      <main className={`${styles.page} ${styles.questionBankPage}`}>
        {notice ? (
          <div
            className={
              notice.kind === "success" ? styles.success : styles.error
            }
          >
            {notice.text}
          </div>
        ) : null}
        <QuestionsPanel
          key={organizationId ?? "no-organization"}
          organizationId={organizationId}
          organizationSelector={organizationSelector}
          subjects={subjects.data ?? []}
          topics={topics.data ?? []}
          questions={questions.data ?? []}
          questionTypes={questionTypes.data ?? []}
          report={report}
        />
      </main>
    );
  }

  if (tab === "topics") {
    return (
      <main className={styles.page}>
        {notice ? (
          <div
            className={
              notice.kind === "success" ? styles.success : styles.error
            }
          >
            {notice.text}
          </div>
        ) : null}
        <TopicsPanel
          key={organizationId ?? "no-organization"}
          organizationId={organizationId}
          organizationSelector={organizationSelector}
          subjects={subjects.data ?? []}
          topics={topics.data ?? []}
          report={report}
        />
      </main>
    );
  }

  if (tab === "schedule") {
    return (
      <main className={`${styles.page} ${styles.scheduleExamsPage}`}>
        {notice ? (
          <div
            className={
              notice.kind === "success" ? styles.success : styles.error
            }
          >
            {notice.text}
          </div>
        ) : null}
        <SchedulePanel
          key={organizationId ?? "no-organization"}
          organizationId={organizationId}
          organizationSelector={organizationSelector}
          templates={templates.data ?? []}
          exams={scheduled.data ?? []}
          report={report}
        />
      </main>
    );
  }

  if (tab === "reports") {
    return (
      <main className={styles.page}>
        <ReportsPanel
          exams={scheduled.data ?? []}
          organizationSelector={organizationSelector}
        />
      </main>
    );
  }

  return (
    <main className={styles.page}>
      {templateMode !== "builder" ? (
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Assessment workspace</p>
            <h1>Exam Templates</h1>
            <p>
              Create the reusable blueprint first, then configure timing,
              sections, question mapping, and publish a locked version.
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
      ) : null}
      {notice ? (
        <div
          className={notice.kind === "success" ? styles.success : styles.error}
        >
          {notice.text}
        </div>
      ) : null}
      {tab === "templates" ? (
        <TemplatesPanel
          key={organizationId ?? "no-organization"}
          organizationId={organizationId}
          organizationSelector={organizationSelector}
          initialTemplateId={templateId}
          templates={templates.data ?? []}
          subjects={subjects.data ?? []}
          clearNotice={() => setNotice(null)}
          report={report}
        />
      ) : null}
    </main>
  );
};

const TemplatesPanel = ({
  organizationId,
  organizationSelector,
  initialTemplateId,
  templates,
  subjects,
  clearNotice,
  report,
}: {
  organizationId?: number;
  organizationSelector?: ReactNode;
  initialTemplateId?: number;
  templates: ExamTemplateListItem[];
  subjects: ExamSubject[];
  clearNotice: () => void;
  report: Report;
}) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ExamTemplate | null>(
    null,
  );
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(
    null,
  );
  const [slots, setSlots] = useState<BuilderSlot[]>([emptySlot()]);
  const [versionInstructions, setVersionInstructions] = useState("");
  const [defaultDurationMinutes, setDefaultDurationMinutes] = useState(90);
  const [defaultAttemptLimit, setDefaultAttemptLimit] = useState(1);
  const [enforceSlotTimers, setEnforceSlotTimers] = useState(false);
  const [enforceSectionTimers, setEnforceSectionTimers] = useState(false);
  const [validationIssues, setValidationIssues] = useState<
    BuilderValidationIssue[]
  >([]);
  const [validationAction, setValidationAction] = useState<
    "save" | "publish" | null
  >(null);
  const [wizardOverride, setWizardOverride] = useState<number | null>(null);
  const [showVersionOptions, setShowVersionOptions] = useState(false);
  const [draggedSlotIndex, setDraggedSlotIndex] = useState<number | null>(null);
  const [draggedSection, setDraggedSection] = useState<{
    slotIndex: number;
    sectionIndex: number;
  } | null>(null);
  const selectedListItem = templates.find((item) => item.id === selectedId);
  const selected = selectedTemplate ?? selectedListItem ?? null;
  const hasDraft =
    selectedTemplate?.versions.some((item) => item.status === "DRAFT") ?? false;
  const selectedVersion = selectedTemplate?.versions.find(
    (item) => item.id === selectedVersionId,
  );
  const isSelectedDraft = selectedVersion?.status === "DRAFT";
  const effectiveOrganizationId =
    organizationId ?? selectedTemplate?.organizationId;
  const builderSubjects = useQuery({
    queryKey: ["exam-subjects", effectiveOrganizationId],
    queryFn: () => examsApi.subjects.list(effectiveOrganizationId),
    enabled: Boolean(effectiveOrganizationId),
  });
  const availableSubjects = builderSubjects.data ?? subjects;

  const showVersion = (version: ExamTemplateVersion) => {
    setValidationIssues([]);
    setValidationAction(null);
    setSelectedVersionId(version.id);
    setVersionInstructions(version.instructions ?? "");
    setDefaultDurationMinutes(version.defaultDurationMinutes ?? 90);
    setDefaultAttemptLimit(version.defaultAttemptLimit ?? 1);
    setEnforceSlotTimers(version.enforceSlotTimers);
    setEnforceSectionTimers(version.enforceSectionTimers);
    const versionSlots = version.slots ?? [];
    setSlots(
      versionSlots.length
        ? versionSlots.map((slot) => ({
            id: slot.id,
            sortOrder: slot.sortOrder,
            code: slot.code,
            name: slot.name,
            durationMinutes: slot.durationMinutes,
            description: slot.description ?? "",
            instructions: slot.instructions ?? "",
            navigationMode: slot.navigationMode,
            autoSubmitOnTimeout: slot.autoSubmitOnTimeout,
            sections: slot.sections.map((section) => ({
              id: section.id,
              sortOrder: section.sortOrder,
              code: section.code,
              name: section.name,
              durationMinutes: section.durationMinutes,
              questionsToAttempt:
                section.questionsToAttempt ??
                section.subjects.reduce(
                  (total, subject) => total + subject.questions.length,
                  0,
                ),
              instructions: section.instructions ?? "",
              randomizeQuestions: section.randomizeQuestions,
              randomizeOptions: section.randomizeOptions,
              navigationMode: section.navigationMode,
              allowReview: section.allowReview,
              autoSubmitOnTimeout: section.autoSubmitOnTimeout,
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
    template: Pick<ExamTemplateListItem, "id">,
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
      setWizardOverride(2);
    } catch (error) {
      setSelectedId(null);
      setSelectedTemplate(null);
      setSelectedVersionId(null);
      report(Promise.reject(error), "");
    }
  };

  const create = (formData: FormData) => {
    if (!organizationId) return;
    report(
      examsApi.templates
        .create({
          organizationId,
          name: String(formData.get("name")),
          description: String(formData.get("description") || ""),
          defaultDurationMinutes: Number(formData.get("duration")) || undefined,
          defaultAttemptLimit: Number(formData.get("attemptLimit")) || 1,
        })
        .then(async (template) => {
          setSelectedId(template.id);
          const detailedTemplate = await examsApi.templates.get(template.id);
          setSelectedTemplate(detailedTemplate);
          const version =
            detailedTemplate.versions.find((item) => item.status === "DRAFT") ??
            detailedTemplate.versions[0];
          if (version) showVersion(version);
          setWizardOverride(2);
        }),
      "Draft template created",
    );
  };

  const updateSlot = (slotIndex: number, patch: Partial<BuilderSlot>) => {
    setValidationIssues([]);
    setSlots((current) =>
      current.map((slot, index) =>
        index === slotIndex ? { ...slot, ...patch } : slot,
      ),
    );
  };
  const updateSection = (
    slotIndex: number,
    sectionIndex: number,
    patch: Partial<BuilderSection>,
  ) => {
    setValidationIssues([]);
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
  };
  const arrangeSlots = (from: number, to: number) => {
    if (!isSelectedDraft) return;
    setValidationIssues([]);
    setSlots((current) => moveItem(current, from, to));
  };
  const arrangeSections = (slotIndex: number, from: number, to: number) => {
    if (!isSelectedDraft) return;
    setValidationIssues([]);
    setSlots((current) =>
      current.map((slot, index) =>
        index === slotIndex
          ? { ...slot, sections: moveItem(slot.sections, from, to) }
          : slot,
      ),
    );
  };

  const buildPayload = (): SaveExamTemplateStructureRequest => ({
    instructions: versionInstructions || undefined,
    defaultDurationMinutes,
    defaultAttemptLimit,
    enforceSlotTimers,
    enforceSectionTimers,
    slots: slots.map((slot) => ({
      name: slot.name,
      description: slot.description || undefined,
      instructions: slot.instructions || undefined,
      durationMinutes: slot.durationMinutes,
      navigationMode: slot.navigationMode,
      autoSubmitOnTimeout: slot.autoSubmitOnTimeout,
      sections: slot.sections.map((section) => ({
        name: section.name,
        durationMinutes: section.durationMinutes,
        questionsToAttempt: section.questionsToAttempt,
        instructions: section.instructions || undefined,
        randomizeQuestions: section.randomizeQuestions,
        randomizeOptions: section.randomizeOptions,
        navigationMode: section.navigationMode,
        allowReview: section.allowReview,
        autoSubmitOnTimeout: section.autoSubmitOnTimeout,
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
  });

  const validateBuilder = ({
    requireQuestions = true,
  }: {
    requireQuestions?: boolean;
  } = {}): BuilderValidationIssue[] => {
    const issues: BuilderValidationIssue[] = [];
    if (
      !Number.isInteger(defaultDurationMinutes) ||
      defaultDurationMinutes < 1
    ) {
      issues.push({
        target: "timing-configuration",
        message: "Default exam time must be at least 1 minute.",
      });
    }
    if (!Number.isInteger(defaultAttemptLimit) || defaultAttemptLimit < 1) {
      issues.push({
        target: "timing-configuration",
        message: "Attempt limit must be at least 1.",
      });
    }
    if (!slots.length) {
      issues.push({
        target: "template-editor-actions",
        message: "Add at least one slot.",
      });
      return issues;
    }

    slots.forEach((slot, slotIndex) => {
      const slotTarget = `exam-slot-${slotIndex + 1}`;
      if (!slot.name.trim()) {
        issues.push({
          target: slotTarget,
          message: `Slot ${slotIndex + 1} requires a name.`,
        });
      }
      if (!Number.isInteger(slot.durationMinutes) || slot.durationMinutes < 1) {
        issues.push({
          target: slotTarget,
          message: `${slot.name || `Slot ${slotIndex + 1}`} must have a duration of at least 1 minute.`,
        });
      }
      if (!slot.sections.length) {
        issues.push({
          target: slotTarget,
          message: `${slot.name || `Slot ${slotIndex + 1}`} needs at least one section.`,
        });
      }

      const totalSectionTime = slot.sections.reduce(
        (total, section) => total + section.durationMinutes,
        0,
      );
      if (totalSectionTime > slot.durationMinutes) {
        issues.push({
          target: slotTarget,
          message: `${slot.name || `Slot ${slotIndex + 1}`} has ${totalSectionTime} section minutes but only ${slot.durationMinutes} slot minutes.`,
        });
      }

      slot.sections.forEach((section, sectionIndex) => {
        const sectionTarget = `${slotTarget}-section-${sectionIndex + 1}`;
        if (!section.name.trim()) {
          issues.push({
            target: sectionTarget,
            message: `${slot.name || `Slot ${slotIndex + 1}`}, section ${sectionIndex + 1} requires a name.`,
          });
        }
        if (
          !Number.isInteger(section.durationMinutes) ||
          section.durationMinutes < 1
        ) {
          issues.push({
            target: sectionTarget,
            message: `${section.name || `Section ${sectionIndex + 1}`} must have a duration of at least 1 minute.`,
          });
        }
        if (!section.subjectId) {
          issues.push({
            target: sectionTarget,
            message: `${section.name || `Section ${sectionIndex + 1}`} needs a subject.`,
          });
        }
        if (requireQuestions && !section.questions.length) {
          issues.push({
            target: sectionTarget,
            message: `${section.name || `Section ${sectionIndex + 1}`} has no assigned questions.`,
          });
        }
        if (
          !Number.isInteger(section.questionsToAttempt) ||
          section.questionsToAttempt < 1
        ) {
          issues.push({
            target: sectionTarget,
            message: `${section.name || `Section ${sectionIndex + 1}`} must allow at least 1 question to be attempted.`,
          });
        } else if (
          requireQuestions &&
          section.questionsToAttempt > section.questions.length
        ) {
          issues.push({
            target: sectionTarget,
            message: `${section.name || `Section ${sectionIndex + 1}`} requires ${section.questionsToAttempt} attempted questions but only ${section.questions.length} are assigned.`,
          });
        }
        if (
          section.questions.some(
            (question) =>
              !Number.isFinite(question.marks) ||
              question.marks < 0 ||
              !Number.isFinite(question.negativeMarks) ||
              question.negativeMarks < 0,
          )
        ) {
          issues.push({
            target: sectionTarget,
            message: `${section.name || `Section ${sectionIndex + 1}`} contains invalid marks or negative marks.`,
          });
        }
      });
    });
    return issues;
  };

  const save = () => {
    if (!selected) return;
    const issues = validateBuilder({ requireQuestions: false });
    setValidationAction("save");
    setValidationIssues(issues);
    if (issues.length) return;
    report(
      examsApi.templates.saveStructure(selected.id, buildPayload()),
      "Template structure saved",
      async () => {
        setValidationAction(null);
        await loadBuilder(selected, selectedVersionId ?? "draft");
      },
    );
  };

  const publish = () => {
    if (!selected) return;
    const issues = validateBuilder();
    setValidationAction("publish");
    setValidationIssues(issues);
    if (issues.length) return;
    report(
      examsApi.templates
        .saveStructure(selected.id, buildPayload())
        .then(() => examsApi.templates.publish(selected.id)),
      `Version ${selectedVersion?.versionNumber} published and locked`,
      async () => {
        setValidationAction(null);
        await loadBuilder(selected, selectedVersionId ?? "draft");
      },
    );
  };

  const sectionCount = slots.reduce(
    (total, slot) => total + slot.sections.length,
    0,
  );
  const selectedQuestionCount = slots.reduce(
    (slotTotal, slot) =>
      slotTotal +
      slot.sections.reduce(
        (sectionTotal, section) => sectionTotal + section.questions.length,
        0,
      ),
    0,
  );
  const hasQuestionAssignmentIssues = validationIssues.some(
    (issue) =>
      issue.message.includes("no assigned questions") ||
      issue.message.includes("are assigned"),
  );
  const totalQuestionsToAttempt = slots.reduce(
    (slotTotal, slot) =>
      slotTotal +
      slot.sections.reduce(
        (sectionTotal, section) =>
          sectionTotal + Math.max(0, section.questionsToAttempt),
        0,
      ),
    0,
  );
  const totalSlotMinutes = slots.reduce(
    (total, slot) => total + Math.max(0, slot.durationMinutes),
    0,
  );
  const slotTimingStats = slots.map((slot) => {
    const sectionMinutes = slot.sections.reduce(
      (total, section) => total + Math.max(0, section.durationMinutes),
      0,
    );
    const remainingMinutes = slot.durationMinutes - sectionMinutes;

    return {
      sectionMinutes,
      remainingMinutes,
      utilization:
        slot.durationMinutes > 0
          ? Math.min(
              100,
              Math.round((sectionMinutes / slot.durationMinutes) * 100),
            )
          : 100,
    };
  });
  const timingMode = enforceSlotTimers
    ? enforceSectionTimers
      ? "Overall + slot + section timers"
      : "Overall + slot timers"
    : enforceSectionTimers
      ? "Overall + section timers"
      : "Overall exam timer";
  const liveValidationIssues = selected ? validateBuilder() : [];
  const hasAnySubject = slots.some((slot) =>
    slot.sections.some((section) => section.subjectId),
  );
  const isPublishReady =
    selectedQuestionCount > 0 && liveValidationIssues.length === 0;
  const canArrangeNewVersion = Boolean(isSelectedDraft);
  const publishedTemplateCount = templates.filter(
    (template) => template.status === "PUBLISHED",
  ).length;
  const inferredWizardStep = !selected
    ? 1
    : selectedQuestionCount > 0
      ? 4
      : hasAnySubject
        ? 3
        : defaultDurationMinutes > 0
          ? 2
          : 1;
  const wizardStep = wizardOverride ?? inferredWizardStep;

  const preview = () => {
    setWizardOverride(4);
    window.setTimeout(() => {
      document
        .getElementById("template-review-publish")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };
  const createNextVersion = (copyQuestions: boolean) => {
    if (!selected || hasDraft) return;
    setShowVersionOptions(false);
    report(
      examsApi.templates.createVersion(selected.id, { copyQuestions }),
      copyQuestions
        ? "New version created with its existing questions"
        : "New structure-only version created",
      async () => {
        await loadBuilder(selected, "draft");
        setWizardOverride(3);
        window.setTimeout(() => {
          document.getElementById("template-structure-order")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 0);
      },
    );
  };

  useEffect(() => {
    if (!initialTemplateId || selectedId === initialTemplateId) return;
    const template = templates.find((item) => item.id === initialTemplateId);
    const timeoutId = window.setTimeout(() => {
      void loadBuilder(template ?? { id: initialTemplateId });
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // loadBuilder intentionally remains event-like here; adding it would reload
    // the selected template whenever this component re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTemplateId, selectedId, templates]);

  return (
    <div className={styles.templateBuilderShell}>
      <div
        className={styles.templateWizardStepper}
        aria-label="Template builder steps"
      >
        {[
          { label: "Template details", target: "template-editor-actions" },
          { label: "Timing & slots", target: "timing-configuration" },
          { label: "Build sections", target: "build-sections" },
          {
            label: "Review & publish",
            target: "template-review-publish",
          },
        ].map(({ label, target }, index) => {
          const step = index + 1;
          return (
            <button
              data-active={wizardStep === step}
              data-complete={wizardStep > step}
              disabled={!selected && step > 1}
              key={label}
              onClick={() => {
                setWizardOverride(step);
                document.getElementById(target)?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              type="button"
            >
              <b>{step}</b>
              {label}
            </button>
          );
        })}
      </div>
      <div className={styles.builderActionBar}>
        <div>
          <button
            className={styles.primaryButton}
            disabled={!selected || !isSelectedDraft}
            onClick={save}
            type="button"
          >
            <Save size={16} />
            Save draft
          </button>
          <button
            className={styles.secondaryButton}
            disabled={!selected}
            onClick={preview}
            type="button"
          >
            <Eye size={16} />
            Preview
          </button>
        </div>
      </div>
      <div className={styles.twoColumn}>
        <section className={`${styles.panel} ${styles.templateListPanel}`}>
          <div className={styles.panelTitle}>
            <div>
              <span className={styles.stepLabel}>Step 1</span>
              <h2>Organization & template</h2>
              <p>
                Choose the organization, open an existing template, or create a
                new reusable exam blueprint.
              </p>
            </div>
            <div className={styles.templateCounts} aria-label="Template counts">
              <span>
                <strong>{templates.length}</strong>
                Total
              </span>
              <span>
                <strong>{publishedTemplateCount}</strong>
                Published
              </span>
            </div>
          </div>
          <div className={styles.templateInstructionCard}>
            <strong>How this page works</strong>
            <span>
              A template is the reusable exam pattern. A draft version can be
              edited. A published version is locked and can be scheduled safely.
            </span>
          </div>
          <div className={styles.templateChooser}>
            <CrudSelect
              ariaLabel="Open exam template"
              disabled={!organizationId || !templates.length}
              label="Open template"
              onChange={(value) => {
                const template = templates.find(
                  (item) => item.id === Number(value),
                );
                if (template) void loadBuilder(template);
              }}
              options={templates.map((template) => ({
                label: template.name,
                value: String(template.id),
              }))}
              placeholder={
                organizationId
                  ? "Choose template to edit"
                  : "Choose organization first"
              }
              value={selectedId ? String(selectedId) : ""}
              variant="form"
              width="100%"
            />
          </div>
          <form action={create} className={styles.compactForm}>
            <div className={styles.formSectionIntro}>
              <span className={styles.stepLabel}>Create new</span>
              <strong>Template details</strong>
              <p>
                Enter a clear template name. The first draft version and
                internal code are created automatically.
              </p>
            </div>
            <label>
              Template name
              <input
                name="name"
                placeholder="e.g., CUET General Test"
                required
              />
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
            <label>
              Attempt limit
              <input
                name="attemptLimit"
                type="number"
                min="1"
                max="100"
                placeholder="e.g., 1"
                defaultValue="1"
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
            <button className={styles.primaryButton} disabled={!organizationId}>
              <Plus size={16} />
              Create template
            </button>
          </form>
          <div className={styles.listHeader}>
            <strong>Existing templates</strong>
            <span>{templates.length} available</span>
          </div>
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
                    Latest v{template.versions[0]?.versionNumber ?? 1} ·{" "}
                    {template._count?.versions ?? template.versions.length}{" "}
                    {(template._count?.versions ?? template.versions.length) ===
                    1
                      ? "version"
                      : "versions"}
                  </span>
                </div>
                <Status
                  value={template.versions[0]?.status ?? template.status}
                />
              </button>
            ))}
          </div>
          {selected ? (
            <aside
              className={styles.templateSidebarSummary}
              id="template-publish-readiness"
            >
              <div className={styles.builderSidebarCard}>
                <div>
                  <span className={styles.stepLabel}>Live summary</span>
                  <h2>Publish readiness</h2>
                  <p>
                    {isPublishReady
                      ? "This draft has the required timing, sections, subjects, and questions."
                      : "Complete the required setup before publishing this template."}
                  </p>
                </div>

                <div
                  className={styles.sidebarStatusBanner}
                  data-ready={isPublishReady}
                >
                  <CheckCircle2 size={18} />
                  <strong>
                    {isPublishReady
                      ? "Ready to publish"
                      : `${liveValidationIssues.length} item${liveValidationIssues.length === 1 ? "" : "s"} pending`}
                  </strong>
                </div>

                <div className={styles.sidebarStatGrid}>
                  <span>
                    <b>{slots.length}</b>
                    Slots
                  </span>
                  <span>
                    <b>{sectionCount}</b>
                    Sections
                  </span>
                  <span>
                    <b>{selectedQuestionCount}</b>
                    Imported
                  </span>
                  <span>
                    <b>{totalQuestionsToAttempt}</b>
                    Attempted
                  </span>
                </div>

                <div className={styles.readinessChecklist}>
                  <span data-complete={Boolean(selected.name)}>
                    <CheckCircle2 size={15} />
                    Template named
                  </span>
                  <span data-complete={defaultDurationMinutes > 0}>
                    <CheckCircle2 size={15} />
                    Timing configured
                  </span>
                  <span data-complete={slots.length > 0 && sectionCount > 0}>
                    <CheckCircle2 size={15} />
                    Slots and sections added
                  </span>
                  <span data-complete={hasAnySubject}>
                    <CheckCircle2 size={15} />
                    Section subject selected
                  </span>
                  <span data-complete={selectedQuestionCount > 0}>
                    <CheckCircle2 size={15} />
                    Questions imported
                  </span>
                </div>

                <dl className={styles.sidebarMetaList}>
                  <div>
                    <dt>Version</dt>
                    <dd>
                      v{selectedVersion?.versionNumber ?? "-"}{" "}
                      {selectedVersion ? (
                        <Status value={selectedVersion.status} />
                      ) : null}
                    </dd>
                  </div>
                  <div>
                    <dt>Attempt rule</dt>
                    <dd>
                      {defaultAttemptLimit}{" "}
                      {defaultAttemptLimit === 1 ? "attempt" : "attempts"}
                    </dd>
                  </div>
                  <div>
                    <dt>Timing mode</dt>
                    <dd>{timingMode}</dd>
                  </div>
                </dl>
              </div>
            </aside>
          ) : null}
          {!selected ? (
            <aside className={styles.templateSidebarSummary}>
              <div className={styles.panelTitle}>
                <div>
                  <h2>Template summary</h2>
                  <p>Complete Step 1 to start configuring this template.</p>
                </div>
              </div>
              <dl>
                <div>
                  <dt>Template name</dt>
                  <dd>Not set yet</dd>
                </div>
                <div>
                  <dt>Subject</dt>
                  <dd>Assigned in sections</dd>
                </div>
                <div>
                  <dt>Duration</dt>
                  <dd>Not set yet</dd>
                </div>
                <div>
                  <dt>Slots</dt>
                  <dd>Not configured</dd>
                </div>
                <div>
                  <dt>Sections</dt>
                  <dd>Not configured</dd>
                </div>
                <div>
                  <dt>Questions</dt>
                  <dd>Not added</dd>
                </div>
              </dl>
            </aside>
          ) : null}
        </section>
        <section className={`${styles.panel} ${styles.editorPanel}`}>
          {!selected ? (
            <form action={create} className={styles.builderStepForm}>
              <div className={styles.builderStepTitle}>
                <h2>Step 1 - Name your exam template</h2>
                <p>
                  Give your template a clear identity and define the basics.
                </p>
              </div>
              {organizationSelector}
              <div className={styles.builderFormGrid}>
                <label>
                  <span className={styles.builderFieldLabel}>
                    Template name <em>*</em>
                  </span>
                  <input
                    name="name"
                    placeholder="CUET General Test 2026"
                    required
                  />
                </label>
                <label className={styles.fullWidthField}>
                  Description
                  <textarea
                    maxLength={500}
                    name="description"
                    placeholder="General aptitude and domain knowledge test for CUET applicants."
                    rows={4}
                  />
                </label>
              </div>
              <button
                className={styles.summaryContinueButton}
                disabled={!organizationId}
                type="submit"
              >
                Continue: Timing & slots
                <ChevronDown size={18} />
              </button>
            </form>
          ) : (
            <>
              <div
                className={`${styles.panelTitle} ${styles.editorHeader}`}
                id="template-editor-actions"
              >
                <div>
                  <span className={styles.stepLabel}>Template workspace</span>
                  <h2>{selected.name}</h2>
                  <p>
                    {isSelectedDraft
                      ? `Version ${selectedVersion?.versionNumber} is a draft. Save the structure before uploading questions or publishing.`
                      : `Version ${selectedVersion?.versionNumber} is published and read-only.`}
                  </p>
                </div>
                <div className={styles.versionActions}>
                  <div className={styles.versionPickerRow}>
                    <div className={styles.versionSelect}>
                      <CrudSelect
                        ariaLabel="Choose template version"
                        label="Version"
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
                        value={
                          selectedVersionId ? String(selectedVersionId) : ""
                        }
                        variant="form"
                        width="100%"
                      />
                    </div>
                    {selectedVersion ? (
                      <Status value={selectedVersion.status} />
                    ) : null}
                  </div>
                  <div className={styles.versionActionStack}>
                    <div className={styles.inlineActions}>
                      <button
                        className={styles.primaryButton}
                        disabled={!isSelectedDraft}
                        onClick={save}
                      >
                        <Save size={15} />
                        Save draft structure
                      </button>
                      <button
                        className={styles.publishButton}
                        disabled={!isSelectedDraft}
                        onClick={publish}
                      >
                        <Send size={15} />
                        Publish version
                      </button>
                      <button
                        className={styles.secondaryButton}
                        disabled={hasDraft}
                        onClick={() => setShowVersionOptions(true)}
                        title={
                          hasDraft
                            ? "Publish the current draft before creating another version"
                            : "Create the next editable version"
                        }
                      >
                        <Plus size={15} />
                        New version
                      </button>
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
                    <span
                      className={styles.versionCreationHint}
                      data-blocked={hasDraft}
                    >
                      {hasDraft
                        ? `Publish v${selectedTemplate?.versions.find((version) => version.status === "DRAFT")?.versionNumber ?? ""} before creating another version. Only one draft can exist at a time.`
                        : "New version creates the next editable draft from this template."}
                    </span>
                  </div>
                </div>
              </div>
              <section className={styles.builderOverviewCard}>
                <div className={styles.builderOverviewTitle}>
                  <span className={styles.stepLabel}>Blueprint overview</span>
                  <h3>{selected.name}</h3>
                  <p>{selected.description || "No description added"}</p>
                </div>
                <div className={styles.builderOverviewMetrics}>
                  <span>
                    <Clock3 size={15} />
                    <b>{defaultDurationMinutes}</b>
                    min
                  </span>
                  <span>
                    <Layers3 size={15} />
                    <b>{slots.length}</b>
                    {slots.length === 1 ? "slot" : "slots"}
                  </span>
                  <span>
                    <ListChecks size={15} />
                    <b>{sectionCount}</b>
                    {sectionCount === 1 ? "section" : "sections"}
                  </span>
                  <span>
                    <ClipboardList size={15} />
                    <b>{selectedQuestionCount}</b>
                    questions
                  </span>
                </div>
              </section>
              {validationIssues.length ? (
                <section className={styles.validationSummary} role="alert">
                  <div>
                    <AlertTriangle size={18} aria-hidden="true" />
                    <div>
                      <strong>
                        {validationAction === "publish"
                          ? "Cannot publish this version yet"
                          : "Cannot save this draft yet"}
                      </strong>
                      <span>
                        {validationAction === "publish" &&
                        hasQuestionAssignmentIssues
                          ? "Assign questions in Step 3 or import them from Schedule Exams, then publish."
                          : validationAction === "publish"
                            ? "Resolve these configuration issues before publishing."
                            : "Resolve these structure issues before saving."}
                      </span>
                    </div>
                  </div>
                  <ul>
                    {validationIssues.map((issue, index) => (
                      <li key={`${issue.target}-${index}`}>
                        <a href={`#${issue.target}`}>{issue.message}</a>
                      </li>
                    ))}
                  </ul>
                  {validationAction === "publish" &&
                  hasQuestionAssignmentIssues &&
                  selected ? (
                    <Link
                      className={styles.validationActionLink}
                      href="#import-questions"
                    >
                      Open the Import Question Center below
                    </Link>
                  ) : null}
                </section>
              ) : null}
              <div className={styles.builder}>
                <section
                  className={styles.timingPanel}
                  id="timing-configuration"
                >
                  <div className={styles.timingPanelHeader}>
                    <div className={styles.timingTitleGroup}>
                      <span className={styles.timingIcon}>
                        <Clock3 size={22} aria-hidden="true" />
                      </span>
                      <div>
                        <span className={styles.stepLabel}>
                          Step 2 · Timing
                        </span>
                        <h3>Choose how exam time is controlled</h3>
                        <p>
                          The overall timer always runs. Add slot or section
                          timers only when each part needs its own deadline.
                        </p>
                      </div>
                    </div>
                    <span className={styles.timingModeBadge}>{timingMode}</span>
                  </div>

                  <div
                    className={styles.timerHierarchy}
                    aria-label="Timer hierarchy"
                  >
                    <div
                      className={styles.timerHierarchyItem}
                      data-level="exam"
                    >
                      <span className={styles.timerHierarchyIcon}>
                        <Clock3 size={18} aria-hidden="true" />
                      </span>
                      <div>
                        <small>Level 1 · Always active</small>
                        <strong>Overall exam</strong>
                        <span>{defaultDurationMinutes || 0} min maximum</span>
                      </div>
                    </div>
                    <span
                      className={styles.timerHierarchyArrow}
                      aria-hidden="true"
                    >
                      →
                    </span>
                    <div
                      className={styles.timerHierarchyItem}
                      data-active={enforceSlotTimers}
                      data-over={
                        enforceSlotTimers &&
                        totalSlotMinutes > defaultDurationMinutes
                      }
                      data-level="slot"
                    >
                      <span className={styles.timerHierarchyIcon}>
                        <Layers3 size={18} aria-hidden="true" />
                      </span>
                      <div>
                        <small>
                          Level 2 · {enforceSlotTimers ? "Active" : "Optional"}
                        </small>
                        <strong>Slots</strong>
                        <span>
                          {slots.length} configured · {totalSlotMinutes} min
                          {enforceSlotTimers &&
                          totalSlotMinutes > defaultDurationMinutes
                            ? ` · ${totalSlotMinutes - defaultDurationMinutes} min beyond overall limit`
                            : ""}
                        </span>
                      </div>
                    </div>
                    <span
                      className={styles.timerHierarchyArrow}
                      aria-hidden="true"
                    >
                      →
                    </span>
                    <div
                      className={styles.timerHierarchyItem}
                      data-active={enforceSectionTimers}
                      data-level="section"
                    >
                      <span className={styles.timerHierarchyIcon}>
                        <ListChecks size={18} aria-hidden="true" />
                      </span>
                      <div>
                        <small>
                          Level 3 ·{" "}
                          {enforceSectionTimers ? "Active" : "Optional"}
                        </small>
                        <strong>Sections</strong>
                        <span>{sectionCount} configured</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.timingSettingsGrid}>
                    <div className={styles.timingBasicsCard}>
                      <div className={styles.timingSubheading}>
                        <span>1</span>
                        <div>
                          <strong>Set the exam limits</strong>
                          <small>
                            These rules apply to every student attempt.
                          </small>
                        </div>
                      </div>
                      <div className={styles.timingRuleGrid}>
                        <label className={styles.settingTile}>
                          <span>Overall duration</span>
                          <div className={styles.minuteInput}>
                            <input
                              aria-label="Overall exam duration in minutes"
                              disabled={!isSelectedDraft}
                              min="1"
                              onChange={(event) => {
                                setValidationIssues([]);
                                setDefaultDurationMinutes(
                                  Number(event.target.value),
                                );
                              }}
                              type="number"
                              value={defaultDurationMinutes}
                            />
                            <span>minutes</span>
                          </div>
                          <small>The hard limit for the complete exam</small>
                        </label>
                        <label className={styles.settingTile}>
                          <span>Attempts allowed</span>
                          <div className={styles.minuteInput}>
                            <input
                              aria-label="Attempts allowed per student"
                              disabled={!isSelectedDraft}
                              min="1"
                              max="100"
                              onChange={(event) => {
                                setValidationIssues([]);
                                setDefaultAttemptLimit(
                                  Number(event.target.value),
                                );
                              }}
                              type="number"
                              value={defaultAttemptLimit}
                            />
                            <span>
                              {defaultAttemptLimit === 1
                                ? "attempt"
                                : "attempts"}
                            </span>
                          </div>
                          <small>Maximum attempts for each student</small>
                        </label>
                        <label
                          className={`${styles.settingTile} ${styles.instructionTile}`}
                        >
                          <span>Instructions before starting</span>
                          <input
                            disabled={!isSelectedDraft}
                            onChange={(event) =>
                              setVersionInstructions(event.target.value)
                            }
                            placeholder="e.g., Complete every section before submitting"
                            value={versionInstructions}
                          />
                          <small>
                            Students see this before the first timer begins
                          </small>
                        </label>
                      </div>
                    </div>

                    <div className={styles.timerPoliciesCard}>
                      <div className={styles.timingSubheading}>
                        <span>2</span>
                        <div>
                          <strong>Add optional timer layers</strong>
                          <small>
                            Turn on only the control your exam pattern needs.
                          </small>
                        </div>
                      </div>
                      <div className={styles.timerPolicyList}>
                        <label
                          className={styles.timerPolicyCard}
                          data-active={enforceSlotTimers}
                          data-level="slot"
                        >
                          <input
                            checked={enforceSlotTimers}
                            disabled={!isSelectedDraft}
                            onChange={(event) => {
                              setValidationIssues([]);
                              setEnforceSlotTimers(event.target.checked);
                            }}
                            type="checkbox"
                          />
                          <span
                            className={styles.toggleTrack}
                            aria-hidden="true"
                          >
                            <span />
                          </span>
                          <span className={styles.timerPolicyIcon}>
                            <Layers3 size={18} aria-hidden="true" />
                          </span>
                          <span className={styles.timerPolicyCopy}>
                            <strong>Slot timers</strong>
                            <small>
                              Each major exam part gets its own countdown.
                            </small>
                          </span>
                          <b>{enforceSlotTimers ? "On" : "Off"}</b>
                        </label>
                        <label
                          className={styles.timerPolicyCard}
                          data-active={enforceSectionTimers}
                          data-level="section"
                        >
                          <input
                            checked={enforceSectionTimers}
                            disabled={!isSelectedDraft}
                            onChange={(event) => {
                              setValidationIssues([]);
                              setEnforceSectionTimers(event.target.checked);
                            }}
                            type="checkbox"
                          />
                          <span
                            className={styles.toggleTrack}
                            aria-hidden="true"
                          >
                            <span />
                          </span>
                          <span className={styles.timerPolicyIcon}>
                            <ListChecks size={18} aria-hidden="true" />
                          </span>
                          <span className={styles.timerPolicyCopy}>
                            <strong>Section timers</strong>
                            <small>
                              Every section ends at its configured time.
                            </small>
                          </span>
                          <b>{enforceSectionTimers ? "On" : "Off"}</b>
                        </label>
                      </div>
                      <div className={styles.studentTimerNote}>
                        <CheckCircle2 size={17} aria-hidden="true" />
                        <p>
                          <strong>What students experience</strong>
                          <span>
                            {enforceSlotTimers && enforceSectionTimers
                              ? "Three countdowns can apply. The earliest active deadline controls the current section."
                              : enforceSlotTimers
                                ? "The overall countdown continues while the current slot has its own deadline."
                                : enforceSectionTimers
                                  ? "The overall countdown continues while each section has its own deadline."
                                  : "Students see one countdown for the entire exam and can move at their own pace."}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
                <section
                  className={styles.mappingHeaderCard}
                  id="build-sections"
                >
                  <div className={styles.mappingHeaderTop}>
                    <div className={styles.mappingHeaderCopy}>
                      <span className={styles.stepLabel}>
                        Step 3 · Structure
                      </span>
                      <h3>Build the exam structure</h3>
                      <p>
                        Work from top to bottom: define each slot, configure its
                        sections, then save the draft.
                      </p>
                      {canArrangeNewVersion ? (
                        <small className={styles.arrangeHint}>
                          This is a new version. Drag slots and sections or use
                          the arrow controls to set their delivery order.
                        </small>
                      ) : null}
                    </div>
                    <button
                      className={styles.secondaryButton}
                      disabled={!isSelectedDraft}
                      onClick={() =>
                        setSlots((current) => [
                          ...current,
                          {
                            ...emptySlot(),
                            name: `Slot ${current.length + 1}`,
                          },
                        ])
                      }
                      type="button"
                    >
                      <CirclePlus size={15} />
                      Add slot
                    </button>
                  </div>
                  <div
                    className={styles.structureSteps}
                    aria-label="How to complete Step 3"
                  >
                    <article>
                      <span>1</span>
                      <div>
                        <strong>Define slots and sections</strong>
                        <p>Name each part and set its timing and rules.</p>
                      </div>
                    </article>
                    <article>
                      <span>2</span>
                      <div>
                        <strong>Save the draft structure</strong>
                        <p>
                          Check the structure and keep your progress safely.
                        </p>
                      </div>
                    </article>
                    <article>
                      <span>3</span>
                      <div>
                        <strong>Review the finalized structure</strong>
                        <p>
                          Import questions in the center below using these exact
                          names and this saved order.
                        </p>
                      </div>
                    </article>
                  </div>
                  {canArrangeNewVersion ? (
                    <div
                      className={styles.structureOrderPanel}
                      id="template-structure-order"
                    >
                      <div className={styles.structureOrderHeading}>
                        <div>
                          <strong>Slot &amp; section order</strong>
                          <span>
                            Set the delivery sequence, then save the draft to
                            keep these changes.
                          </span>
                        </div>
                        <span className={styles.structureOrderBadge}>
                          {slots.length} {slots.length === 1 ? "slot" : "slots"}
                          {" · "}
                          {sectionCount}{" "}
                          {sectionCount === 1 ? "section" : "sections"}
                        </span>
                      </div>
                      <div className={styles.structureOrderList}>
                        {slots.map((slot, slotIndex) => (
                          <article key={slot.id ?? `order-slot-${slotIndex}`}>
                            <div className={styles.structureOrderSlot}>
                              <span>
                                <b>{slotIndex + 1}</b>
                                <strong>
                                  {slot.name || `Slot ${slotIndex + 1}`}
                                </strong>
                              </span>
                              <div>
                                <button
                                  disabled={slotIndex === 0}
                                  onClick={() =>
                                    arrangeSlots(slotIndex, slotIndex - 1)
                                  }
                                  type="button"
                                >
                                  <ChevronUp size={14} />
                                  Move up
                                </button>
                                <button
                                  disabled={slotIndex === slots.length - 1}
                                  onClick={() =>
                                    arrangeSlots(slotIndex, slotIndex + 1)
                                  }
                                  type="button"
                                >
                                  <ChevronDown size={14} />
                                  Move down
                                </button>
                              </div>
                            </div>
                            <ol className={styles.structureOrderSections}>
                              {slot.sections.map((section, sectionIndex) => (
                                <li
                                  key={
                                    section.id ??
                                    `order-section-${slotIndex}-${sectionIndex}`
                                  }
                                >
                                  <span>
                                    <b>{sectionIndex + 1}</b>
                                    {section.name ||
                                      `Section ${sectionIndex + 1}`}
                                  </span>
                                  <div>
                                    <button
                                      aria-label={`Move ${section.name || `section ${sectionIndex + 1}`} up`}
                                      disabled={sectionIndex === 0}
                                      onClick={() =>
                                        arrangeSections(
                                          slotIndex,
                                          sectionIndex,
                                          sectionIndex - 1,
                                        )
                                      }
                                      type="button"
                                    >
                                      <ChevronUp size={14} />
                                      Up
                                    </button>
                                    <button
                                      aria-label={`Move ${section.name || `section ${sectionIndex + 1}`} down`}
                                      disabled={
                                        sectionIndex ===
                                        slot.sections.length - 1
                                      }
                                      onClick={() =>
                                        arrangeSections(
                                          slotIndex,
                                          sectionIndex,
                                          sectionIndex + 1,
                                        )
                                      }
                                      type="button"
                                    >
                                      <ChevronDown size={14} />
                                      Down
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ol>
                          </article>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </section>
                {slots.map((slot, slotIndex) => (
                  <article
                    className={styles.slotBlueprintCard}
                    draggable={canArrangeNewVersion}
                    id={`exam-slot-${slotIndex + 1}`}
                    key={slotIndex}
                    onDragEnd={() => setDraggedSlotIndex(null)}
                    onDragOver={(event) => {
                      if (canArrangeNewVersion) event.preventDefault();
                    }}
                    onDragStart={() => setDraggedSlotIndex(slotIndex)}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (draggedSlotIndex !== null) {
                        arrangeSlots(draggedSlotIndex, slotIndex);
                        setDraggedSlotIndex(null);
                      }
                    }}
                  >
                    <div className={styles.slotBlueprintHeader}>
                      <div>
                        <span className={styles.sequenceBadge}>
                          {slotIndex + 1}
                        </span>
                        <div>
                          <strong>Slot {slotIndex + 1}</strong>
                          <h3>
                            {slot.name || `Untitled slot ${slotIndex + 1}`}
                          </h3>
                        </div>
                      </div>
                      <div className={styles.slotBlueprintMeta}>
                        {canArrangeNewVersion ? (
                          <span className={styles.orderControls}>
                            <GripVertical
                              aria-hidden="true"
                              className={styles.dragHandle}
                              size={16}
                            />
                            <button
                              aria-label={`Move ${slot.name} up`}
                              disabled={slotIndex === 0}
                              onClick={() =>
                                arrangeSlots(slotIndex, slotIndex - 1)
                              }
                              type="button"
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              aria-label={`Move ${slot.name} down`}
                              disabled={slotIndex === slots.length - 1}
                              onClick={() =>
                                arrangeSlots(slotIndex, slotIndex + 1)
                              }
                              type="button"
                            >
                              <ChevronDown size={14} />
                            </button>
                          </span>
                        ) : null}
                        <span>
                          <ListChecks size={13} aria-hidden="true" />
                          {slot.sections.length}{" "}
                          {slot.sections.length === 1 ? "section" : "sections"}
                        </span>
                        <span data-timed={enforceSlotTimers}>
                          <Clock3 size={13} aria-hidden="true" />
                          {enforceSlotTimers
                            ? `${slot.durationMinutes} min timer`
                            : "Timer off"}
                        </span>
                      </div>
                    </div>
                    <p className={styles.slotHelper}>
                      A slot is one major part of the exam. Configure its basic
                      details first, then complete the section settings below.
                    </p>
                    <div className={styles.slotSetupPanel}>
                      <div className={styles.slotSetupGrid}>
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
                              ? current.filter(
                                  (_, index) => index !== slotIndex,
                                )
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
                    <div
                      className={styles.slotTimeBudget}
                      data-over={
                        slotTimingStats[slotIndex].remainingMinutes < 0
                      }
                    >
                      <div className={styles.slotTimeBudgetHeader}>
                        <span>
                          <Clock3 size={16} aria-hidden="true" />
                          <strong>Section time allocation</strong>
                        </span>
                        <b>
                          {slotTimingStats[slotIndex].sectionMinutes} /{" "}
                          {slot.durationMinutes} min used
                        </b>
                      </div>
                      <div
                        className={styles.slotTimeProgress}
                        aria-hidden="true"
                      >
                        <span
                          style={{
                            width: `${slotTimingStats[slotIndex].utilization}%`,
                          }}
                        />
                      </div>
                      <p>
                        {slotTimingStats[slotIndex].remainingMinutes < 0
                          ? `Reduce section times by ${Math.abs(slotTimingStats[slotIndex].remainingMinutes)} minutes or increase this slot's duration.`
                          : slotTimingStats[slotIndex].remainingMinutes === 0
                            ? "Perfect fit — section times use the complete slot."
                            : `${slotTimingStats[slotIndex].remainingMinutes} minutes remain available in this slot.`}
                      </p>
                    </div>
                    <div className={styles.slotRulesPanel}>
                      <div className={styles.slotRulesHeading}>
                        <strong>Slot behavior</strong>
                        <span>
                          Control movement and what happens at the deadline.
                        </span>
                      </div>
                      <div className={styles.policyGrid}>
                        <CrudSelect
                          ariaLabel={`${slot.name} navigation mode`}
                          disabled={!isSelectedDraft}
                          label="Student navigation"
                          onChange={(value) =>
                            updateSlot(slotIndex, {
                              navigationMode: value as ExamNavigationMode,
                            })
                          }
                          options={[
                            { label: "Free navigation", value: "FREE" },
                            { label: "Sequential", value: "SEQUENTIAL" },
                            {
                              label: "Lock after submit",
                              value: "LOCKED_AFTER_SUBMIT",
                            },
                          ]}
                          value={slot.navigationMode}
                          width="100%"
                        />
                        <label>
                          Instructions shown on entry
                          <input
                            disabled={!isSelectedDraft}
                            onChange={(event) =>
                              updateSlot(slotIndex, {
                                instructions: event.target.value,
                              })
                            }
                            placeholder="Optional guidance for this slot"
                            value={slot.instructions}
                          />
                        </label>
                      </div>
                      <div
                        className={styles.slotTimeoutRule}
                        data-disabled={!enforceSlotTimers}
                      >
                        <label className={styles.inlineCheck}>
                          <input
                            checked={slot.autoSubmitOnTimeout}
                            disabled={!isSelectedDraft || !enforceSlotTimers}
                            onChange={(event) =>
                              updateSlot(slotIndex, {
                                autoSubmitOnTimeout: event.target.checked,
                              })
                            }
                            type="checkbox"
                          />
                          <span>
                            <strong>Auto-submit at the slot deadline</strong>
                            <small>
                              {enforceSlotTimers
                                ? "Student answers in this slot are submitted when its timer reaches zero."
                                : "Turn on slot timers above to activate this rule."}
                            </small>
                          </span>
                        </label>
                      </div>
                    </div>
                    {slot.sections.map((section, sectionIndex) => (
                      <div
                        className={styles.sectionCard}
                        draggable={canArrangeNewVersion}
                        id={`exam-slot-${slotIndex + 1}-section-${sectionIndex + 1}`}
                        key={sectionIndex}
                        onDragEnd={() => setDraggedSection(null)}
                        onDragOver={(event) => {
                          if (canArrangeNewVersion) event.preventDefault();
                        }}
                        onDragStart={(event) => {
                          event.stopPropagation();
                          setDraggedSection({ slotIndex, sectionIndex });
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          if (draggedSection?.slotIndex === slotIndex) {
                            arrangeSections(
                              slotIndex,
                              draggedSection.sectionIndex,
                              sectionIndex,
                            );
                            setDraggedSection(null);
                          }
                        }}
                      >
                        <div className={styles.sectionHeader}>
                          <div>
                            <span>Section {sectionIndex + 1}</span>
                            <h4>
                              {section.name ||
                                `Untitled section ${sectionIndex + 1}`}
                            </h4>
                          </div>
                          <div className={styles.sectionHeaderActions}>
                            {canArrangeNewVersion ? (
                              <span className={styles.orderControls}>
                                <GripVertical
                                  aria-hidden="true"
                                  className={styles.dragHandle}
                                  size={15}
                                />
                                <button
                                  aria-label={`Move ${section.name} up`}
                                  disabled={sectionIndex === 0}
                                  onClick={() =>
                                    arrangeSections(
                                      slotIndex,
                                      sectionIndex,
                                      sectionIndex - 1,
                                    )
                                  }
                                  type="button"
                                >
                                  <ChevronUp size={13} />
                                </button>
                                <button
                                  aria-label={`Move ${section.name} down`}
                                  disabled={
                                    sectionIndex === slot.sections.length - 1
                                  }
                                  onClick={() =>
                                    arrangeSections(
                                      slotIndex,
                                      sectionIndex,
                                      sectionIndex + 1,
                                    )
                                  }
                                  type="button"
                                >
                                  <ChevronDown size={13} />
                                </button>
                              </span>
                            ) : null}
                            <span
                              className={styles.sectionTimerBadge}
                              data-active={enforceSectionTimers}
                            >
                              <Clock3 size={12} aria-hidden="true" />
                              {enforceSectionTimers
                                ? `${section.durationMinutes} min`
                                : "Timer off"}
                            </span>
                            <span className={styles.questionLimitBadge}>
                              {section.questionsToAttempt} to attempt
                            </span>
                            <button
                              className={styles.dangerButton}
                              disabled={
                                !isSelectedDraft || slot.sections.length === 1
                              }
                              onClick={() =>
                                updateSlot(slotIndex, {
                                  sections: slot.sections.filter(
                                    (_, index) => index !== sectionIndex,
                                  ),
                                })
                              }
                              title={
                                slot.sections.length === 1
                                  ? "A slot must contain at least one section"
                                  : `Remove ${section.name}`
                              }
                              type="button"
                            >
                              <Trash2 size={13} />
                              Remove
                            </button>
                          </div>
                        </div>
                        <p className={styles.sectionInstruction}>
                          Complete the section settings and choose its subject.
                        </p>
                        <div className={styles.rowFields}>
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
                            Questions to attempt
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
                        <div className={styles.policyGrid}>
                          <CrudSelect
                            ariaLabel={`${section.name} navigation mode`}
                            disabled={!isSelectedDraft}
                            label="Question navigation"
                            onChange={(value) =>
                              updateSection(slotIndex, sectionIndex, {
                                navigationMode: value as ExamNavigationMode,
                              })
                            }
                            options={[
                              { label: "Free navigation", value: "FREE" },
                              { label: "Sequential", value: "SEQUENTIAL" },
                              {
                                label: "Lock after submit",
                                value: "LOCKED_AFTER_SUBMIT",
                              },
                            ]}
                            value={section.navigationMode}
                            width="100%"
                          />
                          <label>
                            Section instructions
                            <input
                              disabled={!isSelectedDraft}
                              onChange={(event) =>
                                updateSection(slotIndex, sectionIndex, {
                                  instructions: event.target.value,
                                })
                              }
                              placeholder="Optional section instructions"
                              value={section.instructions}
                            />
                          </label>
                        </div>
                        <div className={styles.policyChecks}>
                          <label>
                            <input
                              checked={section.randomizeQuestions}
                              disabled={!isSelectedDraft}
                              onChange={(event) =>
                                updateSection(slotIndex, sectionIndex, {
                                  randomizeQuestions: event.target.checked,
                                })
                              }
                              type="checkbox"
                            />
                            Randomize questions
                          </label>
                          <label>
                            <input
                              checked={section.randomizeOptions}
                              disabled={!isSelectedDraft}
                              onChange={(event) =>
                                updateSection(slotIndex, sectionIndex, {
                                  randomizeOptions: event.target.checked,
                                })
                              }
                              type="checkbox"
                            />
                            Randomize options
                          </label>
                          <label>
                            <input
                              checked={section.allowReview}
                              disabled={!isSelectedDraft}
                              onChange={(event) =>
                                updateSection(slotIndex, sectionIndex, {
                                  allowReview: event.target.checked,
                                })
                              }
                              type="checkbox"
                            />
                            Allow mark for review
                          </label>
                          <label>
                            <input
                              checked={section.autoSubmitOnTimeout}
                              disabled={
                                !isSelectedDraft || !enforceSectionTimers
                              }
                              onChange={(event) =>
                                updateSection(slotIndex, sectionIndex, {
                                  autoSubmitOnTimeout: event.target.checked,
                                })
                              }
                              type="checkbox"
                            />
                            Auto-submit on section timeout
                          </label>
                        </div>
                        {!enforceSectionTimers ? (
                          <span className={styles.inlineHelper}>
                            Enable section timers to use section auto-submit.
                          </span>
                        ) : null}
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
                            options={availableSubjects.map((subject) => ({
                              label: subject.name,
                              value: String(subject.id),
                            }))}
                            placeholder={
                              builderSubjects.isLoading
                                ? "Loading subjects..."
                                : availableSubjects.length
                                  ? "Choose subject"
                                  : "No subjects available"
                            }
                            value={
                              section.subjectId ? String(section.subjectId) : ""
                            }
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      className={`${styles.textButton} ${styles.addSectionButton}`}
                      disabled={!isSelectedDraft}
                      onClick={() =>
                        updateSlot(slotIndex, {
                          sections: [
                            ...slot.sections,
                            {
                              ...emptySection(),
                              name: `Section ${slot.sections.length + 1}`,
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
              {isSelectedDraft && selected ? (
                <ImportsPanel
                  embedded
                  initialTemplateId={selected.id}
                  key={`builder-import-${selected.id}-${selectedVersionId ?? "draft"}`}
                  organizationId={effectiveOrganizationId}
                  onImported={() =>
                    loadBuilder(selected, selectedVersionId ?? "draft")
                  }
                  report={report}
                  templates={templates}
                />
              ) : null}
              <section
                aria-labelledby="template-review-publish-heading"
                className={styles.reviewPublishPanel}
                id="template-review-publish"
              >
                <div className={styles.reviewPublishHeader}>
                  <div>
                    <span className={styles.stepLabel}>
                      Step 4 · Review & publish
                    </span>
                    <h3 id="template-review-publish-heading">
                      Check the final exam blueprint
                    </h3>
                    <p>
                      Review the draft below. Publishing locks this version so
                      scheduled exams always use a stable structure.
                    </p>
                  </div>
                  <div
                    className={styles.reviewStatus}
                    data-ready={isPublishReady}
                  >
                    <CheckCircle2 size={18} />
                    <strong>
                      {isPublishReady ? "Ready to publish" : "Needs attention"}
                    </strong>
                  </div>
                </div>

                <div className={styles.reviewMetricGrid}>
                  <span>
                    <b>{defaultDurationMinutes}</b>
                    minutes
                  </span>
                  <span>
                    <b>{slots.length}</b>
                    slots
                  </span>
                  <span>
                    <b>{sectionCount}</b>
                    sections
                  </span>
                  <span>
                    <b>{selectedQuestionCount}</b>
                    linked questions
                  </span>
                </div>

                <div className={styles.reviewChecklist}>
                  {liveValidationIssues.length ? (
                    liveValidationIssues.map((issue) => (
                      <span
                        data-complete={false}
                        key={`${issue.target}-${issue.message}`}
                      >
                        <CheckCircle2 size={15} />
                        {issue.message}
                      </span>
                    ))
                  ) : (
                    <span data-complete>
                      <CheckCircle2 size={15} />
                      Timing, sections, subjects, and question counts are ready.
                    </span>
                  )}
                </div>

                <div className={styles.reviewPublishActions}>
                  <button
                    className={styles.secondaryButton}
                    disabled={!isSelectedDraft}
                    onClick={save}
                    type="button"
                  >
                    <Save size={16} />
                    Save draft
                  </button>
                  <button
                    className={styles.publishButton}
                    disabled={!isSelectedDraft || !isPublishReady}
                    onClick={publish}
                    type="button"
                  >
                    <Send size={16} />
                    Publish version
                  </button>
                  <small>
                    {isSelectedDraft
                      ? "You can publish once every checklist item is complete."
                      : "Open the current draft to edit or publish this template."}
                  </small>
                </div>
              </section>
            </>
          )}
        </section>
      </div>
      {showVersionOptions && selected ? (
        <div
          aria-modal="true"
          className={styles.versionDialogBackdrop}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target)
              setShowVersionOptions(false);
          }}
          role="dialog"
        >
          <section
            aria-labelledby="new-template-version-title"
            className={styles.versionDialog}
          >
            <div>
              <span className={styles.stepLabel}>Create new version</span>
              <h2 id="new-template-version-title">
                Choose what to copy from {selected.name}
              </h2>
              <p>
                The published version remains unchanged. You can rearrange the
                cloned slots and sections in the new draft.
              </p>
            </div>
            <div className={styles.versionChoiceGrid}>
              <button
                className={styles.versionChoice}
                onClick={() => createNextVersion(false)}
                type="button"
              >
                <Layers3 size={22} />
                <strong>Copy structure only</strong>
                <span>
                  Copy timing, slots, sections, subjects, and their current
                  order without question links.
                </span>
              </button>
              <button
                className={styles.versionChoice}
                onClick={() => createNextVersion(true)}
                type="button"
              >
                <ClipboardList size={22} />
                <strong>Copy structure and questions</strong>
                <span>
                  Start with the complete published blueprint, including all
                  linked questions.
                </span>
              </button>
            </div>
            <button
              className={styles.secondaryButton}
              onClick={() => setShowVersionOptions(false)}
              type="button"
            >
              Cancel
            </button>
          </section>
        </div>
      ) : null}
    </div>
  );
};

const SubjectsPanel = ({
  organizationId,
  organizationSelector,
  questions,
  subjects,
  report,
}: {
  organizationId?: number;
  organizationSelector?: ReactNode;
  questions: ExamQuestion[];
  subjects: ExamSubject[];
  report: Report;
}) => {
  const activeSubjects = subjects.filter((subject) => subject.isActive);
  const activeCoverage = subjects.length
    ? `${activeSubjects.length} / ${subjects.length}`
    : "0 / 0";

  return (
    <div className={styles.subjectManagement}>
      <section className={styles.subjectHeroGrid} aria-label="Subject summary">
        <div className={styles.subjectHeroCard}>
          <img
            alt=""
            aria-hidden="true"
            className={styles.subjectDotGrid}
            src="/exam-subject-assets/dot-grid.png"
          />
          <div>
            <p>Assessment Management</p>
            <h1>Subject Management</h1>
            <span>
              Create and organize subjects for consistent question mapping
              across exams.
            </span>
          </div>
          <img
            alt=""
            aria-hidden="true"
            className={styles.subjectBookStack}
            src="/exam-subject-assets/books-stack.png"
          />
        </div>

        <div className={styles.subjectActiveCard}>
          <span className={styles.subjectActiveDot} />
          <img
            alt=""
            aria-hidden="true"
            src="/exam-subject-assets/books-circle.png"
          />
          <strong>{activeSubjects.length}</strong>
          <p>
            Active
            <span>subjects</span>
          </p>
        </div>

        <div className={styles.subjectInsightCard}>
          <img
            alt=""
            aria-hidden="true"
            className={styles.subjectSparkles}
            src="/exam-subject-assets/sparkles.png"
          />
          <img
            alt=""
            aria-hidden="true"
            className={styles.subjectQuestionBook}
            src="/exam-subject-assets/question-book.png"
          />
          <p>Subject Insights</p>
          <h2>Question coverage</h2>
          <div className={styles.subjectInsightStats}>
            <span>
              <img
                alt=""
                aria-hidden="true"
                src="/exam-subject-assets/mapped-questions-icon.png"
              />
              <strong>{questions.length}</strong>
              <small>Mapped questions</small>
            </span>
            <span>
              <CheckCircle2 aria-hidden="true" size={24} />
              <strong>{activeCoverage}</strong>
              <small>Active</small>
            </span>
          </div>
        </div>
      </section>

      <div className={styles.subjectWorkspace}>
        <section className={styles.subjectFormCard}>
          <div className={styles.subjectPanelTitle}>
            <div>
              <h2>Add subject</h2>
              <p>Subjects are tenant-scoped and reused across templates.</p>
            </div>
            <UsersRound aria-hidden="true" size={22} />
          </div>
          <form
            action={(form) => {
              if (!organizationId) return;
              report(
                examsApi.subjects.create({
                  organizationId,
                  name: String(form.get("name")),
                  description: String(form.get("description") || ""),
                }),
                "Subject created",
              );
            }}
            className={`${styles.form} ${styles.subjectForm}`}
          >
            {organizationSelector}
            <label>
              Subject name
              <input name="name" required placeholder="Quantitative Aptitude" />
            </label>
            <label>
              Description
              <textarea
                name="description"
                placeholder="Coverage and intended use"
              />
            </label>
            <button
              className={`${styles.primaryButton} ${styles.subjectCreateButton}`}
              disabled={!organizationId}
            >
              <Plus size={18} />
              Create subject
            </button>
          </form>
        </section>

        <section className={styles.subjectCatalogCard}>
          <div className={styles.subjectPanelTitle}>
            <div>
              <h2>Subject catalog</h2>
              <p>{subjects.length} available for question mapping</p>
            </div>
          </div>
          <div className={styles.subjectCatalog}>
            {subjects.map((subject) => (
              <article key={subject.id}>
                <div className={styles.subjectCatalogIcon}>
                  {subject.code.slice(0, 2)}
                </div>
                <div className={styles.subjectCatalogCopy}>
                  <strong>{subject.name}</strong>
                  <span>{subject.code}</span>
                  <p>{subject.description || "No description"}</p>
                </div>
                <span
                  className={styles.subjectStatus}
                  data-value={subject.isActive ? "ACTIVE" : "INACTIVE"}
                >
                  {subject.isActive ? "Active" : "Inactive"}
                </span>
              </article>
            ))}
            {!subjects.length ? (
              <Empty
                icon={Library}
                title="No subjects yet"
                text="Create the first subject to begin question mapping."
              />
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
};

const TopicsPanel = ({
  organizationId,
  organizationSelector,
  subjects,
  topics,
  report,
}: {
  organizationId?: number;
  organizationSelector?: ReactNode;
  subjects: ExamSubject[];
  topics: ExamTopic[];
  report: Report;
}) => {
  const [subjectId, setSubjectId] = useState(0);
  const [subjectFilter, setSubjectFilter] = useState("all");
  const visibleTopics = topics.filter(
    (topic) =>
      subjectFilter === "all" || topic.subjectId === Number(subjectFilter),
  );

  return (
    <div className={styles.topicManagement}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Question taxonomy</p>
          <h1>Topics</h1>
          <p>
            Organize each subject into reportable learning areas. Existing
            questions can remain uncategorized.
          </p>
        </div>
        <div className={styles.headerBadge}>
          <Layers3 size={22} aria-hidden="true" />
          <div>
            <strong>{topics.filter((topic) => topic.isActive).length}</strong>
            <span>Active topics</span>
          </div>
        </div>
      </header>

      <div className={styles.topicWorkspace}>
        <section className={styles.panel}>
          <div className={styles.panelTitle}>
            <div>
              <h2>Create topic</h2>
              <p>A topic belongs to exactly one subject.</p>
            </div>
          </div>
          <form
            action={(form) => {
              if (!organizationId || !subjectId) return;
              report(
                examsApi.topics.create({
                  organizationId,
                  subjectId,
                  name: String(form.get("name")),
                  description: String(form.get("description") || ""),
                }),
                "Topic created",
              );
            }}
            className={styles.form}
          >
            {organizationSelector}
            <CrudSelectField
              label="Subject"
              onChange={(value) => setSubjectId(Number(value))}
              options={subjects
                .filter((subject) => subject.isActive)
                .map((subject) => ({
                  label: subject.name,
                  value: String(subject.id),
                }))}
              placeholder="Choose subject"
              value={subjectId ? String(subjectId) : ""}
            />
            <label>
              Topic name
              <input name="name" placeholder="Percentages" required />
            </label>
            <label>
              Description
              <textarea
                name="description"
                placeholder="What this topic covers"
                rows={3}
              />
            </label>
            <button
              className={styles.primaryButton}
              disabled={!organizationId || !subjectId}
            >
              <Plus size={16} />
              Create topic
            </button>
          </form>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelTitle}>
            <div>
              <h2>Topic catalog</h2>
              <p>{visibleTopics.length} available for question mapping</p>
            </div>
            <CrudSelect
              ariaLabel="Filter topics by subject"
              onChange={setSubjectFilter}
              options={[
                { label: "All subjects", value: "all" },
                ...subjects.map((subject) => ({
                  label: subject.name,
                  value: String(subject.id),
                })),
              ]}
              value={subjectFilter}
              width="190px"
            />
          </div>
          <div className={styles.catalog}>
            {visibleTopics.map((topic) => (
              <article key={topic.id}>
                <div className={styles.subjectIcon}>
                  {topic.code.slice(0, 2)}
                </div>
                <div>
                  <strong>{topic.name}</strong>
                  <span>
                    {topic.subject?.name ??
                      subjects.find((subject) => subject.id === topic.subjectId)
                        ?.name ??
                      "Unknown subject"}
                    {" · "}
                    {topic.code}
                  </span>
                  <p>
                    {topic.description || "No description"} ·{" "}
                    {topic._count?.questionVersions ?? 0} question versions
                  </p>
                </div>
                <button
                  className={styles.textButton}
                  onClick={() =>
                    report(
                      examsApi.topics.update(topic.id, {
                        isActive: !topic.isActive,
                      }),
                      topic.isActive ? "Topic deactivated" : "Topic activated",
                    )
                  }
                  type="button"
                >
                  {topic.isActive ? "Deactivate" : "Activate"}
                </button>
              </article>
            ))}
            {!visibleTopics.length ? (
              <Empty
                icon={Layers3}
                title="No topics yet"
                text="Create the first topic for a subject to enable topic-wise reporting."
              />
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
};

const ReportsPanel = ({
  exams,
  organizationSelector,
}: {
  exams: ScheduledExam[];
  organizationSelector?: ReactNode;
}) => {
  const [examId, setExamId] = useState(0);
  const report = useQuery({
    queryKey: ["admin-exam-report", examId],
    queryFn: () => examsApi.scheduled.report(examId),
    enabled: Boolean(examId),
  });

  return (
    <div className={styles.reportManagement}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Assessment insights</p>
          <h1>Exam Reports</h1>
          <p>
            Compare student results, sections, and topics using each
            student&apos;s best completed attempt.
          </p>
        </div>
        <div className={styles.headerBadge}>
          <BarChart3 size={22} aria-hidden="true" />
          <div>
            <strong>{report.data?.summary.students ?? 0}</strong>
            <span>Students ranked</span>
          </div>
        </div>
      </header>
      <section className={`${styles.panel} ${styles.reportPicker}`}>
        {organizationSelector}
        <CrudSelectField
          label="Exam"
          onChange={(value) => setExamId(Number(value))}
          options={exams.map((exam) => ({
            label: `${exam.title} · ${exam.code}`,
            value: String(exam.id),
          }))}
          placeholder={exams.length ? "Choose an exam" : "No scheduled exams"}
          value={examId ? String(examId) : ""}
        />
        <p>
          Rankings use one best attempt per student. Topic rows marked
          Uncategorized preserve historical questions without topic mapping.
        </p>
      </section>
      {report.isLoading ? (
        <div className={styles.reportState}>Building report...</div>
      ) : null}
      {report.isError ? (
        <div className={styles.error}>Unable to load this exam report.</div>
      ) : null}
      {report.data ? (
        <>
          <section className={styles.reportStats}>
            <ReportStat label="Students" value={report.data.summary.students} />
            <ReportStat
              label="Attempts"
              value={report.data.summary.totalAttempts}
            />
            <ReportStat
              label="Average"
              value={`${report.data.summary.averagePercentage}%`}
            />
            <ReportStat
              label="Highest"
              value={`${report.data.summary.highestPercentage}%`}
            />
            <ReportStat
              label="Lowest"
              value={`${report.data.summary.lowestPercentage}%`}
            />
            <ReportStat
              label="Avg. accuracy"
              value={`${report.data.summary.averageAccuracy}%`}
            />
            <ReportStat
              label="Avg. completion"
              value={`${report.data.summary.averageCompletionRate}%`}
            />
            <ReportStat
              label="Avg. time"
              value={formatExamReportDuration(
                report.data.summary.averageDurationSeconds,
              )}
            />
            <ReportStat
              label="Pass rate"
              value={
                report.data.summary.passRate === null
                  ? "Not set"
                  : `${report.data.summary.passRate}%`
              }
            />
          </section>
          <div className={styles.reportGrid}>
            <section className={styles.panel}>
              <div className={styles.panelTitle}>
                <div>
                  <h2>Section performance</h2>
                  <p>Score, accuracy, completion, and time by section</p>
                </div>
              </div>
              <div className={styles.reportMetricList}>
                {report.data.performance.sections.map((section) => (
                  <article key={section.key}>
                    <div>
                      <strong>{section.label}</strong>
                      <span>
                        {section.correct} correct · {section.incorrect}{" "}
                        incorrect · {section.unattempted} skipped
                      </span>
                    </div>
                    <div className={styles.reportMetricBar}>
                      <span
                        style={{
                          width: `${Math.max(0, section.percentage)}%`,
                        }}
                      />
                    </div>
                    <div className={styles.reportMetricValues}>
                      <b>{section.percentage}% score</b>
                      <span>{section.accuracy}% accuracy</span>
                      <span>{section.completionRate}% completed</span>
                      <span>
                        {formatExamReportDuration(section.timeSpentSeconds)}
                      </span>
                    </div>
                  </article>
                ))}
                {!report.data.performance.sections.length ? (
                  <p>No section results are available yet.</p>
                ) : null}
              </div>
            </section>
            <section className={styles.panel}>
              <div className={styles.panelTitle}>
                <div>
                  <h2>Topic performance</h2>
                  <p>Accuracy and marks across ranked students</p>
                </div>
              </div>
              <div className={styles.reportMetricList}>
                {report.data.performance.topics.map((topic) => (
                  <article key={topic.key}>
                    <div>
                      <strong>{topic.label}</strong>
                      <span>
                        {topic.subjectName} · {topic.attempted} attempted ·{" "}
                        {topic.unattempted} skipped
                      </span>
                    </div>
                    <div className={styles.reportMetricBar}>
                      <span
                        style={{ width: `${Math.max(0, topic.percentage)}%` }}
                      />
                    </div>
                    <div className={styles.reportMetricValues}>
                      <b>{topic.percentage}% score</b>
                      <span>{topic.accuracy}% accuracy</span>
                      <span>{topic.completionRate}% completed</span>
                      <span>
                        {formatExamReportDuration(topic.timeSpentSeconds)}
                      </span>
                    </div>
                  </article>
                ))}
                {!report.data.performance.topics.length ? (
                  <p>No topic results are available yet.</p>
                ) : null}
              </div>
            </section>
            <section
              className={`${styles.panel} ${styles.reportLeaderboardPanel}`}
            >
              <div className={styles.panelTitle}>
                <div>
                  <h2>Student leaderboard</h2>
                  <p>
                    Best completed attempt per student
                    {report.data.exam.passingPercentage === null
                      ? " · passing threshold not configured"
                      : ` · ${report.data.exam.passingPercentage}% required to pass`}
                  </p>
                </div>
              </div>
              <div className={styles.leaderboard}>
                {report.data.students.map((student) => (
                  <article key={student.studentId}>
                    <b>#{student.rank}</b>
                    <div>
                      <strong>
                        {student.name ||
                          student.rollNumber ||
                          `Student ${student.studentId}`}
                      </strong>
                      <span>
                        {student.rollNumber || "No roll number"} · Attempt{" "}
                        {student.attemptNumber} ·{" "}
                        {formatExamReportDuration(student.durationSeconds)}
                      </span>
                    </div>
                    <div className={styles.studentPerformanceValues}>
                      <strong>{student.percentage}%</strong>
                      <span>
                        {student.score} / {student.maximumScore} marks
                      </span>
                    </div>
                    <div className={styles.studentPerformanceValues}>
                      <span>{student.summary?.accuracy ?? 0}% accuracy</span>
                      <span>
                        {student.summary?.completionRate ?? 0}% completed
                      </span>
                    </div>
                    <span
                      className={styles.adminResultBadge}
                      data-status={student.resultStatus}
                    >
                      {student.resultStatus === "NOT_CONFIGURED"
                        ? "No pass rule"
                        : student.resultStatus === "PASSED"
                          ? "Passed"
                          : "Failed"}
                    </span>
                  </article>
                ))}
                {!report.data.students.length ? (
                  <p>No completed attempts are available yet.</p>
                ) : null}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
};

const ReportStat = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <article>
    <strong>{value}</strong>
    <span>{label}</span>
  </article>
);

const formatExamReportDuration = (seconds: number) => {
  const rounded = Math.max(0, Math.round(seconds));
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const remainingSeconds = rounded % 60;
  return hours ? `${hours}h ${minutes}m` : `${minutes}m ${remainingSeconds}s`;
};

const QuestionsPanel = ({
  organizationId,
  organizationSelector,
  subjects,
  topics,
  questions,
  questionTypes,
  report,
}: {
  organizationId?: number;
  organizationSelector?: ReactNode;
  subjects: ExamSubject[];
  topics: ExamTopic[];
  questions: ExamQuestion[];
  questionTypes: ExamQuestionType[];
  report: Report;
}) => {
  const [newQuestionSubjectId, setNewQuestionSubjectId] = useState(0);
  const [newQuestionTopicId, setNewQuestionTopicId] = useState(0);
  const [questionTypeId, setQuestionTypeId] = useState(0);
  const [newQuestionDifficulty, setNewQuestionDifficulty] =
    useState<QuestionDifficulty>("MEDIUM");
  const [virtualKeyboardMode, setVirtualKeyboardMode] = useState<
    "NONE" | "NUMERIC" | "ALPHANUMERIC"
  >("NONE");
  const [questionSearch, setQuestionSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
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
      (difficultyFilter === "all" ||
        version?.difficulty === difficultyFilter) &&
      (statusFilter === "all" || question.status === statusFilter)
    );
  });
  const publishedQuestions = questions.filter(
    (question) => question.status === "PUBLISHED",
  ).length;
  const draftQuestions = questions.filter(
    (question) => question.status === "DRAFT",
  ).length;
  const create = (form: FormData) => {
    if (!organizationId) return;
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
        topicId: newQuestionTopicId || undefined,
        questionTypeId,
        difficulty: newQuestionDifficulty,
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
        caseSensitive: form.get("caseSensitive") === "on",
        normalizeWhitespace: form.get("normalizeWhitespace") === "on",
        virtualKeyboardMode,
        allowPhysicalKeyboard: form.get("allowPhysicalKeyboard") === "on",
        allowPaste: form.get("allowPaste") === "on",
        maxAnswerLength: Number(form.get("maxAnswerLength")) || undefined,
      }),
      "Question added to the bank",
    );
  };
  return (
    <div className={styles.questionBankManagement}>
      <section className={styles.questionBankHeroGrid}>
        <div className={styles.questionBankHeroCard}>
          <img
            alt=""
            aria-hidden="true"
            className={styles.questionBankOutline}
            src="/exam-question-bank-assets/hero-question-outline.png"
          />
          <img
            alt=""
            aria-hidden="true"
            className={styles.questionBankDotGrid}
            src="/exam-question-bank-assets/hero-dot-grid.png"
          />
          <div>
            <p>Assessment Management</p>
            <h1>Question Bank</h1>
            <span>
              Create, organize, and maintain reusable questions across every
              assessment.
            </span>
          </div>
          <img
            alt=""
            aria-hidden="true"
            className={styles.questionBankDocument}
            src="/exam-question-bank-assets/hero-question-document.png"
          />
        </div>
        <div className={styles.reusableQuestionCard}>
          <img
            alt=""
            aria-hidden="true"
            src="/exam-question-bank-assets/reusable-questions-stack.png"
          />
          <strong>{questions.length}</strong>
          <p>Reusable questions</p>
        </div>
        <div className={styles.questionInsightsCard}>
          <img
            alt=""
            aria-hidden="true"
            className={styles.questionInsightsDots}
            src="/exam-question-bank-assets/insights-dot-grid.png"
          />
          <div>
            <p>Question Insights</p>
            <h2>Ready for assignment</h2>
            <div>
              <span>
                <strong>{publishedQuestions}</strong>
                Published
              </span>
              <span>
                <strong>{draftQuestions}</strong>
                Drafts
              </span>
            </div>
          </div>
          <img
            alt=""
            aria-hidden="true"
            className={styles.questionInsightsDocument}
            src="/exam-question-bank-assets/insights-question-document.png"
          />
        </div>
      </section>

      <div className={styles.questionBankWorkspace}>
        <section className={`${styles.panel} ${styles.questionCreatePanel}`}>
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
            {organizationSelector}
            <div className={styles.rowFields}>
              <CrudSelectField
                label="Subject"
                onChange={(value) => {
                  setNewQuestionSubjectId(Number(value));
                  setNewQuestionTopicId(0);
                }}
                options={subjects.map((subject) => ({
                  label: subject.name,
                  value: String(subject.id),
                }))}
                placeholder="Choose subject"
                value={newQuestionSubjectId ? String(newQuestionSubjectId) : ""}
              />
              <CrudSelectField
                disabled={!newQuestionSubjectId}
                label="Topic (optional)"
                onChange={(value) => setNewQuestionTopicId(Number(value))}
                options={topics
                  .filter(
                    (topic) =>
                      topic.isActive &&
                      topic.subjectId === newQuestionSubjectId,
                  )
                  .map((topic) => ({
                    label: topic.name,
                    value: String(topic.id),
                  }))}
                placeholder={
                  newQuestionSubjectId ? "Choose topic" : "Choose subject first"
                }
                value={newQuestionTopicId ? String(newQuestionTopicId) : ""}
              />
              <CrudSelectField
                label="Answer type"
                onChange={(value) => {
                  const nextType = questionTypes.find(
                    (item) => item.id === Number(value),
                  );
                  setQuestionTypeId(Number(value));
                  setVirtualKeyboardMode(
                    nextType?.code === "NUMERIC"
                      ? "NUMERIC"
                      : nextType?.code === "ONE_WORD"
                        ? "ALPHANUMERIC"
                        : "NONE",
                  );
                }}
                options={questionTypes.map((item) => ({
                  label: `${item.name} (ID ${item.id})`,
                  value: String(item.id),
                }))}
                placeholder="Choose answer type"
                value={questionTypeId ? String(questionTypeId) : ""}
              />
              <CrudSelectField
                label="Difficulty"
                onChange={(value) =>
                  setNewQuestionDifficulty(value as QuestionDifficulty)
                }
                options={difficultyOptions}
                value={newQuestionDifficulty}
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
            {typeCode && typeCode !== "SINGLE_CHOICE" ? (
              <div className={styles.templatePolicyCard}>
                <div className={styles.rowFields}>
                  <CrudSelect
                    ariaLabel="On-screen keyboard"
                    label="On-screen keyboard"
                    onChange={(value) =>
                      setVirtualKeyboardMode(
                        value as "NONE" | "NUMERIC" | "ALPHANUMERIC",
                      )
                    }
                    options={[
                      { label: "None", value: "NONE" },
                      { label: "Numeric", value: "NUMERIC" },
                      { label: "Alphanumeric", value: "ALPHANUMERIC" },
                    ]}
                    value={virtualKeyboardMode}
                    width="100%"
                  />
                  <label>
                    Maximum answer length
                    <input
                      max="5000"
                      min="1"
                      name="maxAnswerLength"
                      placeholder={typeCode === "NUMERIC" ? "20" : "100"}
                      type="number"
                    />
                  </label>
                </div>
                <div className={styles.policyChecks}>
                  <label>
                    <input
                      defaultChecked
                      name="allowPhysicalKeyboard"
                      type="checkbox"
                    />
                    Allow physical keyboard
                  </label>
                  <label>
                    <input defaultChecked name="allowPaste" type="checkbox" />
                    Allow paste
                  </label>
                  <label>
                    <input
                      defaultChecked
                      name="normalizeWhitespace"
                      type="checkbox"
                    />
                    Normalize whitespace
                  </label>
                  {typeCode === "ONE_WORD" ? (
                    <label>
                      <input name="caseSensitive" type="checkbox" />
                      Case-sensitive answer
                    </label>
                  ) : null}
                </div>
              </div>
            ) : null}
            <label>
              Explanation
              <textarea name="explanation" rows={2} />
            </label>
            <button
              className={styles.primaryButton}
              disabled={
                !organizationId || !newQuestionSubjectId || !questionTypeId
              }
            >
              <Plus size={16} />
              Add question
            </button>
          </form>
        </section>
        <section className={`${styles.panel} ${styles.questionBankPanel}`}>
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
              ariaLabel="Filter question bank by difficulty"
              label="Difficulty"
              onChange={setDifficultyFilter}
              options={[
                { label: "All levels", value: "all" },
                ...difficultyOptions,
              ]}
              value={difficultyFilter}
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
                      <span>
                        {question.subject.name}
                        {version?.topic ? ` · ${version.topic.name}` : ""}
                      </span>
                    </div>
                    <p>{contentSummary(version?.content)}</p>
                    <div className={styles.questionSummaryMeta}>
                      <span className={styles.typeBadge}>
                        {version?.questionType.name ?? "Unknown type"}
                      </span>
                      {version ? (
                        <span
                          className={styles.difficultyBadge}
                          data-difficulty={version.difficulty}
                        >
                          {difficultyLabel(version.difficulty)}
                        </span>
                      ) : null}
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
                        version?.options.find((option) => option.isCorrect)
                          ?.code
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
                          label: "Difficulty",
                          value: version
                            ? difficultyLabel(version.difficulty)
                            : null,
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
    </div>
  );
};

const ImportsPanel = ({
  embedded = false,
  initialTemplateId,
  organizationId,
  onImported,
  onPublished,
  onTemplateChange,
  templates,
  report,
}: {
  embedded?: boolean;
  initialTemplateId?: number;
  organizationId?: number;
  onImported?: () => void | Promise<void>;
  onPublished?: (templateId: number, versionId: number) => void | Promise<void>;
  onTemplateChange?: (templateId: number) => void;
  templates: ExamTemplateListItem[];
  report: Report;
}) => {
  const queryClient = useQueryClient();
  const [templateId, setTemplateId] = useState(initialTemplateId ?? 0);
  const [scope, setScope] = useState<"SINGLE_SECTION" | "FULL_EXAM">(
    "SINGLE_SECTION",
  );
  const [sectionId, setSectionId] = useState(0);
  const [job, setJob] = useState<ExamImportJob | null>(null);
  const [expandedImportRowId, setExpandedImportRowId] = useState<number | null>(
    null,
  );
  const [isStaging, setIsStaging] = useState(false);
  const isStagingRef = useRef(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const templateDetails = useQuery({
    queryKey: ["exam-template-detail", templateId],
    queryFn: () => examsApi.templates.get(templateId),
    enabled: Boolean(templateId),
  });
  const version = templateDetails.data?.versions.find(
    (item) => item.status === "DRAFT",
  );
  const recentImports = useQuery({
    queryKey: ["exam-import-jobs", organizationId, version?.id],
    queryFn: () =>
      examsApi.imports.list({
        organizationId,
        examTemplateVersionId: version!.id,
        limit: 8,
      }),
    enabled: Boolean(organizationId && version?.id),
  });
  const draftTemplateOptions = templates.map((item) => {
    const draft = item.versions.find(
      (versionItem) => versionItem.status === "DRAFT",
    );
    return {
      label: draft
        ? `${item.name} - v${draft.versionNumber} Draft`
        : `${item.name} - create a new draft`,
      value: String(item.id),
    };
  });
  const selectedTemplateOption =
    templateDetails.data && version
      ? {
          label: `${templateDetails.data.name} - v${version.versionNumber} Draft`,
          value: String(templateDetails.data.id),
        }
      : null;
  const templateOptions =
    selectedTemplateOption &&
    !draftTemplateOptions.some(
      (option) => option.value === selectedTemplateOption.value,
    )
      ? [selectedTemplateOption, ...draftTemplateOptions]
      : draftTemplateOptions;
  const sections =
    version?.slots.flatMap((slot) =>
      slot.sections.map((section) => ({
        ...section,
        slotId: slot.id,
        slotName: slot.name,
      })),
    ) ?? [];
  const effectiveSectionId =
    sectionId ||
    (scope === "SINGLE_SECTION" && sections.length === 1 ? sections[0].id : 0);
  const selectedSection = sections.find(
    (section) => section.id === effectiveSectionId,
  );
  const downloadTemplate = async (kind: "word" | "excel") => {
    try {
      const blob =
        kind === "word"
          ? await examsApi.imports.downloadCodelessWordTemplate()
          : version
            ? await examsApi.imports.downloadContextualCodelessExcelTemplate(
                version.id,
              )
            : await examsApi.imports.downloadCodelessExcelTemplate();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download =
        kind === "word"
          ? "exam-question-code-free-template.docx"
          : "exam-question-code-free-mapping-template.xlsx";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      report(Promise.reject(error), "");
    }
  };
  const stage = async (form: FormData) => {
    if (isStagingRef.current) return;
    const wordFile = form.get("wordFile");
    const excelFile = form.get("excelFile");
    if (!(wordFile instanceof File) || !(excelFile instanceof File) || !version)
      return;
    isStagingRef.current = true;
    setIsStaging(true);
    const payload = new FormData();
    payload.set("importMode", "CODELESS_WORD");
    payload.set("wordFile", wordFile);
    payload.set("excelFile", excelFile);
    payload.set("examTemplateVersionId", String(version.id));
    payload.set("scope", scope);
    if (scope === "SINGLE_SECTION") {
      payload.set("examTemplateSectionId", String(effectiveSectionId));
      payload.set("examTemplateSlotId", String(selectedSection?.slotId ?? ""));
    }
    try {
      const stagedJob = await examsApi.imports.stage(payload);
      setJob(stagedJob);
      const parameters = new URLSearchParams(window.location.search);
      parameters.set("importJobId", String(stagedJob.id));
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}?${parameters.toString()}${window.location.hash}`,
      );
      setExpandedImportRowId(null);
    } catch (error) {
      report(Promise.reject(error), "");
    } finally {
      isStagingRef.current = false;
      setIsStaging(false);
    }
  };
  const commit = async () => {
    if (!job || job.status !== "READY_FOR_REVIEW" || isCommitting) return;
    setIsCommitting(true);
    try {
      const committedJob = await examsApi.imports.commit(job.id);
      setJob(committedJob);
      report(Promise.resolve(), "Import committed atomically", onImported);
    } catch (error) {
      report(Promise.reject(error), "");
    } finally {
      setIsCommitting(false);
    }
  };
  const createDraft = (copyQuestions: boolean) => {
    if (!templateId || version) return;
    report(
      examsApi.templates.createVersion(templateId, { copyQuestions }),
      copyQuestions
        ? "Draft created with the published questions"
        : "Structure-only draft created",
      async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["exam-templates"] }),
          templateDetails.refetch(),
        ]);
      },
    );
  };
  const publishAndContinue = () => {
    if (!templateId || !version || job?.status !== "IMPORTED") return;
    report(
      examsApi.templates.publish(templateId),
      `Version ${version.versionNumber} published and ready to schedule`,
      async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["exam-templates"] }),
          queryClient.invalidateQueries({
            queryKey: ["exam-template-detail", templateId],
          }),
        ]);
        await onPublished?.(templateId, version.id);
      },
    );
  };
  useEffect(() => {
    const importJobId = Number(
      new URLSearchParams(window.location.search).get("importJobId"),
    );
    if (!Number.isInteger(importJobId) || importJobId < 1) return;
    void examsApi.imports
      .get(importJobId)
      .then(setJob)
      .catch(() => undefined);
  }, []);
  return (
    <div
      className={`${styles.importManagement} ${embedded ? styles.embeddedImportStep : ""}`}
      id={embedded ? "import-questions" : undefined}
    >
      {embedded ? (
        <section className={styles.embeddedImportHeader}>
          <span className={styles.embeddedImportIcon}>
            <FileUp size={21} aria-hidden="true" />
          </span>
          <div>
            <span className={styles.stepLabel}>Question import center</span>
            <h3>Import questions into this draft</h3>
            <p>
              Save the structure first. Then download the templates, upload the
              completed files, validate every row, and confirm the import
              without leaving this builder.
            </p>
          </div>
          <div className={styles.embeddedImportProgress}>
            <span>
              <b>1</b> Prepare files
            </span>
            <span>
              <b>2</b> Stage and validate
            </span>
            <span>
              <b>3</b> Confirm import
            </span>
          </div>
        </section>
      ) : (
        <section className={styles.importHeroGrid}>
          <div className={styles.importHeroCard}>
            <div>
              <p>Assessment Management</p>
              <h1>Question Import Center</h1>
              <span>
                Stage the code-free Word content and Excel mapping files,
                validate every row, and commit only when ready.
              </span>
            </div>
            <img
              alt=""
              aria-hidden="true"
              className={styles.importDocument}
              src="/exam-import-assets/import-document-illustration.png"
            />
          </div>
          <div className={styles.importStageCard}>
            <span className={styles.importStageDot} />
            <img
              alt=""
              aria-hidden="true"
              src="/exam-import-assets/staged-imports-icon.png"
            />
            <strong>{job ? 1 : 0}</strong>
            <p>Staged imports</p>
          </div>
          <div className={styles.importWorkflowCard}>
            <div>
              <p>Import Workflow</p>
              <h2>Ready for review</h2>
              <span>
                <CheckCircle2 size={15} />
                Row-level validation
              </span>
              <span>
                <CheckCircle2 size={15} />
                Safe atomic commit
              </span>
            </div>
            <img
              alt=""
              aria-hidden="true"
              src="/exam-import-assets/review-document-check.png"
            />
          </div>
        </section>
      )}
      <div className={styles.importWorkspace}>
        <section className={`${styles.panel} ${styles.importControlPanel}`}>
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
            <strong>Code-free Word + Excel import</strong>
            <code>
              Slot: Slot 1 | Section: English Language | Subject: English
            </code>
            <code>Heading 1: Comprehension - 1 to 5</code>
            <code>Passage text and/or embedded images (add once)</code>
            <code>Heading 2: Q1.</code>
            <code>Question text and/or embedded images</code>
            <code>Heading 3: Options</code>
            <code>A. Option text and/or image</code>
            <code>B. Each option starts on its own line</code>
            <code>Heading 3: Answer Rules</code>
            <code>Correct Option: A</code>
            <code>Case Sensitive: No</code>
            <code>
              Supporting images are allowed; scoring values must stay as text
            </code>
            <code>Heading 3: Explanation</code>
            <code>Explanation text and/or embedded images</code>
            <p>
              Use Directions - 1 to 5 when the shared block contains
              instructions. Word owns content, images, options, answers, and
              explanations. Excel owns slot, section, subject, topic, question
              type, difficulty, marks, and order. Q1. joins Excel
              question_number 1 within the same slot name and section name. Name
              matching ignores case, spaces, hyphens, and underscores; internal
              codes are generated by the backend.
            </p>
          </div>
          <div className={styles.templateActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => downloadTemplate("word")}
            >
              <FileText size={16} />
              Download code-free Word
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
          <div className={styles.sampleFiles}>
            <div>
              <strong>Completed RRB NTPC sample</strong>
              <span>
                Download a matching Word and Excel pair to see a validated
                100-question import before preparing your own files.
              </span>
            </div>
            <div className={styles.templateActions}>
              <a
                className={styles.secondaryButton}
                download="RRB_NTPC_Graduate_Mock_Test_01_Code_Free.docx"
                href="/exam-import-assets/samples/rrb-ntpc-graduate-mock-test-01/RRB_NTPC_Graduate_Mock_Test_01_Code_Free.docx"
              >
                <FileText size={16} />
                Download sample Word
              </a>
              <a
                className={styles.secondaryButton}
                download="RRB_NTPC_Graduate_Mock_Test_01_Mapping.xlsx"
                href="/exam-import-assets/samples/rrb-ntpc-graduate-mock-test-01/RRB_NTPC_Graduate_Mock_Test_01_Mapping.xlsx"
              >
                <FileSpreadsheet size={16} />
                Download sample Excel
              </a>
            </div>
          </div>
          <form action={stage} className={styles.form}>
            {embedded ? (
              <div className={styles.embeddedImportDestination}>
                <span>Current draft destination</span>
                <strong>
                  {templateDetails.data?.name ?? "Loading template"}
                  {version ? ` · v${version.versionNumber}` : ""}
                </strong>
                <small>
                  Questions are added to this template only after you confirm
                  the validated preview.
                </small>
              </div>
            ) : (
              <CrudSelectField
                description={
                  version
                    ? `Questions will be imported into version ${version.versionNumber}, which is the active draft.`
                    : undefined
                }
                label="Draft template"
                onChange={(value) => {
                  const nextTemplateId = Number(value);
                  setTemplateId(nextTemplateId);
                  setSectionId(0);
                  setJob(null);
                  onTemplateChange?.(nextTemplateId);
                  const parameters = new URLSearchParams(
                    window.location.search,
                  );
                  parameters.delete("importJobId");
                  const query = parameters.toString();
                  window.history.replaceState(
                    null,
                    "",
                    `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
                  );
                }}
                options={templateOptions}
                placeholder="Choose template"
                value={templateId ? String(templateId) : ""}
              />
            )}
            {templateId && templateDetails.data && !version ? (
              <section className={styles.prepareDraftCard}>
                <div>
                  <strong>Create an editable version first</strong>
                  <span>
                    Choose whether the new draft should keep the published
                    questions. Its slots and sections can then be rearranged in
                    Template Builder before import.
                  </span>
                </div>
                <div className={styles.inlineActions}>
                  <button
                    className={styles.secondaryButton}
                    onClick={() => createDraft(false)}
                    type="button"
                  >
                    Copy structure only
                  </button>
                  <button
                    className={styles.secondaryButton}
                    onClick={() => createDraft(true)}
                    type="button"
                  >
                    Copy structure & questions
                  </button>
                  <Link
                    className={styles.textButton}
                    href={`/admin/exams/templates/${templateId}/builder?returnTo=/admin/exams/schedule`}
                  >
                    Open Template Builder
                  </Link>
                </div>
              </section>
            ) : null}
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
                  value={effectiveSectionId ? String(effectiveSectionId) : ""}
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
              disabled={
                isStaging ||
                !version ||
                (scope === "SINGLE_SECTION" && !effectiveSectionId)
              }
            >
              <FileUp size={16} />
              {isStaging ? "Staging and validating..." : "Stage and validate"}
            </button>
          </form>
          {version && (recentImports.data?.length ?? 0) > 0 ? (
            <section className={styles.recentImportJobs}>
              <strong>Recent imports for this draft</strong>
              <div>
                {recentImports.data?.map((recentJob) => (
                  <button
                    className={styles.textButton}
                    key={recentJob.id}
                    onClick={() => {
                      setJob(recentJob);
                      const parameters = new URLSearchParams(
                        window.location.search,
                      );
                      parameters.set("importJobId", String(recentJob.id));
                      window.history.replaceState(
                        null,
                        "",
                        `${window.location.pathname}?${parameters.toString()}${window.location.hash}`,
                      );
                    }}
                    type="button"
                  >
                    Import #{recentJob.id} ·{" "}
                    {recentJob.status.replaceAll("_", " ")}
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </section>
        <section className={`${styles.panel} ${styles.importPreviewPanel}`}>
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
              title="No staged import"
              text="Upload one code-free .docx content file and one .xlsx mapping file. Q numbers are joined within each slot and section."
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
                      <th>Difficulty</th>
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
                            <td>{difficultyLabel(row.difficulty)}</td>
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
                              <td colSpan={7}>
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
              <div className={styles.inlineActions}>
                <button
                  className={styles.publishButton}
                  disabled={job.status !== "READY_FOR_REVIEW" || isCommitting}
                  onClick={commit}
                  type="button"
                >
                  <CheckCircle2 size={16} />
                  {isCommitting ? "Importing…" : "Confirm import"}
                </button>
                {job.status === "IMPORTED" && embedded ? (
                  <span className={styles.inlineHelper}>
                    <CheckCircle2 size={15} />
                    Questions imported. Review the blueprint below, then publish
                    this version.
                  </span>
                ) : job.status === "IMPORTED" ? (
                  <button
                    className={styles.primaryButton}
                    onClick={publishAndContinue}
                    type="button"
                  >
                    <Send size={16} />
                    Publish and continue to scheduling
                  </button>
                ) : null}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

const SchedulePanel = ({
  organizationId,
  organizationSelector,
  templates,
  exams,
  report,
}: {
  organizationId?: number;
  organizationSelector?: ReactNode;
  templates: ExamTemplateListItem[];
  exams: ScheduledExam[];
  report: Report;
}) => {
  const [sessionId, setSessionId] = useState(0);
  const [templateId, setTemplateId] = useState(0);
  const [versionId, setVersionId] = useState(0);
  const [courseIds, setCourseIds] = useState<number[]>([]);
  const [folderId, setFolderId] = useState(0);
  const [availableFrom, setAvailableFrom] = useState<Date | null>(null);
  const [availableUntil, setAvailableUntil] = useState<Date | null>(null);
  const [selectedSlotIds, setSelectedSlotIds] = useState<number[] | null>(null);
  const [resultReleaseMode, setResultReleaseMode] = useState<
    "IMMEDIATE" | "SCHEDULED" | "MANUAL"
  >("IMMEDIATE");
  const [resultPublishAt, setResultPublishAt] = useState<Date | null>(null);
  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search);
    const requestedTemplateId = Number(parameters.get("templateId"));
    queueMicrotask(() => {
      if (Number.isInteger(requestedTemplateId) && requestedTemplateId > 0)
        setTemplateId(requestedTemplateId);
    });
  }, []);
  const sessions = useQuery({
    queryKey: ["exam-sessions", organizationId],
    queryFn: () =>
      sessionsApi.findAll(organizationId!, { page: 1, limit: 100 }),
    enabled: Boolean(organizationId),
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
  const effectiveSelectedSlotIds =
    selectedSlotIds ?? version?.slots.map((slot) => slot.id) ?? [];
  const create = (form: FormData) => {
    if (!organizationId || !version) return;
    report(
      examsApi.scheduled.create({
        organizationId,
        sessionId,
        examTemplateVersionId: version.id,
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
        passingPercentage: form.get("passingPercentage")
          ? Number(form.get("passingPercentage"))
          : undefined,
        autoSubmitOnTimeout: form.get("autoSubmitOnTimeout") === "on",
        allowResume: form.get("allowResume") === "on",
        resultReleaseMode,
        resultPublishAt:
          resultReleaseMode === "SCHEDULED" && resultPublishAt
            ? resultPublishAt.toISOString()
            : undefined,
        showScore: form.get("showScore") === "on",
        showCorrectAnswers: form.get("showCorrectAnswers") === "on",
        showExplanations: form.get("showExplanations") === "on",
        showQuestionReview: form.get("showQuestionReview") === "on",
        status: "SCHEDULED",
        selectedSlotIds: effectiveSelectedSlotIds,
        sessionCourseIds: courseIds,
        resourceFolderId: folderId || undefined,
      }),
      "Exam scheduled and linked as Resource Type 3",
    );
  };
  return (
    <div className={styles.scheduleExamsManagement}>
      <section className={styles.scheduleHeroGrid}>
        <div className={styles.scheduleHeroCard}>
          <div>
            <p>Assessment Management</p>
            <h1>Schedule Exams</h1>
            <span>
              Set exam windows, timing, attempts, and result releases with
              complete control.
            </span>
          </div>
          <img
            alt=""
            aria-hidden="true"
            src="/exam-schedule-assets/schedule-calendar-illustration.png"
          />
        </div>
        <div className={styles.scheduledCountCard}>
          <img
            alt=""
            aria-hidden="true"
            src="/exam-schedule-assets/scheduled-exams-calendar-icon.png"
          />
          <strong>{exams.length}</strong>
          <p>Scheduled exams</p>
        </div>
        <div className={styles.scheduleInsightsCard}>
          <p>Schedule Insights</p>
          <h2>
            <CheckCircle2 aria-hidden="true" size={27} />
            Exam windows on track
          </h2>
          <div>
            <span>
              <CheckCircle2 aria-hidden="true" size={15} />
              {exams.length} Active windows
            </span>
            <span>
              <CheckCircle2 aria-hidden="true" size={15} />
              Results release ready
            </span>
          </div>
        </div>
      </section>

      <div className={styles.scheduleWorkspace}>
        <section className={`${styles.panel} ${styles.scheduleFormPanel}`}>
          <div className={styles.panelTitle}>
            <div>
              <h2>Schedule an exam</h2>
              <p>
                Availability, overall time, slot time, section time, and
                attempts are enforced independently.
              </p>
            </div>
            <CalendarClock />
          </div>
          <form action={create} className={styles.form}>
            {organizationSelector}
            <div className={styles.rowFields}>
              <label>
                Exam title
                <input name="title" required placeholder="CUET Mock Test 02" />
              </label>
            </div>
            <CrudSelectField
              label="Published template"
              onChange={(value) => {
                setTemplateId(Number(value));
                setVersionId(0);
                setSelectedSlotIds(null);
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
              onChange={(value) => {
                setVersionId(Number(value));
                setSelectedSlotIds(null);
              }}
              options={publishedVersions.map((publishedVersion) => ({
                label: `Version ${publishedVersion.versionNumber} - Published`,
                value: String(publishedVersion.id),
              }))}
              placeholder="Choose version"
              value={version ? String(version.id) : ""}
            />
            {version?.slots.length ? (
              <fieldset className={styles.slotSelection}>
                <legend>Slots included in this exam</legend>
                {version.slots.map((slot) => (
                  <label key={slot.id}>
                    <input
                      checked={effectiveSelectedSlotIds.includes(slot.id)}
                      onChange={(event) =>
                        setSelectedSlotIds((current) =>
                          event.target.checked
                            ? [
                                ...(current ?? effectiveSelectedSlotIds),
                                slot.id,
                              ].filter(
                                (id, index, values) =>
                                  values.indexOf(id) === index,
                              )
                            : (current ?? effectiveSelectedSlotIds).filter(
                                (id) => id !== slot.id,
                              ),
                        )
                      }
                      type="checkbox"
                    />
                    <span>{slot.name}</span>
                    <small>{slot.durationMinutes} min</small>
                  </label>
                ))}
              </fieldset>
            ) : null}
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
              <label>
                Passing percentage
                <input
                  name="passingPercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Optional"
                />
              </label>
            </div>
            <section className={styles.templatePolicyCard}>
              <CrudSelect
                ariaLabel="Result release"
                label="Result release"
                onChange={(value) =>
                  setResultReleaseMode(
                    value as "IMMEDIATE" | "SCHEDULED" | "MANUAL",
                  )
                }
                options={[
                  {
                    label: "Immediately after submission",
                    value: "IMMEDIATE",
                  },
                  { label: "At a scheduled time", value: "SCHEDULED" },
                  { label: "Release manually", value: "MANUAL" },
                ]}
                value={resultReleaseMode}
                width="100%"
              />
              {resultReleaseMode === "SCHEDULED" ? (
                <CrudDateTimePicker
                  label="Publish results at"
                  minDate={availableFrom}
                  name="resultPublishAt"
                  onChange={setResultPublishAt}
                  placeholder="Choose result release date and time"
                  required
                  value={resultPublishAt}
                />
              ) : null}
              <div className={styles.policyChecks}>
                <label>
                  <input
                    defaultChecked
                    name="autoSubmitOnTimeout"
                    type="checkbox"
                  />
                  Auto-submit on timeout
                </label>
                <label>
                  <input defaultChecked name="allowResume" type="checkbox" />
                  Allow resume
                </label>
                <label>
                  <input defaultChecked name="showScore" type="checkbox" />
                  Show score
                </label>
                <label>
                  <input name="showQuestionReview" type="checkbox" />
                  Show question review
                </label>
                <label>
                  <input name="showCorrectAnswers" type="checkbox" />
                  Show correct answers
                </label>
                <label>
                  <input name="showExplanations" type="checkbox" />
                  Show explanations
                </label>
              </div>
            </section>
            <label>
              Instructions
              <textarea name="instructions" rows={3} />
            </label>
            <button
              className={styles.primaryButton}
              disabled={
                !organizationId ||
                !version ||
                !courseIds.length ||
                !effectiveSelectedSlotIds.length
              }
            >
              <CalendarClock size={16} />
              Schedule exam
            </button>
          </form>
        </section>
        <section className={`${styles.panel} ${styles.scheduledExamPanel}`}>
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
                <Link
                  className={styles.secondaryButton}
                  href={`/admin/exams/${exam.id}/questions`}
                >
                  <Eye size={15} />
                  View questions
                </Link>
                {exam.resultReleaseMode === "MANUAL" &&
                !exam.resultsReleasedAt ? (
                  <button
                    className={styles.secondaryButton}
                    onClick={() =>
                      report(
                        examsApi.scheduled.releaseResults(exam.id),
                        `Results released for ${exam.title}`,
                      )
                    }
                    type="button"
                  >
                    Release results
                  </button>
                ) : null}
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
    </div>
  );
};

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
