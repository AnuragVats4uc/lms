import type { ReactNode } from "react";

export interface CrudStat {
  icon: ReactNode;
  label: string;
  value: number;
}

export interface CrudStatsContext<Item> {
  rows: Item[];
  total: number;
  isLoading: boolean;
}

export interface CrudFilterOption {
  label: string;
  value: string;
}

export interface CrudFilterDefinition {
  id: string;
  label: string;
  options: CrudFilterOption[];
}

export interface CrudToastState {
  id: number;
  message: string;
  title: string;
  tone: "error" | "success";
}
