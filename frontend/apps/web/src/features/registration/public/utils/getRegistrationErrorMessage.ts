export const getRegistrationErrorMessage = (
  error: unknown,
  fallback: string,
) => {
  if (
    typeof error === "object" &&
    error &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response &&
    "data" in error.response
  ) {
    const data = error.response.data as { message?: string | string[] };
    if (Array.isArray(data.message)) return data.message[0] ?? fallback;
    if (data.message) return data.message;
  }

  return fallback;
};
