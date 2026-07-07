import { AxiosError } from "axios";

interface ErrorResponseBody {
  error?: unknown;
  message?: unknown;
  statusCode?: unknown;
}

export function getAuthErrorMessage(error: unknown) {
  if (isAxiosErrorWithResponse(error)) {
    const status = error.response?.status;
    const data = error.response?.data;
    const message = normalizeMessage(data?.message);

    if (message) {
      return message;
    }

    if (status === 401) {
      return "Your session has expired. Please login again.";
    }

    if (status === 403) {
      return "You do not have permission to perform this action.";
    }

    const fallback = normalizeMessage(data?.error);

    if (fallback) {
      return fallback;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function isAxiosErrorWithResponse(
  error: unknown
): error is AxiosError<ErrorResponseBody> {
  return (
    error instanceof AxiosError &&
    Boolean(error.response)
  );
}

function normalizeMessage(message: unknown) {
  if (typeof message === "string") {
    return message;
  }

  if (Array.isArray(message)) {
    return message
      .filter((item): item is string =>
        typeof item === "string"
      )
      .join(", ");
  }

  return undefined;
}
