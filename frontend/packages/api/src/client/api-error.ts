interface ApiErrorResponseBody {
  error?: unknown;
  message?: unknown;
}

const DEFAULT_API_ERROR_MESSAGE = "Something went wrong. Please try again.";

export function getApiErrorMessage(
  error: unknown,
  fallback = DEFAULT_API_ERROR_MESSAGE,
) {
  const responseMessage = readResponseMessage(error);
  if (responseMessage) return responseMessage;

  if (error instanceof Error) {
    const message = error.message.trim();
    if (message && !isTransportErrorMessage(message)) return message;
  }

  return fallback;
}

function readResponseMessage(error: unknown) {
  if (!isRecord(error) || !isRecord(error.response)) return undefined;

  const data = error.response.data;
  if (!isRecord(data)) return undefined;

  const body = data as ApiErrorResponseBody;
  return normalizeMessage(body.message) ?? normalizeError(body.error);
}

function normalizeError(error: unknown) {
  if (isRecord(error)) return normalizeMessage(error.message);
  return normalizeMessage(error);
}

function normalizeMessage(message: unknown) {
  if (typeof message === "string") {
    const normalized = message.trim();
    return normalized || undefined;
  }

  if (Array.isArray(message)) {
    const normalized = message
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
      .join(" ");

    return normalized || undefined;
  }

  return undefined;
}

function isTransportErrorMessage(message: string) {
  return (
    /^request failed with status code\s+\d+$/i.test(message) ||
    /^network error$/i.test(message) ||
    /^timeout of \d+ms exceeded$/i.test(message)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
