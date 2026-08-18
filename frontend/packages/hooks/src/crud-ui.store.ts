import { create } from "zustand";

export type CrudRowId = string | number;

export interface CrudUiPageState {
  customFilters: Record<string, string>;
  editingId: number | null;
  isCreateOpen: boolean;
  page: number;
  pageSize: number;
  publishedFilter: string;
  search: string;
  selectedRowIds: CrudRowId[];
  statusFilter: string;
  statusId: number | null;
  typeFilter: string;
  confirmId: number | null;
}

export const DEFAULT_CRUD_UI_PAGE_STATE: CrudUiPageState = {
  confirmId: null,
  customFilters: {},
  editingId: null,
  isCreateOpen: false,
  page: 1,
  pageSize: 10,
  publishedFilter: "",
  search: "",
  selectedRowIds: [],
  statusFilter: "",
  statusId: null,
  typeFilter: "",
};

export type CrudUiPagePatch =
  | Partial<CrudUiPageState>
  | ((current: CrudUiPageState) => Partial<CrudUiPageState>);

interface CrudUiStoreState {
  pages: Record<string, CrudUiPageState>;
  initializePage: (
    scope: string,
    initialState?: Partial<CrudUiPageState>,
  ) => void;
  resetPage: (scope: string) => void;
  updatePage: (scope: string, patch: CrudUiPagePatch) => void;
}

export const useCrudUiStore = create<CrudUiStoreState>((set) => ({
  pages: {},
  initializePage: (scope, initialState) =>
    set((current) => ({
      pages: {
        ...current.pages,
        [scope]: {
          ...DEFAULT_CRUD_UI_PAGE_STATE,
          ...initialState,
          customFilters: {
            ...DEFAULT_CRUD_UI_PAGE_STATE.customFilters,
            ...initialState?.customFilters,
          },
        },
      },
    })),
  resetPage: (scope) =>
    set((current) => {
      const pages = { ...current.pages };
      delete pages[scope];
      return { pages };
    }),
  updatePage: (scope, patch) =>
    set((current) => {
      const currentPage = current.pages[scope] ?? DEFAULT_CRUD_UI_PAGE_STATE;
      const nextPatch =
        typeof patch === "function" ? patch(currentPage) : patch;
      return {
        pages: {
          ...current.pages,
          [scope]: { ...currentPage, ...nextPatch },
        },
      };
    }),
}));
