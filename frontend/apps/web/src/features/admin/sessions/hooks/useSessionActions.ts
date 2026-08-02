"use client";

import { useCallback, useMemo, useState } from "react";
import type { Session, UpdateSessionRequest } from "@repo/types";

import { useSessionStore } from "../store";
import type { SessionRowActionHandlers, SessionToastState } from "../types";

export function useSessionActions({
  canDelete,
  canUpdate,
  deleteSession,
  isDeleting,
  isUpdating,
  refetch,
  selectedSessions,
  setSelectedRowIds,
  showSelected,
  updateSession,
}: {
  canDelete: boolean;
  canUpdate: boolean;
  deleteSession: (sessionId: number) => Promise<unknown>;
  isDeleting: boolean;
  isUpdating: boolean;
  refetch: () => Promise<unknown>;
  selectedSessions: Session[];
  setSelectedRowIds: (value: Session["id"][]) => void;
  showSelected: (session: Session) => void;
  updateSession: (input: { sessionId: number; payload: UpdateSessionRequest }) => Promise<Session>;
}) {
  const { confirmAction, setConfirmAction } = useSessionStore();
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [toast, setToast] = useState<SessionToastState | null>(null);

  const showToast = useCallback((value: Omit<SessionToastState, "id">) => {
    setToast({ ...value, id: Date.now() });
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);
  const closeConfirmAction = useCallback(() => {
    if (!isDeleting && !isUpdating) {
      setConfirmAction(null);
      setConfirmError(null);
    }
  }, [isDeleting, isUpdating, setConfirmAction]);
  const openDelete = useCallback((session: Session) => {
    setConfirmAction({ kind: "delete", session });
    setConfirmError(null);
  }, [setConfirmAction]);
  const openToggle = useCallback((session: Session) => {
    setConfirmAction({ kind: "toggle", session });
    setConfirmError(null);
  }, [setConfirmAction]);
  const openBulkDelete = useCallback(() => {
    if (selectedSessions.length) {
      setConfirmAction({ kind: "bulk-delete", sessions: selectedSessions });
      setConfirmError(null);
    }
  }, [selectedSessions, setConfirmAction]);

  const confirmSessionAction = useCallback(async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.kind === "delete") {
        await deleteSession(confirmAction.session.id);
        setSelectedRowIds([]);
        showToast({ message: `${confirmAction.session.name} has been deleted.`, title: "Session deleted", tone: "success" });
      } else if (confirmAction.kind === "bulk-delete") {
        await Promise.all(confirmAction.sessions.map((session) => deleteSession(session.id)));
        setSelectedRowIds([]);
        showToast({ message: `${confirmAction.sessions.length} sessions have been deleted.`, title: "Sessions deleted", tone: "success" });
      } else {
        const active = !confirmAction.session.isActive;
        const session = await updateSession({
          sessionId: confirmAction.session.id,
          payload: { isActive: active, status: active ? "ACTIVE" : "ARCHIVED" },
        });
        showSelected(session);
        showToast({ message: `${session.name} is now ${active ? "active" : "archived"}.`, title: "Status updated", tone: "success" });
      }
      setConfirmAction(null);
      setConfirmError(null);
      await refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : "The session action could not be completed.";
      setConfirmError(message);
      showToast({ message, title: "Action failed", tone: "error" });
    }
  }, [confirmAction, deleteSession, refetch, setConfirmAction, setSelectedRowIds, showSelected, showToast, updateSession]);

  const rowActions = useMemo<SessionRowActionHandlers>(() => ({
    onDelete: canDelete ? openDelete : undefined,
    onEdit: canUpdate ? undefined : undefined,
    onToggleActive: canUpdate ? openToggle : undefined,
    onView: showSelected,
  }), [canDelete, canUpdate, openDelete, openToggle, showSelected]);

  return {
    closeConfirmAction,
    confirmAction,
    confirmError,
    confirmSessionAction,
    dismissToast,
    isSubmitting: isDeleting || isUpdating,
    openBulkDelete,
    openDelete,
    openToggle,
    rowActions,
    showToast,
    toast,
  };
}
