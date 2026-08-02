"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
  type SetStateAction,
} from "react";

import type { DataTableRowId } from "@/components/DataTable";
import type { Session } from "@repo/types";
import type {
  SessionConfirmAction,
  SessionFiltersState,
} from "./types";

export interface SessionStoreState {
  confirmAction: SessionConfirmAction | null;
  editingSession: Session | null;
  filters: SessionFiltersState;
  isAddModalOpen: boolean;
  isSidePanelOpen: boolean;
  page: number;
  pageSize: number;
  selectedRowIds: DataTableRowId[];
  selectedSession: Session | null;
}

export type SessionStoreInitialState = Partial<SessionStoreState>;

export type SessionStore = SessionStoreState & {
  closeSidePanel: () => void;
  setAddModalOpen: (value: SetStateAction<boolean>) => void;
  setConfirmAction: (
    value: SetStateAction<SessionConfirmAction | null>,
  ) => void;
  setEditingSession: (value: SetStateAction<Session | null>) => void;
  setFilters: (value: SetStateAction<SessionFiltersState>) => void;
  setPage: (value: SetStateAction<number>) => void;
  setPageSize: (value: SetStateAction<number>) => void;
  setSelectedRowIds: (value: SetStateAction<DataTableRowId[]>) => void;
  setSelectedSession: (value: SetStateAction<Session | null>) => void;
};

export const DEFAULT_SESSION_FILTERS: SessionFiltersState = {
  organizationId: null,
  search: "",
  status: "ALL",
  sort: "createdAt",
  order: "desc",
};

function resolveStateAction<T>(value: SetStateAction<T>, current: T): T {
  return typeof value === "function"
    ? (value as (previous: T) => T)(current)
    : value;
}

function createState(initialState?: SessionStoreInitialState): SessionStoreState {
  return {
    confirmAction: null,
    editingSession: null,
    isAddModalOpen: false,
    isSidePanelOpen: false,
    page: 1,
    pageSize: 10,
    selectedRowIds: initialState?.selectedRowIds ?? [],
    ...initialState,
    selectedSession: initialState?.selectedSession ?? null,
    filters: { ...DEFAULT_SESSION_FILTERS, ...initialState?.filters },
  };
}

const SessionStoreContext = createContext<SessionStore | null>(null);

export function SessionStoreProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: SessionStoreInitialState;
}) {
  const [state, setState] = useState(() => createState(initialState));
  const setFilters = useCallback(
    (value: SetStateAction<SessionFiltersState>) =>
      setState((current) => ({
        ...current,
        filters: resolveStateAction(value, current.filters),
      })),
    [],
  );
  const setSelectedRowIds = useCallback(
    (value: SetStateAction<DataTableRowId[]>) =>
      setState((current) => ({
        ...current,
        selectedRowIds: resolveStateAction(value, current.selectedRowIds),
      })),
    [],
  );
  const setPage = useCallback(
    (value: SetStateAction<number>) =>
      setState((current) => ({
        ...current,
        page: resolveStateAction(value, current.page),
      })),
    [],
  );
  const setPageSize = useCallback(
    (value: SetStateAction<number>) =>
      setState((current) => ({
        ...current,
        pageSize: resolveStateAction(value, current.pageSize),
      })),
    [],
  );
  const setSelectedSession = useCallback(
    (value: SetStateAction<Session | null>) =>
      setState((current) => {
        const selectedSession = resolveStateAction(value, current.selectedSession);
        return {
          ...current,
          isSidePanelOpen: Boolean(selectedSession),
          selectedSession,
        };
      }),
    [],
  );
  const setAddModalOpen = useCallback(
    (value: SetStateAction<boolean>) =>
      setState((current) => ({
        ...current,
        isAddModalOpen: resolveStateAction(value, current.isAddModalOpen),
      })),
    [],
  );
  const setEditingSession = useCallback(
    (value: SetStateAction<Session | null>) =>
      setState((current) => ({
        ...current,
        editingSession: resolveStateAction(value, current.editingSession),
      })),
    [],
  );
  const setConfirmAction = useCallback(
    (value: SetStateAction<SessionConfirmAction | null>) =>
      setState((current) => ({
        ...current,
        confirmAction: resolveStateAction(value, current.confirmAction),
      })),
    [],
  );
  const closeSidePanel = useCallback(
    () => setState((current) => ({ ...current, isSidePanelOpen: false })),
    [],
  );
  const value = useMemo<SessionStore>(
    () => ({
      ...state,
      closeSidePanel,
      setAddModalOpen,
      setConfirmAction,
      setEditingSession,
      setFilters,
      setPage,
      setPageSize,
      setSelectedRowIds,
      setSelectedSession,
    }),
    [
      closeSidePanel,
      setAddModalOpen,
      setConfirmAction,
      setEditingSession,
      setFilters,
      setPage,
      setPageSize,
      setSelectedRowIds,
      setSelectedSession,
      state,
    ],
  );

  return createElement(SessionStoreContext.Provider, { value }, children);
}

export function useSessionStore() {
  const store = useContext(SessionStoreContext);
  if (!store) {
    throw new Error("useSessionStore must be used inside SessionStoreProvider.");
  }
  return store;
}
