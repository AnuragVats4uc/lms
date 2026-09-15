import { useState } from "react";
import type { StudentLandingCard } from "@repo/types";
import { defaultLandingCardForm } from "../constants";
import type { LandingCardForm } from "../types";
import { toLandingCardForm } from "../utils/landingCardPayload";

export const useLandingCardForm = () => {
  const [editing, setEditing] = useState<StudentLandingCard | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<LandingCardForm>(defaultLandingCardForm);
  const openCreate = () => {
    setEditing(null);
    setForm(defaultLandingCardForm);
    setIsOpen(true);
  };
  const openEdit = (card: StudentLandingCard) => {
    setEditing(card);
    setForm(toLandingCardForm(card));
    setIsOpen(true);
  };
  const close = () => setIsOpen(false);
  const reset = () => {
    setEditing(null);
    setForm(defaultLandingCardForm);
    setIsOpen(false);
  };
  const updateForm = (values: Partial<LandingCardForm>) =>
    setForm((current) => ({ ...current, ...values }));
  return {
    close,
    editing,
    form,
    isOpen,
    openCreate,
    openEdit,
    reset,
    setForm,
    updateForm,
  };
};
