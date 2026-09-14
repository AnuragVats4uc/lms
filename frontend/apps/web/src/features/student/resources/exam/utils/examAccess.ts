import type { StudentExamActionReason } from "@repo/types";

export function unavailableActionLabel(reason: StudentExamActionReason) {
  if (reason === "EXAM_UPCOMING") return "Exam starts later";
  if (reason === "EXAM_ENDED") return "Exam ended";
  if (reason === "ATTEMPT_LIMIT_EXHAUSTED") return "Attempts exhausted";
  return "View access details";
}

export function readExamApiError(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response
  ) {
    const data = error.response.data as { message?: string | string[] };
    if (Array.isArray(data.message)) return data.message.join(" ");
    if (typeof data.message === "string") return data.message;
  }
  return "The exam could not be started because its availability changed. Refresh the page and review the current status.";
}
