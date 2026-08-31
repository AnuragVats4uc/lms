"use client";

import { useEffect, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import {
  BadgeInfo,
  Bookmark,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileQuestion,
  ListChecks,
  Send,
  Star,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import type { StudentExamAttemptQuestion } from "@repo/types";

import styles from "./StudentExamAttemptPage.module.css";
import {
  type QuestionDraft,
  type SaveState,
  type SectionGroup,
} from "./studentExamAttempt.types";

type StudentExamQuestionWorkspaceProps = {
  question: StudentExamAttemptQuestion;
  draft: QuestionDraft;
  group: SectionGroup;
  groups: SectionGroup[];
  questionPosition: number;
  sectionAnswered: number;
  sectionMarks: number;
  canGoBack: boolean;
  isLastQuestion: boolean;
  busy: boolean;
  saveState: SaveState;
  saveErrorMessage: string | null;
  onChange: (draft: QuestionDraft) => void;
  onClear: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  onNavigateSection: (group: SectionGroup) => void;
};

export function StudentExamQuestionWorkspace({
  question,
  draft,
  group,
  groups,
  questionPosition,
  sectionAnswered,
  sectionMarks,
  canGoBack,
  isLastQuestion,
  busy,
  saveState,
  saveErrorMessage,
  onChange,
  onClear,
  onNext,
  onPrevious,
  onSubmit,
  onNavigateSection,
}: StudentExamQuestionWorkspaceProps) {
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const sectionMenuRef = useRef<HTMLDivElement>(null);
  const sectionQuestionLimit =
    group.section.questionsToAttempt ?? group.questions.length;

  useEffect(() => {
    if (!sectionsOpen) return;
    const close = (event: MouseEvent) => {
      if (!sectionMenuRef.current?.contains(event.target as Node)) {
        setSectionsOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [sectionsOpen]);

  return (
    <section className={styles.questionWorkspace}>
      <div className={styles.sectionToolbar}>
        <div className={styles.sectionIdentity}>
          <span aria-hidden="true">
            <FileQuestion size={22} />
          </span>
          <div>
            <small>
              Section {group.position} of {groups.length}
            </small>
            <strong>{group.section.name}</strong>
          </div>
        </div>

        <button
          className={styles.sectionInstructionsButton}
          onClick={() => setInstructionsOpen(true)}
          type="button"
        >
          <BadgeInfo size={17} /> Section Instructions
        </button>

        <div className={styles.sectionMetrics}>
          <Metric
            icon={ListChecks}
            label={`${group.questions.length} Questions`}
          />
          <Metric icon={Star} label={`${formatMarks(sectionMarks)} Marks`} />
          <Metric
            icon={TrendingUp}
            label={`Attempted ${sectionAnswered}/${sectionQuestionLimit}`}
          />
          <div className={styles.sectionMenu} ref={sectionMenuRef}>
            <button
              aria-expanded={sectionsOpen}
              className={styles.sectionMenuTrigger}
              onClick={() => setSectionsOpen((open) => !open)}
              type="button"
            >
              Sections <ChevronDown size={16} />
            </button>
            {sectionsOpen ? (
              <div className={styles.sectionMenuPopover} role="menu">
                {groups.map((item) => {
                  const answered = item.questions.filter(
                    ({ question: itemQuestion }) => itemQuestion.state.answered,
                  ).length;
                  return (
                    <button
                      disabled={item.locked}
                      key={item.key}
                      onClick={() => {
                        setSectionsOpen(false);
                        onNavigateSection(item);
                      }}
                      role="menuitem"
                      type="button"
                    >
                      <span>
                        <strong>Section {item.position}</strong>
                        <small>{item.section.name}</small>
                      </span>
                      <small>
                        {item.locked
                          ? "Locked"
                          : item.section.id === group.section.id
                            ? "Current"
                            : `${answered}/${item.questions.length}`}
                      </small>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <article className={styles.questionCard}>
        <div className={styles.questionHeader}>
          <h2>
            Question {questionPosition} of {group.questions.length}
          </h2>
          <div className={styles.questionHeaderActions}>
            <span
              className={styles.questionDifficulty}
              data-level={question.difficulty}
            >
              {question.difficulty.charAt(0) +
                question.difficulty.slice(1).toLowerCase()}
            </span>
            <span className={styles.positiveMarks}>
              +{Number(question.marks).toFixed(2)}
            </span>
            <span className={styles.negativeMarks}>
              -{Number(question.negativeMarks).toFixed(2)}
            </span>
            {group.section.allowReview ? (
              <button
                aria-pressed={draft.markedForReview}
                className={
                  draft.markedForReview
                    ? styles.reviewActive
                    : styles.reviewButton
                }
                onClick={() =>
                  onChange({
                    ...draft,
                    markedForReview: !draft.markedForReview,
                  })
                }
                type="button"
              >
                <Bookmark size={18} />
                {draft.markedForReview
                  ? "Marked for Review"
                  : "Mark for Review"}
              </button>
            ) : null}
          </div>
        </div>
        <div className={styles.questionDivider} aria-hidden="true">
          <i />
        </div>

        <div className={styles.questionBody}>
          {question.comprehension ? (
            <section className={styles.comprehension}>
              <strong>Passage / Directions</strong>
              <RichContent value={question.comprehension.content} />
            </section>
          ) : null}
          <div className={styles.questionContent}>
            <RichContent value={question.content} />
          </div>
          <AnswerControl
            draft={draft}
            onChange={onChange}
            question={question}
          />
        </div>

        <div className={styles.questionActions}>
          <button
            className={styles.previousButton}
            disabled={!canGoBack || busy}
            onClick={onPrevious}
            type="button"
          >
            <ChevronLeft size={18} /> Previous
          </button>
          <button
            className={styles.clearButton}
            disabled={busy}
            onClick={onClear}
            type="button"
          >
            <Trash2 size={17} /> Clear Answer
          </button>
          <button
            className={styles.nextButton}
            disabled={busy}
            onClick={isLastQuestion ? onSubmit : onNext}
            type="button"
          >
            {busy && saveState === "saving"
              ? "Saving..."
              : isLastQuestion
                ? "Submit Exam"
                : "Save & Next"}
            {isLastQuestion ? <Send size={17} /> : <ChevronRight size={18} />}
          </button>
        </div>
        {saveState === "error" ? (
          <p className={styles.saveError} role="alert">
            {saveErrorMessage ??
              "Your answer could not be saved. Check your connection and try again."}
          </p>
        ) : null}
      </article>

      {instructionsOpen ? (
        <div
          aria-labelledby="section-instructions-title"
          aria-modal="true"
          className={styles.modalBackdrop}
          role="dialog"
        >
          <section className={styles.instructionsDialog}>
            <button
              aria-label="Close section instructions"
              onClick={() => setInstructionsOpen(false)}
              type="button"
            >
              <X size={18} />
            </button>
            <span aria-hidden="true">
              <BadgeInfo size={23} />
            </span>
            <h2 id="section-instructions-title">{group.section.name}</h2>
            <p>
              {group.section.instructions ??
                "Read every question carefully and complete this section within the available time."}
            </p>
            <button
              className={styles.dialogDoneButton}
              onClick={() => setInstructionsOpen(false)}
              type="button"
            >
              Got it
            </button>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function Metric({ icon: Icon, label }: { icon: typeof Star; label: string }) {
  return (
    <span className={styles.metric}>
      <Icon size={17} /> {label}
    </span>
  );
}

function AnswerControl({
  question,
  draft,
  onChange,
}: {
  question: StudentExamAttemptQuestion;
  draft: QuestionDraft;
  onChange: (draft: QuestionDraft) => void;
}) {
  if (question.questionType.code === "SINGLE_CHOICE") {
    return (
      <fieldset className={styles.options}>
        <legend className={styles.srOnly}>Select one answer</legend>
        {question.options.map((option) => {
          const selected = draft.selectedOptionIds.includes(option.id);
          return (
            <label
              className={selected ? styles.optionSelected : styles.option}
              key={option.id}
            >
              <input
                checked={selected}
                name={`question-${question.id}`}
                onChange={() =>
                  onChange({ ...draft, selectedOptionIds: [option.id] })
                }
                type="radio"
              />
              <span className={styles.optionLetter}>{option.code}</span>
              <RichContent value={option.content} />
              {selected ? (
                <span className={styles.optionCheck} aria-hidden="true">
                  <Check size={17} />
                </span>
              ) : null}
            </label>
          );
        })}
      </fieldset>
    );
  }

  const numeric = question.questionType.code === "NUMERIC";
  const value = numeric ? draft.numericAnswer : draft.textAnswer;
  const setValue = (next: string) =>
    onChange({
      ...draft,
      ...(numeric ? { numericAnswer: next } : { textAnswer: next }),
    });
  const keys =
    question.inputPolicy.virtualKeyboardMode === "NUMERIC"
      ? ["7", "8", "9", "4", "5", "6", "1", "2", "3", ".", "0", "-"]
      : question.inputPolicy.virtualKeyboardMode === "ALPHANUMERIC"
        ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("")
        : [];
  const appendKey = (key: string) => {
    if (numeric && key === "-") {
      setValue(value.startsWith("-") ? value.slice(1) : `-${value}`);
      return;
    }
    if (numeric && key === "." && value.includes(".")) return;
    setValue(value + key);
  };

  return (
    <div className={styles.textAnswer}>
      <label htmlFor={`answer-${question.id}`}>Your answer</label>
      <input
        id={`answer-${question.id}`}
        inputMode={numeric ? "decimal" : "text"}
        maxLength={question.inputPolicy.maxAnswerLength ?? undefined}
        onChange={(event) => setValue(event.target.value)}
        onPaste={(event) => {
          if (!question.inputPolicy.allowPaste) event.preventDefault();
        }}
        placeholder={numeric ? "Enter a numeric answer" : "Enter your answer"}
        readOnly={!question.inputPolicy.allowPhysicalKeyboard}
        type="text"
        value={value}
      />
      {keys.length ? (
        <div className={styles.keyboard} aria-label="On-screen keyboard">
          {keys.map((key) => (
            <button key={key} onClick={() => appendKey(key)} type="button">
              {key}
            </button>
          ))}
          <button
            className={styles.keyboardBackspace}
            onClick={() => setValue(value.slice(0, -1))}
            type="button"
          >
            Backspace
          </button>
          <button
            className={styles.keyboardClear}
            onClick={() => setValue("")}
            type="button"
          >
            Clear
          </button>
        </div>
      ) : null}
    </div>
  );
}

function RichContent({ value }: { value: string }) {
  return (
    <div
      className={styles.richContent}
      dangerouslySetInnerHTML={{ __html: value }}
      onErrorCapture={handleRichContentError}
    />
  );
}

function handleRichContentError(event: SyntheticEvent<HTMLDivElement>) {
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

function formatMarks(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
