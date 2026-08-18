"use client";

import {
  createContext,
  createElement,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { createStore, type StoreApi } from "zustand/vanilla";
import { useStore } from "zustand";

import type { Session } from "@repo/types";
import type { DataTableRowId } from "@/components/DataTable";
import type { SessionConfirmAction, SessionFiltersState } from "./types";

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
  setAddModalOpen: (value: boolean) => void;
  setConfirmAction: (value: SessionConfirmAction | null) => void;
  setEditingSession: (value: Session | null) => void;
  setFilters: (
    value:
      | SessionFiltersState
      | ((current: SessionFiltersState) => SessionFiltersState),
  ) => void;
  setPage: (value: number) => void;
  setPageSize: (value: number) => void;
  setSelectedRowIds: (value: DataTableRowId[]) => void;
  setSelectedSession: (value: Session | null) => void;
};

export const DEFAULT_SESSION_FILTERS: SessionFiltersState = {
  organizationId: null,
  search: "",
  status: "ALL",
  sort: "createdAt",
  order: "desc",
};

function createState(
  initialState?: SessionStoreInitialState,
): SessionStoreState {
  return {
    confirmAction: null,
    editingSession: null,
    filters: { ...DEFAULT_SESSION_FILTERS, ...initialState?.filters },
    isAddModalOpen: false,
    isSidePanelOpen: false,
    page: initialState?.page ?? 1,
    pageSize: initialState?.pageSize ?? 10,
    selectedRowIds: initialState?.selectedRowIds ?? [],
    selectedSession: initialState?.selectedSession ?? null,
  };
}

function createSessionStore(initialState?: SessionStoreInitialState) {
  return createStore<SessionStore>((set) => ({
    ...createState(initialState),
    closeSidePanel: () =>
      set((current) => ({ ...current, isSidePanelOpen: false })),
    setAddModalOpen: (value) =>
      set((current) => ({ ...current, isAddModalOpen: value })),
    setConfirmAction: (value) =>
      set((current) => ({ ...current, confirmAction: value })),
    setEditingSession: (value) =>
      set((current) => ({ ...current, editingSession: value })),
    setFilters: (value) =>
      set((current) => ({
        ...current,
        filters: typeof value === "function" ? value(current.filters) : value,
      })),
    setPage: (value) => set((current) => ({ ...current, page: value })),
    setPageSize: (value) => set((current) => ({ ...current, pageSize: value })),
    setSelectedRowIds: (value) =>
      set((current) => ({ ...current, selectedRowIds: value })),
    setSelectedSession: (value) =>
      set((current) => ({
        ...current,
        isSidePanelOpen: Boolean(value),
        selectedSession: value,
      })),
  }));
}

const SessionStoreContext = createContext<StoreApi<SessionStore> | null>(null);

export function SessionStoreProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: SessionStoreInitialState;
}) {
  const [store] = useState(() => createSessionStore(initialState));
  return createElement(
    SessionStoreContext.Provider,
    { value: store },
    children,
  );
}

export function useSessionStore() {
  const store = useContext(SessionStoreContext);
  if (!store) {
    throw new Error(
      "useSessionStore must be used inside SessionStoreProvider.",
    );
  }
  return useStore(store);
}
