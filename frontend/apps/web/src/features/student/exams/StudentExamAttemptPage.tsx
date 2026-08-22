"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { studentsApi } from "@repo/api";
import type {
  StudentExamAttempt,
  StudentExamAttemptQuestion,
} from "@repo/types";
import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw } from "lucide-react";

import styles from "./StudentExamAttemptPage.module.css";
import { ExamHeader, ExamStatusFooter } from "./StudentExamChrome";
import { StudentExamPalette } from "./StudentExamPalette";
import { StudentExamQuestionWorkspace } from "./StudentExamQuestionWorkspace";
import {
  StudentExamSubmissionDialog,
  type ExamSubmissionSummary,
} from "./StudentExamSubmissionDialog";
import {
  draftFromQuestion,
  draftHasAnswer,
  type QuestionDraft,
  type SaveState,
  type SectionGroup,
} from "./studentExamAttempt.types";

export function StudentExamAttemptPage({
  attemptUuid,
}: {
  attemptUuid: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);
  const [drafts, setDrafts] = useState<Record<number, QuestionDraft>>({});
  const [dirtyQuestions, setDirtyQuestions] = useState<Record<number, boolean>>(
    {},
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const enteredAt = useRef<number | null>(null);
  const autoSubmitted = useRef(false);
  const restoredPosition = useRef(false);
  const draftVersions = useRef<Record<number, number>>({});
  const saveQueue = useRef<Promise<boolean>>(Promise.resolve(true));

  const query = useQuery({
    queryKey: ["student-exam-attempt", attemptUuid],
    queryFn: () => studentsApi.findMyExamAttempt(attemptUuid),
    staleTime: 5_000,
    refetchOnWindowFocus: false,
  });
  const attempt =
    query.data && "questions" in query.data
      ? (query.data as StudentExamAttempt)
      : null;
  const question = attempt?.questions[index] ?? null;
  const draft = question
    ? (drafts[question.id] ?? draftFromQuestion(question))
    : null;
  const questionId = question?.id ?? null;

  const submitMutation = useMutation({
    mutationFn: () => studentsApi.submitMyExam(attemptUuid),
    onSuccess: () =>
      router.replace(`/student/exam-attempts/${attemptUuid}/report`),
  });

  useEffect(() => {
    if (!attempt || restoredPosition.current) return;
    const restoredIndex = attempt.currentQuestionId
      ? attempt.questions.findIndex(
          (item) => item.id === attempt.currentQuestionId,
        )
      : -1;
    setIndex(restoredIndex >= 0 ? restoredIndex : 0);
    setLastSavedAt(attempt.lastSavedAt);
    restoredPosition.current = true;
  }, [attempt]);

  useEffect(() => {
    if (!questionId) return;
    enteredAt.current = Date.now();
    void studentsApi
      .updateMyExamProgress(attemptUuid, {
        attemptQuestionId: questionId,
      })
      .then((result) => {
        setLastSavedAt(result.savedAt);
        void queryClient.invalidateQueries({
          queryKey: ["student-exam-attempt", attemptUuid],
        });
      })
      .catch(() => undefined);
  }, [attemptUuid, questionId, queryClient]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const persistQuestion = useCallback(
    (
      targetQuestion: StudentExamAttemptQuestion,
      targetDraft: QuestionDraft,
      draftVersion: number,
    ) => {
      const save = saveQueue.current
        .catch(() => false)
        .then(async () => {
          setSaveState("saving");
          try {
            const result = await studentsApi.saveMyExamAnswer(
              attemptUuid,
              targetQuestion.id,
              {
                selectedOptionIds: targetDraft.selectedOptionIds,
                textAnswer: targetDraft.textAnswer.trim() || null,
                numericAnswer:
                  targetDraft.numericAnswer.trim() === ""
                    ? null
                    : Number(targetDraft.numericAnswer),
                markedForReview: targetDraft.markedForReview,
                timeSpentSeconds: Math.min(
                  300,
                  Math.max(
                    0,
                    Math.floor(
                      (Date.now() - (enteredAt.current ?? Date.now())) / 1_000,
                    ),
                  ),
                ),
              },
            );
            enteredAt.current = Date.now();
            setLastSavedAt(result.savedAt);
            setSaveState("saved");
            if (draftVersions.current[targetQuestion.id] === draftVersion) {
              setDirtyQuestions((current) => ({
                ...current,
                [targetQuestion.id]: false,
              }));
            }
            void queryClient.invalidateQueries({
              queryKey: ["student-exam-attempt", attemptUuid],
            });
            return true;
          } catch {
            setSaveState("error");
            return false;
          }
        });
      saveQueue.current = save;
      return save;
    },
    [attemptUuid, queryClient],
  );

  const changeDraft = useCallback(
    (nextDraft: QuestionDraft) => {
      if (!question) return 0;
      const version = (draftVersions.current[question.id] ?? 0) + 1;
      draftVersions.current[question.id] = version;
      setDrafts((current) => ({ ...current, [question.id]: nextDraft }));
      setDirtyQuestions((current) => ({ ...current, [question.id]: true }));
      return version;
    },
    [question],
  );

  useEffect(() => {
    if (!question || !draft || !dirtyQuestions[question.id]) return;
    const version = draftVersions.current[question.id] ?? 0;
    const timer = window.setTimeout(() => {
      void persistQuestion(question, draft, version);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [dirtyQuestions, draft, persistQuestion, question]);

  const navigateTo = useCallback(
    async (targetIndex: number) => {
      if (!attempt || !question || !draft || targetIndex === index) return;
      const saved = await persistQuestion(
        question,
        draft,
        draftVersions.current[question.id] ?? 0,
      );
      if (!saved) return;
      setIndex(
        Math.max(0, Math.min(targetIndex, attempt.questions.length - 1)),
      );
    },
    [attempt, draft, index, persistQuestion, question],
  );

  const submitExam = useCallback(async () => {
    if (!question || !draft || submitMutation.isPending) return;
    const saved = await persistQuestion(
      question,
      draft,
      draftVersions.current[question.id] ?? 0,
    );
    if (saved) {
      setSubmissionDialogOpen(false);
      submitMutation.mutate();
    }
  }, [draft, persistQuestion, question, submitMutation]);

  const baseGroups = useMemo(() => buildSectionGroups(attempt), [attempt]);
  const currentBaseGroup = question
    ? baseGroups.find((group) =>
        group.questions.some((item) => item.question.id === question.id),
      )
    : undefined;
  const groups = useMemo(
    () =>
      baseGroups.map((group) => ({
        ...group,
        locked: sectionIsLocked(group, currentBaseGroup),
      })),
    [baseGroups, currentBaseGroup],
  );
  const currentGroup = question
    ? groups.find((group) =>
        group.questions.some((item) => item.question.id === question.id),
      )
    : undefined;

  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const serverTime = attempt?.serverTime ?? null;

  useEffect(() => {
    if (!serverTime) return;
    const timer = window.setTimeout(() => {
      setServerOffsetMs(new Date(serverTime).getTime() - Date.now());
    }, 0);
    return () => window.clearTimeout(timer);
  }, [serverTime]);
  const activeSlot = currentGroup?.slot;
  const activeSection = currentGroup?.section;
  const effectiveDeadline = attempt
    ? Math.min(
        new Date(attempt.expiresAt).getTime(),
        ...(activeSlot?.expiresAt
          ? [new Date(activeSlot.expiresAt).getTime()]
          : []),
        ...(activeSection?.expiresAt
          ? [new Date(activeSection.expiresAt).getTime()]
          : []),
      )
    : null;

  useEffect(() => {
    if (!effectiveDeadline || autoSubmitted.current) return;
    const remaining = effectiveDeadline - (Date.now() + serverOffsetMs);
    if (remaining <= 0) {
      autoSubmitted.current = true;
      void submitExam();
      return;
    }
    const timer = window.setTimeout(
      () => {
        if (autoSubmitted.current) return;
        autoSubmitted.current = true;
        void submitExam();
      },
      Math.min(remaining + 250, 2_147_000_000),
    );
    return () => window.clearTimeout(timer);
  }, [effectiveDeadline, serverOffsetMs, submitExam]);

  if (query.isLoading) return <ExamLoading />;
  if (query.isError || !query.data) {
    return (
      <ExamState title="Unable to load this attempt">
        <button onClick={() => query.refetch()} type="button">
          <RefreshCw size={16} /> Retry
        </button>
      </ExamState>
    );
  }
  if (!attempt) {
    return (
      <ExamState title="This attempt has already been submitted">
        <button
          onClick={() =>
            router.replace(`/student/exam-attempts/${attemptUuid}/report`)
          }
          type="button"
        >
          View report
        </button>
      </ExamState>
    );
  }
  if (!question || !draft || !currentGroup) {
    return <ExamState title="No questions are assigned to this exam" />;
  }

  const sectionQuestionPosition =
    currentGroup.questions.findIndex(
      (item) => item.question.id === question.id,
    ) + 1;
  const sectionAnswered = currentGroup.questions.filter(({ question: item }) =>
    draftHasAnswer(drafts[item.id] ?? draftFromQuestion(item)),
  ).length;
  const sectionMarks = currentGroup.questions.reduce(
    (total, item) => total + Number(item.question.marks),
    0,
  );
  const maximumMarks = attempt.questions.reduce(
    (total, item) => total + Number(item.marks),
    0,
  );
  const previousGroup = groups.find((group) =>
    group.questions.some((item) => item.globalIndex === index - 1),
  );
  const canGoBack =
    index > 0 &&
    currentGroup.section.navigationMode !== "SEQUENTIAL" &&
    !previousGroup?.locked;
  const busy = saveState === "saving" || submitMutation.isPending;
  const submissionSummary = attempt.questions.reduce<ExamSubmissionSummary>(
    (summary, item) => {
      const itemDraft = drafts[item.id] ?? draftFromQuestion(item);
      const answered = draftHasAnswer(itemDraft);
      const visited = item.state.visited || item.id === question.id;
      return {
        ...summary,
        answered: summary.answered + (answered ? 1 : 0),
        marked: summary.marked + (itemDraft.markedForReview ? 1 : 0),
        notVisited: summary.notVisited + (visited ? 0 : 1),
        unanswered: summary.unanswered + (answered ? 0 : 1),
      };
    },
    {
      answered: 0,
      attemptNumber: attempt.attemptNumber,
      marked: 0,
      notVisited: 0,
      sections: groups.length,
      title: attempt.title,
      total: attempt.questions.length,
      unanswered: 0,
    },
  );

  const clearAnswer = () => {
    const cleared = {
      ...draft,
      numericAnswer: "",
      selectedOptionIds: [],
      textAnswer: "",
    };
    const version = changeDraft(cleared);
    void persistQuestion(question, cleared, version);
  };

  return (
    <main className={styles.page}>
      <ExamHeader
        attempt={attempt}
        maximumMarks={maximumMarks}
        onSubmit={() => setSubmissionDialogOpen(true)}
        sectionDeadline={activeSection?.expiresAt ?? null}
        serverOffsetMs={serverOffsetMs}
        slotDeadline={activeSlot?.expiresAt ?? null}
        submitting={submitMutation.isPending}
      />

      <div className={styles.examLayout}>
        <StudentExamQuestionWorkspace
          busy={busy}
          canGoBack={canGoBack}
          draft={draft}
          group={currentGroup}
          groups={groups}
          isLastQuestion={index === attempt.questions.length - 1}
          onChange={changeDraft}
          onClear={clearAnswer}
          onNavigateSection={(group) => {
            const firstQuestion = group.questions[0];
            if (firstQuestion) void navigateTo(firstQuestion.globalIndex);
          }}
          onNext={() => void navigateTo(index + 1)}
          onPrevious={() => void navigateTo(index - 1)}
          onSubmit={() => setSubmissionDialogOpen(true)}
          question={question}
          questionPosition={sectionQuestionPosition}
          saveState={saveState}
          sectionAnswered={sectionAnswered}
          sectionMarks={sectionMarks}
        />
        <StudentExamPalette
          currentQuestionId={question.id}
          drafts={drafts}
          groups={groups}
          onNavigate={(targetIndex) => void navigateTo(targetIndex)}
        />
      </div>

      <ExamStatusFooter
        lastSavedAt={lastSavedAt}
        saveState={saveState}
        serverOffsetMs={serverOffsetMs}
      />
      {submitMutation.isError ? (
        <div className={styles.submitError} role="alert">
          The exam could not be submitted. Your saved answers are safe; please
          try again.
        </div>
      ) : null}
      {submissionDialogOpen ? (
        <StudentExamSubmissionDialog
          onCancel={() => setSubmissionDialogOpen(false)}
          onConfirm={() => void submitExam()}
          saveFailed={saveState === "error"}
          submitting={submitMutation.isPending || saveState === "saving"}
          summary={submissionSummary}
        />
      ) : null}
    </main>
  );
}

function buildSectionGroups(attempt: StudentExamAttempt | null) {
  if (!attempt) return [];
  let position = 0;
  return attempt.slots.flatMap((slot) =>
    slot.sections.map((section) => {
      position += 1;
      return {
        key: `${slot.id}-${section.id}`,
        position,
        slot,
        section,
        questions: attempt.questions
          .map((question, globalIndex) => ({ question, globalIndex }))
          .filter(({ question }) => question.sectionAttemptId === section.id),
        locked: false,
      } satisfies SectionGroup;
    }),
  );
}

function sectionIsLocked(
  target: SectionGroup,
  current: SectionGroup | undefined,
) {
  if (!current || target.key === current.key) return false;
  if (target.section.submittedAt || target.slot.submittedAt) return true;
  if (
    target.slot.id !== current.slot.id &&
    current.slot.navigationMode !== "FREE"
  ) {
    return true;
  }
  return current.section.navigationMode !== "FREE";
}

function ExamLoading() {
  return (
    <main className={`${styles.page} ${styles.loadingPage}`}>
      <div className={styles.loadingHeader} />
      <div className={styles.loadingLayout}>
        <div />
        <div />
      </div>
      <div className={styles.loadingFooter} />
    </main>
  );
}

function ExamState({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={styles.state}>
      <AlertTriangle size={34} />
      <strong>{title}</strong>
      {children}
    </div>
  );
}
