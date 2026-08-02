"use client";

import { useCallback, useState, type FormEvent } from "react";
import type { CreateSessionRequest, Session, UpdateSessionRequest } from "@repo/types";

import { useSessionStore } from "../store";
import type { SessionFormState, SessionToastState } from "../types";

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

function validate(form: SessionFormState) {
  if (!form.name.trim() || form.name.trim().length < 3) {
    return "Session name must be at least 3 characters.";
  }
  if (!form.startDate || !form.endDate) return "Start and end dates are required.";
  if (new Date(form.startDate) >= new Date(form.endDate)) {
    return "The start date must be before the end date.";
  }
  return null;
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
  updateSession: (input: { sessionId: number; payload: UpdateSessionRequest }) => Promise<Session>;
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
  const updateAddForm = useCallback(<K extends keyof SessionFormState>(key: K, value: SessionFormState[K]) => {
    setAddForm((current) => ({ ...current, [key]: value }));
    setAddFormError(null);
  }, []);
  const submitAddSession = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const error = validate(addForm);
    if (error) {
      setAddFormError(error);
      showToast({ message: error, title: "Invalid session", tone: "error" });
      return;
    }
    try {
      const session = await createSession(toPayload(addForm));
      setAddModalOpen(false);
      setSelectedSession(session);
      showToast({ message: `${session.name} has been created successfully.`, title: "Session created", tone: "success" });
      await refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : "The session could not be created.";
      setAddFormError(message);
      showToast({ message, title: "Create failed", tone: "error" });
    }
  }, [addForm, createSession, refetch, setAddModalOpen, setSelectedSession, showToast]);

  const openEditSession = useCallback((session: Session) => {
    setEditingSession(session);
    setEditForm(toForm(session));
    setEditFormError(null);
  }, [setEditingSession]);
  const closeEditSession = useCallback(() => {
    if (!isUpdating) {
      setEditingSession(null);
      setEditFormError(null);
    }
  }, [isUpdating, setEditingSession]);
  const updateEditForm = useCallback(<K extends keyof SessionFormState>(key: K, value: SessionFormState[K]) => {
    setEditForm((current) => ({ ...current, [key]: value }));
    setEditFormError(null);
  }, []);
  const submitEditSession = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingSession) return;
    const error = validate(editForm);
    if (error) {
      setEditFormError(error);
      showToast({ message: error, title: "Invalid session", tone: "error" });
      return;
    }
    try {
      const session = await updateSession({ sessionId: editingSession.id, payload: toPayload(editForm) });
      setEditingSession(null);
      setSelectedSession(session);
      showToast({ message: `${session.name} has been updated successfully.`, title: "Session updated", tone: "success" });
      await refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : "The session could not be updated.";
      setEditFormError(message);
      showToast({ message, title: "Update failed", tone: "error" });
    }
  }, [editForm, editingSession, refetch, setEditingSession, setSelectedSession, showToast, updateSession]);

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
    updateAddForm,
    updateEditForm,
  };
}
