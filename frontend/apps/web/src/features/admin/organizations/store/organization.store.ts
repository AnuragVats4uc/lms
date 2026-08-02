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

import { DEFAULT_FILTERS } from "../constants";
import type { DataTableRowId } from "../table";
import type {
  OrganizationConfirmAction,
  OrganizationFiltersState,
  OrganizationTableRow,
} from "../types";

export interface OrganizationStoreState {
  confirmAction: OrganizationConfirmAction | null;
  editingOrganization: OrganizationTableRow | null;
  filters: OrganizationFiltersState;
  isAddModalOpen: boolean;
  isSidePanelOpen: boolean;
  page: number;
  pageSize: number;
  selectedOrganization: OrganizationTableRow | null;
  selectedRowIds: DataTableRowId[];
}

export type OrganizationStoreInitialState = Partial<OrganizationStoreState>;

interface OrganizationStoreActions {
  closeSidePanel: () => void;
  openSidePanel: () => void;
  setAddModalOpen: (value: SetStateAction<boolean>) => void;
  setConfirmAction: (
    value: SetStateAction<OrganizationConfirmAction | null>,
  ) => void;
  setEditingOrganization: (
    value: SetStateAction<OrganizationTableRow | null>,
  ) => void;
  setFilters: (value: SetStateAction<OrganizationFiltersState>) => void;
  setPage: (value: SetStateAction<number>) => void;
  setPageSize: (value: SetStateAction<number>) => void;
  setSelectedOrganization: (
    value: SetStateAction<OrganizationTableRow | null>,
  ) => void;
  setSelectedRowIds: (value: SetStateAction<DataTableRowId[]>) => void;
}

export type OrganizationStore = OrganizationStoreState &
  OrganizationStoreActions;

const createDefaultState = (): OrganizationStoreState => ({
  confirmAction: null,
  editingOrganization: null,
  filters: {
    ...DEFAULT_FILTERS,
  },
  isAddModalOpen: false,
  isSidePanelOpen: false,
  page: 1,
  pageSize: 10,
  selectedOrganization: null,
  selectedRowIds: [],
});

const resolveStateAction = <T>(value: SetStateAction<T>, current: T): T => {
  return typeof value === "function"
    ? (value as (previous: T) => T)(current)
    : value;
};

const createState = (
  initialState?: OrganizationStoreInitialState,
): OrganizationStoreState => {
  const defaults = createDefaultState();

  return {
    ...defaults,
    ...initialState,
    filters: initialState?.filters
      ? {
          ...initialState.filters,
        }
      : defaults.filters,
    selectedRowIds: initialState?.selectedRowIds
      ? [...initialState.selectedRowIds]
      : defaults.selectedRowIds,
  };
};

const OrganizationStoreContext = createContext<OrganizationStore | null>(null);

export const OrganizationStoreProvider = ({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: OrganizationStoreInitialState;
}) => {
  const [state, setState] = useState<OrganizationStoreState>(() =>
    createState(initialState),
  );

  const setFilters = useCallback(
    (value: SetStateAction<OrganizationFiltersState>) => {
      setState((current) => ({
        ...current,
        filters: resolveStateAction(value, current.filters),
      }));
    },
    [],
  );

  const setPage = useCallback((value: SetStateAction<number>) => {
    setState((current) => ({
      ...current,
      page: resolveStateAction(value, current.page),
    }));
  }, []);

  const setPageSize = useCallback((value: SetStateAction<number>) => {
    setState((current) => ({
      ...current,
      pageSize: resolveStateAction(value, current.pageSize),
    }));
  }, []);

  const setSelectedRowIds = useCallback(
    (value: SetStateAction<DataTableRowId[]>) => {
      setState((current) => ({
        ...current,
        selectedRowIds: resolveStateAction(value, current.selectedRowIds),
      }));
    },
    [],
  );

  const setSelectedOrganization = useCallback(
    (value: SetStateAction<OrganizationTableRow | null>) => {
      setState((current) => {
        const selectedOrganization = resolveStateAction(
          value,
          current.selectedOrganization,
        );

        return {
          ...current,
          isSidePanelOpen: Boolean(selectedOrganization),
          selectedOrganization,
        };
      });
    },
    [],
  );

  const setAddModalOpen = useCallback((value: SetStateAction<boolean>) => {
    setState((current) => ({
      ...current,
      isAddModalOpen: resolveStateAction(value, current.isAddModalOpen),
    }));
  }, []);

  const setEditingOrganization = useCallback(
    (value: SetStateAction<OrganizationTableRow | null>) => {
      setState((current) => ({
        ...current,
        editingOrganization: resolveStateAction(
          value,
          current.editingOrganization,
        ),
      }));
    },
    [],
  );

  const setConfirmAction = useCallback(
    (value: SetStateAction<OrganizationConfirmAction | null>) => {
      setState((current) => ({
        ...current,
        confirmAction: resolveStateAction(value, current.confirmAction),
      }));
    },
    [],
  );

  const openSidePanel = useCallback(() => {
    setState((current) => ({ ...current, isSidePanelOpen: true }));
  }, []);

  const closeSidePanel = useCallback(() => {
    setState((current) => ({ ...current, isSidePanelOpen: false }));
  }, []);

  const value = useMemo<OrganizationStore>(
    () => ({
      ...state,
      closeSidePanel,
      openSidePanel,
      setAddModalOpen,
      setConfirmAction,
      setEditingOrganization,
      setFilters,
      setPage,
      setPageSize,
      setSelectedOrganization,
      setSelectedRowIds,
    }),
    [
      closeSidePanel,
      openSidePanel,
      setAddModalOpen,
      setConfirmAction,
      setEditingOrganization,
      setFilters,
      setPage,
      setPageSize,
      setSelectedOrganization,
      setSelectedRowIds,
      state,
    ],
  );

  return createElement(OrganizationStoreContext.Provider, { value }, children);
};

export const useOrganizationStore = (): OrganizationStore => {
  const store = useContext(OrganizationStoreContext);

  if (!store) {
    throw new Error(
      "useOrganizationStore must be used inside OrganizationStoreProvider.",
    );
  }

  return store;
};
