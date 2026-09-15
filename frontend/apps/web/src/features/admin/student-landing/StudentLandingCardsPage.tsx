"use client";

import { useMemo, useState } from "react";
import type { StudentLandingCard } from "@repo/types";
import { PageContainer } from "@repo/ui/dashboard";
import { useAcademicSessions } from "../academic/useAcademicSessions";
import { LandingCardsHeader } from "./components/header/LandingCardsHeader";
import { LandingCardsOrganizationControl } from "./components/header/LandingCardsOrganizationControl";
import { LandingCardsList } from "./components/list/LandingCardsList";
import { LandingCardFormModal } from "./components/modal/LandingCardFormModal";
import { LandingCardsErrorState } from "./components/states/LandingCardsErrorState";
import { LandingCardsLoadingState } from "./components/states/LandingCardsLoadingState";
import { useLandingCardForm } from "./hooks/useLandingCardForm";
import { useLandingCardImagePreview } from "./hooks/useLandingCardImagePreview";
import { useLandingCardMutations } from "./hooks/useLandingCardMutations";
import { useStudentLandingCards } from "./hooks/useStudentLandingCards";
import type { LandingCardMoveDirection } from "./types";
import { reorderLandingCards } from "./utils/reorderLandingCards";
import styles from "./StudentLandingCardsPage.module.css";

export const StudentLandingCardsPage = () => {
  const academic = useAcademicSessions();
  const organizationId = academic.selectedOrganizationId;
  const [message, setMessage] = useState<string | null>(null);
  const formState = useLandingCardForm();
  const cardsState = useStudentLandingCards(organizationId);
  const imageState = useLandingCardImagePreview({
    editing: formState.editing,
    imageUrl: formState.form.imageUrl,
    onError: setMessage,
  });
  const mutations = useLandingCardMutations({
    editing: formState.editing,
    form: formState.form,
    imageFile: imageState.imageFile,
    onMessage: setMessage,
    onSaved: () => {
      formState.reset();
      imageState.clearImageFile();
    },
    organizationId,
    refresh: cardsState.refresh,
  });
  const organizationOptions = useMemo(
    () =>
      academic.organizations.map((organization) => ({
        label: organization.name,
        value: String(organization.id),
      })),
    [academic.organizations],
  );

  const openCreate = () => {
    formState.openCreate();
    imageState.clearImageFile();
    setMessage(null);
  };
  const openEdit = (card: StudentLandingCard) => {
    formState.openEdit(card);
    imageState.clearImageFile();
    setMessage(null);
  };
  const closeForm = () => {
    formState.close();
    imageState.clearImageFile();
  };
  const selectOrganization = (id: number) => {
    academic.setSelectedOrganizationId(id);
    formState.reset();
    imageState.clearImageFile();
    setMessage(null);
  };
  const moveCard = (id: number, direction: LandingCardMoveDirection) => {
    const ids = reorderLandingCards(cardsState.customCards, id, direction);
    if (ids) mutations.reorderMutation.mutate(ids);
  };
  const deleteCard = (card: StudentLandingCard) => {
    if (window.confirm(`Delete “${card.title}”?`))
      mutations.removeMutation.mutate(card.id);
  };

  return (
    <PageContainer>
      <div className={styles.page}>
        <LandingCardsHeader
          customCount={cardsState.customCards.length}
          totalCount={cardsState.cards.length}
          visibleCount={cardsState.visibleCards}
        />
        <LandingCardsOrganizationControl
          disabled={!organizationId}
          loading={academic.isLoading}
          onAdd={openCreate}
          onOrganizationChange={selectOrganization}
          options={organizationOptions}
          organizationId={organizationId}
          showOrganization={academic.organizations.length > 1}
        />
        {message ? <div className={styles.message}>{message}</div> : null}
        {cardsState.query.isLoading ? <LandingCardsLoadingState /> : null}
        {cardsState.query.isError ? <LandingCardsErrorState /> : null}
        {!cardsState.query.isLoading && !cardsState.query.isError ? (
          <LandingCardsList
            cards={cardsState.cards}
            customCards={cardsState.customCards}
            deleting={mutations.removeMutation.isPending}
            onDelete={deleteCard}
            onEdit={openEdit}
            onMove={moveCard}
            reordering={mutations.reorderMutation.isPending}
          />
        ) : null}
        <LandingCardFormModal
          editing={formState.editing}
          form={formState.form}
          imageFile={imageState.imageFile}
          imageSrc={imageState.imageSrc}
          isOpen={formState.isOpen}
          message={message}
          onClearImage={() => {
            imageState.clearImageFile();
            formState.updateForm({ imageUrl: "" });
          }}
          onClose={closeForm}
          onSave={() => {
            setMessage(null);
            mutations.saveMutation.mutate();
          }}
          onSelectImage={imageState.selectImage}
          onUpdate={formState.updateForm}
          saving={mutations.saveMutation.isPending}
        />
      </div>
    </PageContainer>
  );
};
