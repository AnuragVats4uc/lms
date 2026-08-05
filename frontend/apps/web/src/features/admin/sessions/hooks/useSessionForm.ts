"use client";

import { useCallback, useState } from "react";
import type {
  CreateSessionRequest,
  Session,
  UpdateSessionRequest,
} from "@repo/types";

import { useSessionStore } from "../store";
import type { SessionFormState, SessionToastState } from "../types";
import { sessionSchema } from "@repo/validation";

export const DEFAULT_SESSION_FORM: SessionFormState = {
  code: "",
  description: "",
  endDate: "",
  name: "",
  startDate: "",
  status: "UPCOMING",
};

function toInputDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toForm(session: Session): SessionFormState {
  return {
    code: session.code ?? "",
    description: session.description ?? "",
    endDate: toInputDate(session.endDate),
    name: session.name,
    startDate: toInputDate(session.startDate),
    status: session.status,
  };
}

function toPayload(form: SessionFormState): CreateSessionRequest {
  const payload: CreateSessionRequest = {
    endDate: new Date(form.endDate).toISOString(),
    name: form.name.trim(),
    startDate: new Date(form.startDate).toISOString(),
    status: form.status,
  };
  if (form.code.trim()) payload.code = form.code.trim().toUpperCase();
  if (form.description.trim()) payload.description = form.description.trim();
  return payload;
}

export function useSessionForm({
  createSession,
  isCreating,
  isUpdating,
  refetch,
  showToast,
  updateSession,
}: {
  createSession: (payload: CreateSessionRequest) => Promise<Session>;
  isCreating: boolean;
  isUpdating: boolean;
  refetch: () => Promise<unknown>;
  showToast: (toast: Omit<SessionToastState, "id">) => void;
  updateSession: (input: {
    sessionId: number;
    payload: UpdateSessionRequest;
  }) => Promise<Session>;
}) {
  const {
    editingSession,
    isAddModalOpen,
    setAddModalOpen,
    setEditingSession,
    setSelectedSession,
  } = useSessionStore();
  const [addForm, setAddForm] = useState(DEFAULT_SESSION_FORM);
  const [editForm, setEditForm] = useState(DEFAULT_SESSION_FORM);
  const [addFormError, setAddFormError] = useState<string | null>(null);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  const openAddSession = useCallback(() => {
    setAddForm(DEFAULT_SESSION_FORM);
    setAddFormError(null);
    setAddModalOpen(true);
  }, [setAddModalOpen]);
  const closeAddSession = useCallback(() => {
    if (!isCreating) {
      setAddModalOpen(false);
      setAddFormError(null);
    }
  }, [isCreating, setAddModalOpen]);
  const submitAddSession = useCallback(
    async (values: SessionFormState) => {
      const parsed = sessionSchema.safeParse(values);
      if (!parsed.success) {
        const error =
          parsed.error.issues[0]?.message ?? "Enter valid session details.";
        setAddFormError(error);
        showToast({ message: error, title: "Invalid session", tone: "error" });
        return;
      }
      try {
        const session = await createSession(toPayload(values));
        setAddModalOpen(false);
        setSelectedSession(session);
        showToast({
          message: `${session.name} has been created successfully.`,
          title: "Session created",
          tone: "success",
        });
        await refetch();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "The session could not be created.";
        setAddFormError(message);
        showToast({ message, title: "Create failed", tone: "error" });
      }
    },
    [createSession, refetch, setAddModalOpen, setSelectedSession, showToast],
  );

  const openEditSession = useCallback(
    (session: Session) => {
      setEditingSession(session);
      setEditForm(toForm(session));
      setEditFormError(null);
    },
    [setEditingSession],
  );
  const closeEditSession = useCallback(() => {
    if (!isUpdating) {
      setEditingSession(null);
      setEditFormError(null);
    }
  }, [isUpdating, setEditingSession]);
  const submitEditSession = useCallback(
    async (values: SessionFormState) => {
      if (!editingSession) return;
      const parsed = sessionSchema.safeParse(values);
      if (!parsed.success) {
        const error =
          parsed.error.issues[0]?.message ?? "Enter valid session details.";
        setEditFormError(error);
        showToast({ message: error, title: "Invalid session", tone: "error" });
        return;
      }
      try {
        const session = await updateSession({
          sessionId: editingSession.id,
          payload: toPayload(values),
        });
        setEditingSession(null);
        setSelectedSession(session);
        showToast({
          message: `${session.name} has been updated successfully.`,
          title: "Session updated",
          tone: "success",
        });
        await refetch();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "The session could not be updated.";
        setEditFormError(message);
        showToast({ message, title: "Update failed", tone: "error" });
      }
    },
    [
      editingSession,
      refetch,
      setEditingSession,
      setSelectedSession,
      showToast,
      updateSession,
    ],
  );

  return {
    addForm,
    addFormError,
    closeAddSession,
    closeEditSession,
    editForm,
    editFormError,
    editingSession,
    isAddModalOpen,
    isCreating,
    isUpdating,
    openAddSession,
    openEditSession,
    submitAddSession,
    submitEditSession,
  };
}
