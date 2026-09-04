const STUDENT_WELCOME_PENDING_KEY = "lms.studentWelcome.pendingFor";

const getSessionStorage = () => {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

export const prepareStudentWelcome = (studentUuid: string) => {
  try {
    getSessionStorage()?.setItem(STUDENT_WELCOME_PENDING_KEY, studentUuid);
  } catch {
    // Storage restrictions must not prevent a successful login.
  }
};

export const clearStudentWelcome = () => {
  try {
    getSessionStorage()?.removeItem(STUDENT_WELCOME_PENDING_KEY);
  } catch {
    // The next route guard still sends authenticated users to their dashboard.
  }
};

export const consumeStudentWelcome = (studentUuid: string) => {
  const storage = getSessionStorage();
  if (!storage) return false;

  try {
    const isPending =
      storage.getItem(STUDENT_WELCOME_PENDING_KEY) === studentUuid;
    storage.removeItem(STUDENT_WELCOME_PENDING_KEY);

    return isPending;
  } catch {
    return false;
  }
};
