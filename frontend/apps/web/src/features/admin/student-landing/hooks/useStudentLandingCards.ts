import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { studentLandingApi } from "@repo/api";
import { landingCardQueryKey } from "../constants";

export const useStudentLandingCards = (organizationId: number | null) => {
  const queryClient = useQueryClient();
  const queryKey = landingCardQueryKey(organizationId);
  const query = useQuery({
    enabled: organizationId !== null,
    queryFn: () => studentLandingApi.listAdmin(organizationId as number),
    queryKey,
  });
  const cards = useMemo(() => query.data ?? [], [query.data]);
  const customCards = useMemo(
    () => cards.filter((card) => card.type === "CUSTOM"),
    [cards],
  );
  const visibleCards = useMemo(
    () => cards.filter((card) => card.isActive).length,
    [cards],
  );
  const refresh = () => queryClient.invalidateQueries({ queryKey });
  return { cards, customCards, query, refresh, visibleCards };
};
