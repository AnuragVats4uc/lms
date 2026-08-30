"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
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
import { StudentExamTimeoutDialog } from "./StudentExamTimeoutDialog";
import {
  StudentExamSubmissionDialog,
  type ExamSubmissionSummary,
} from "./StudentExamSubmissionDialog";
import {
  attainableMaximumMarks,
  draftFromQuestion,
  draftHasAnswer,
  parseNumericDraft,
  type QuestionDraft,
  type SaveState,
  type SectionGroup,
} from "./studentExamAttempt.types";

const subscribeToNetworkStatus = (onStoreChange: () => void) => {
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);
  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
};

const readNetworkStatus = () => window.navigator.onLine;
const readServerNetworkStatus = () => true;

export function StudentExamAttemptPage({
  attemptId,
  attemptUuid,
}: {
  attemptId: number;
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
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [timedOutLocally, setTimedOutLocally] = useState(false);
  const [timeoutError, setTimeoutError] = useState<string | null>(null);
  const isOnline = useSyncExternalStore(
    subscribeToNetworkStatus,
    readNetworkStatus,
    readServerNetworkStatus,
  );
  const enteredAt = useRef<number | null>(null);
  const handledTimeout = useRef<string | null>(null);
  const restoredPosition = useRef(false);
  const draftVersions = useRef<Record<number, number>>({});
  const saveQueue = useRef<Promise<boolean>>(Promise.resolve(true));

  const query = useQuery({
    queryKey: ["student-exam-attempt", attemptId, attemptUuid],
    queryFn: () => studentsApi.findMyExamAttempt(attemptId, attemptUuid),
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
    mutationFn: () => studentsApi.submitMyExam(attemptId, attemptUuid),
    onSuccess: () =>
      router.replace(
        `/student/exam-attempts/${attemptId}/${attemptUuid}/report`,
      ),
  });

  const timeoutMutation = useMutation({
    mutationFn: () =>
      studentsApi.continueMyExamAfterTimeout(attemptId, attemptUuid),
    onMutate: () => setTimeoutError(null),
    onSuccess: (result) => {
      if (!("questions" in result)) {
        router.replace(
          `/student/exam-attempts/${attemptId}/${attemptUuid}/report`,
        );
        return;
      }
      queryClient.setQueryData(
        ["student-exam-attempt", attemptId, attemptUuid],
        result,
      );
      const nextIndex = result.currentQuestionId
        ? result.questions.findIndex(
            (item) => item.id === result.currentQuestionId,
          )
        : 0;
      setIndex(nextIndex >= 0 ? nextIndex : 0);
      setLastSavedAt(result.lastSavedAt);
      setTimedOutLocally(false);
      handledTimeout.current = null;
    },
    onError: () => {
      setTimeoutError(
        "The timeout could not be processed. Check your connection and try again.",
      );
    },
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
      .updateMyExamProgress(attemptId, attemptUuid, {
        attemptQuestionId: questionId,
      })
      .then((result) => {
        setLastSavedAt(result.savedAt);
        void queryClient.invalidateQueries({
          queryKey: ["student-exam-attempt", attemptId, attemptUuid],
        });
      })
      .catch(() => undefined);
  }, [attemptId, attemptUuid, questionId, queryClient]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  useEffect(() => {
    const examUrl = window.location.href;
    let leaving = false;
    window.history.pushState({ examNavigationGuard: true }, "", examUrl);
    const guardBackNavigation = () => {
      if (leaving) return;
      if (
        window.confirm(
          "Leave this exam? Saved answers will remain available when you resume.",
        )
      ) {
        leaving = true;
        window.history.back();
        return;
      }
      window.history.pushState({ examNavigationGuard: true }, "", examUrl);
    };
    window.addEventListener("popstate", guardBackNavigation);
    return () => window.removeEventListener("popstate", guardBackNavigation);
  }, []);

  const persistQuestion = useCallback(
    (
      targetQuestion: StudentExamAttemptQuestion,
      targetDraft: QuestionDraft,
      draftVersion: number,
    ) => {
      const numericAnswer = parseNumericDraft(targetDraft.numericAnswer);
      if (
        targetQuestion.questionType.code === "NUMERIC" &&
        !numericAnswer.valid
      ) {
        setSaveState("error");
        setSaveErrorMessage(
          "Enter a valid number with no more than 6 decimal places.",
        );
        return Promise.resolve(false);
      }
      const save = saveQueue.current
        .catch(() => false)
        .then(async () => {
          setSaveState("saving");
          setSaveErrorMessage(null);
          try {
            const result = await studentsApi.saveMyExamAnswer(
              attemptId,
              attemptUuid,
              targetQuestion.id,
              {
                selectedOptionIds: targetDraft.selectedOptionIds,
                textAnswer: targetDraft.textAnswer.trim() || null,
                numericAnswer:
                  targetQuestion.questionType.code === "NUMERIC"
                    ? numericAnswer.value
                    : null,
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
              queryKey: ["student-exam-attempt", attemptId, attemptUuid],
            });
            return true;
          } catch {
            setSaveState("error");
            setSaveErrorMessage(
              "Your answer could not be saved. Check your connection and try again.",
            );
            return false;
          }
        });
      saveQueue.current = save;
      return save;
    },
    [attemptId, attemptUuid, queryClient],
  );

  useEffect(() => {
    const retryDirtyAnswers = () => {
      if (!attempt) return;
      for (const targetQuestion of attempt.questions) {
        if (!dirtyQuestions[targetQuestion.id]) continue;
        const targetDraft = drafts[targetQuestion.id];
        if (!targetDraft) continue;
        void persistQuestion(
          targetQuestion,
          targetDraft,
          draftVersions.current[targetQuestion.id] ?? 0,
        );
      }
      void query.refetch();
    };
    window.addEventListener("online", retryDirtyAnswers);
    return () => window.removeEventListener("online", retryDirtyAnswers);
  }, [attempt, dirtyQuestions, drafts, persistQuestion, query]);

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
  const effectiveTimer = attempt
    ? [
        {
          autoSubmitOnTimeout: attempt.autoSubmitOnTimeout,
          deadline: new Date(attempt.expiresAt).getTime(),
          key: `EXAM:${attempt.expiresAt}`,
        },
        ...(activeSlot?.expiresAt
          ? [
              {
                autoSubmitOnTimeout: activeSlot.autoSubmitOnTimeout,
                deadline: new Date(activeSlot.expiresAt).getTime(),
                key: `SLOT:${activeSlot.id}:${activeSlot.expiresAt}`,
              },
            ]
          : []),
        ...(activeSection?.expiresAt
          ? [
              {
                autoSubmitOnTimeout: activeSection.autoSubmitOnTimeout,
                deadline: new Date(activeSection.expiresAt).getTime(),
                key: `SECTION:${activeSection.id}:${activeSection.expiresAt}`,
              },
            ]
          : []),
      ].sort((left, right) => left.deadline - right.deadline)[0]
    : null;

  useEffect(() => {
    if (!effectiveTimer || handledTimeout.current === effectiveTimer.key)
      return;
    let deadlineTimer: number | undefined;
    const handleTimeout = () => {
      if (handledTimeout.current === effectiveTimer.key) return;
      handledTimeout.current = effectiveTimer.key;
      setTimedOutLocally(true);
      if (effectiveTimer.autoSubmitOnTimeout) {
        timeoutMutation.mutate();
      } else {
        void query.refetch();
      }
    };
    const evaluationTimer = window.setTimeout(() => {
      const remaining =
        effectiveTimer.deadline - (Date.now() + serverOffsetMs);
      if (remaining <= 0) {
        handleTimeout();
        return;
      }
      deadlineTimer = window.setTimeout(
        handleTimeout,
        Math.min(remaining + 250, 2_147_000_000),
      );
    }, 0);
    return () => {
      window.clearTimeout(evaluationTimer);
      if (deadlineTimer !== undefined) window.clearTimeout(deadlineTimer);
    };
  }, [effectiveTimer, query, serverOffsetMs, timeoutMutation]);

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
            router.replace(
              `/student/exam-attempts/${attemptId}/${attemptUuid}/report`,
            )
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
  const sectionMarks = attainableMaximumMarks(
    currentGroup.questions.map((item) => Number(item.question.marks)),
    currentGroup.section.questionsToAttempt,
  );
  const maximumMarks = groups.reduce(
    (total, group) =>
      total +
      attainableMaximumMarks(
        group.questions.map((item) => Number(item.question.marks)),
        group.section.questionsToAttempt,
      ),
    0,
  );
  const previousGroup = groups.find((group) =>
    group.questions.some((item) => item.globalIndex === index - 1),
  );
  const canGoBack =
    index > 0 &&
    currentGroup.section.navigationMode !== "SEQUENTIAL" &&
    currentGroup.slot.navigationMode !== "SEQUENTIAL" &&
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
      {!isOnline ? (
        <div className={styles.networkBanner} role="status">
          <AlertTriangle size={16} /> You are offline. Unsaved changes will be
          retried automatically when the connection returns.
        </div>
      ) : null}

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
          saveErrorMessage={saveErrorMessage}
          sectionAnswered={sectionAnswered}
          sectionMarks={sectionMarks}
        />
        <StudentExamPalette
          currentIndex={index}
          currentQuestionId={question.id}
          drafts={drafts}
          groups={groups}
          onNavigate={(targetIndex) => void navigateTo(targetIndex)}
          sequential={
            currentGroup.section.navigationMode === "SEQUENTIAL" ||
            currentGroup.slot.navigationMode === "SEQUENTIAL"
          }
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
      {attempt.timeoutState || timedOutLocally ? (
        <StudentExamTimeoutDialog
          error={timeoutError}
          message={
            attempt.timeoutState?.message ??
            "The current timer has reached zero. Processing the saved attempt state."
          }
          onContinue={() => timeoutMutation.mutate()}
          resolving={timeoutMutation.isPending}
          scope={
            attempt.timeoutState?.scope ??
            effectiveTimerScope(effectiveTimer?.key)
          }
        />
      ) : null}
    </main>
  );
}

function effectiveTimerScope(key?: string) {
  if (key?.startsWith("SLOT:")) return "SLOT" as const;
  if (key?.startsWith("SECTION:")) return "SECTION" as const;
  return "EXAM" as const;
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
