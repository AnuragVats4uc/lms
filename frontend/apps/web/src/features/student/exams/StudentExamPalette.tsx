"use client";

import { useState } from "react";
import {
  Bookmark,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleX,
  FileQuestion,
  LockKeyhole,
} from "lucide-react";

import styles from "./StudentExamAttemptPage.module.css";
import {
  draftFromQuestion,
  draftHasAnswer,
  type QuestionDraft,
  type SectionGroup,
} from "./studentExamAttempt.types";

type StudentExamPaletteProps = {
  currentIndex: number;
  currentQuestionId: number;
  drafts: Record<number, QuestionDraft>;
  groups: SectionGroup[];
  sequential: boolean;
  onNavigate: (index: number) => void;
};

export function StudentExamPalette({
  currentIndex,
  currentQuestionId,
  drafts,
  groups,
  sequential,
  onNavigate,
}: StudentExamPaletteProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const questions = groups.flatMap((group) => group.questions);
  const answered = questions.filter(({ question }) =>
    draftHasAnswer(drafts[question.id] ?? draftFromQuestion(question)),
  ).length;
  const marked = questions.filter(
    ({ question }) =>
      (drafts[question.id] ?? draftFromQuestion(question)).markedForReview,
  ).length;

  return (
    <aside className={styles.palettePanel} aria-label="Question palette">
      <h2>Question Palette</h2>
      <div className={styles.paletteLegend}>
        <LegendItem label="Answered" tone="answered" />
        <LegendItem label="Review" tone="review" />
        <LegendItem label="Marked" tone="marked" />
        <LegendItem label="Not Visited" tone="unvisited" />
        <LegendItem label="Current" tone="current" />
      </div>

      <div className={styles.paletteSections}>
        {groups.map((group) => {
          const containsCurrentQuestion = group.questions.some(
            ({ question }) => question.id === currentQuestionId,
          );
          const isCollapsed = containsCurrentQuestion
            ? false
            : Boolean(collapsed[group.key]);
          return (
            <section className={styles.paletteSection} key={group.key}>
              <button
                aria-expanded={!isCollapsed}
                className={styles.paletteSectionHeader}
                onClick={() =>
                  setCollapsed((current) => ({
                    ...current,
                    [group.key]: !isCollapsed,
                  }))
                }
                type="button"
              >
                <span>
                  Section {group.position}: {group.section.name}
                </span>
                {group.locked ? (
                  <LockKeyhole aria-label="Section locked" size={15} />
                ) : isCollapsed ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronUp size={16} />
                )}
              </button>
              {!isCollapsed ? (
                <div className={styles.paletteGrid}>
                  {group.questions.map(({ globalIndex, question }) => {
                    const draft =
                      drafts[question.id] ?? draftFromQuestion(question);
                    const state = paletteState(
                      question.id === currentQuestionId,
                      draft,
                      question.state.visited,
                    );
                    const sequentiallyLocked =
                      sequential &&
                      globalIndex !== currentIndex &&
                      globalIndex !== currentIndex + 1;
                    return (
                      <button
                        aria-current={
                          question.id === currentQuestionId ? "step" : undefined
                        }
                        aria-label={`Question ${question.order}, ${state}`}
                        className={`${styles.paletteQuestion} ${styles[state]}`}
                        disabled={group.locked || sequentiallyLocked}
                        key={question.id}
                        onClick={() => onNavigate(globalIndex)}
                        type="button"
                      >
                        {question.order}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      <div className={styles.paletteSummary}>
        <SummaryItem
          icon={FileQuestion}
          label="Total"
          tone="totalTone"
          value={questions.length}
        />
        <SummaryItem
          icon={CheckCircle2}
          label="Answered"
          tone="answeredTone"
          value={answered}
        />
        <SummaryItem
          icon={Bookmark}
          label="Marked"
          tone="markedTone"
          value={marked}
        />
        <SummaryItem
          icon={CircleX}
          label="Unanswered"
          tone="unansweredTone"
          value={questions.length - answered}
        />
      </div>
    </aside>
  );
}

function LegendItem({
  label,
  tone,
}: {
  label: string;
  tone: "answered" | "review" | "marked" | "unvisited" | "current";
}) {
  return (
    <span>
      <i className={styles[tone]} aria-hidden="true" /> {label}
    </span>
  );
}

function SummaryItem({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: typeof FileQuestion;
  label: string;
  tone: "totalTone" | "answeredTone" | "markedTone" | "unansweredTone";
  value: number;
}) {
  return (
    <div className={styles[tone]}>
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function paletteState(
  current: boolean,
  draft: QuestionDraft,
  visited: boolean,
) {
  if (current) return "current";
  if (draft.markedForReview && draftHasAnswer(draft)) return "review";
  if (draft.markedForReview) return "marked";
  if (draftHasAnswer(draft)) return "answered";
  if (visited) return "visited";
  return "unvisited";
}
