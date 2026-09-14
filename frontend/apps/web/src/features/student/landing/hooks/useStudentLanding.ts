import { useQuery } from "@tanstack/react-query";
import { useAuthSession } from "@repo/auth";
import { studentLandingApi } from "@repo/api";

import { fallbackLmsCard } from "../constants/fallbackLmsCard";
import { useLandingActivity } from "./useLandingActivity";
import { useLandingCarousel } from "./useLandingCarousel";
import { useStudentLandingAccess } from "./useStudentLandingAccess";

export const useStudentLanding = () => {
  const { currentUser } = useAuthSession();
  const isWelcomeAvailable = useStudentLandingAccess(currentUser?.uuid);
  const cardsQuery = useQuery({
    enabled: isWelcomeAvailable,
    queryFn: () => studentLandingApi.listStudent(),
    queryKey: ["student", "landing-cards"],
    staleTime: 60_000,
  });
  const cards = cardsQuery.data ?? [fallbackLmsCard];
  const carousel = useLandingCarousel(cards.length, isWelcomeAvailable);
  const handleVisit = useLandingActivity(isWelcomeAvailable);

  return {
    cards,
    carousel,
    handleVisit,
    isWelcomeAvailable,
    studentName: currentUser?.firstName?.trim(),
  };
};
