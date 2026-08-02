"use client";

import { useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ORGANIZATION_QUERY_STALE_TIME,
  createOrganization,
  deleteOrganization,
  getOrganizations,
  organizationQueryKeys,
  toOrganizationRow,
  updateOrganization,
  type OrganizationListParams,
} from "../services";
import type { OrganizationFiltersState } from "../types";

interface UseOrganizationsOptions {
  page: number;
  pageSize: number;
  search: string;
  status: OrganizationFiltersState["status"];
}

export const useOrganizations = ({
  page,
  pageSize,
  search,
  status,
}: UseOrganizationsOptions) => {
  const serverStatus =
    status === "ACTIVE" || status === "INACTIVE" ? status : undefined;

  const queryParams: OrganizationListParams = {
    limit: pageSize,
    page,
    search: search || undefined,
    status: serverStatus,
  };

  const query = useQuery({
    queryFn: () => getOrganizations(queryParams),
    queryKey: organizationQueryKeys.list(queryParams),
    staleTime: ORGANIZATION_QUERY_STALE_TIME,
  });

  const createMutation = useMutation({
    mutationFn: createOrganization,
  });

  const updateMutation = useMutation({
    mutationFn: updateOrganization,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOrganization,
  });

  const rows = useMemo(
    () => (query.data?.items ?? []).map(toOrganizationRow),
    [query.data?.items],
  );

  return {
    createOrganization: createMutation.mutateAsync,
    deleteOrganization: deleteMutation.mutateAsync,
    error: query.error,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isError: query.isError,
    isFetching: query.isFetching,
    isLoading: query.isLoading,
    isUpdating: updateMutation.isPending,
    meta: query.data?.meta,
    refetch: query.refetch,
    rows,
    total: query.data?.meta?.total ?? 0,
    updateOrganization: updateMutation.mutateAsync,
  };
};
