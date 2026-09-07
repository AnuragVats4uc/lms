"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  LayoutGrid,
  Pencil,
  Plus,
  Trash2,
  UploadCloud,
} from "lucide-react";

import { getApiErrorMessage, studentLandingApi } from "@repo/api";
import type {
  CreateStudentLandingCardRequest,
  StudentLandingCard,
} from "@repo/types";
import { PageContainer } from "@repo/ui/dashboard";

import { AppModal } from "@/components/AppModal";
import { useAcademicSessions } from "../academic/useAcademicSessions";
import { CrudSelect } from "../components/crud";
import styles from "./StudentLandingCardsPage.module.css";

type CardForm = Omit<
  CreateStudentLandingCardRequest,
  "imageUrl" | "imageAlt"
> & {
  imageUrl: string;
  imageAlt: string;
  isActive: boolean;
};

const emptyForm: CardForm = {
  title: "Explore App",
  description: "Continue to connected learning resources and student services.",
  ctaLabel: "Explore App",
  destinationUrl: "",
  imageUrl: "/images/external-links.png",
  imageAlt: "Illustration of a connected student learning application",
  openInNewTab: true,
  isActive: true,
};

export function StudentLandingCardsPage() {
  const academic = useAcademicSessions();
  const organizationId = academic.selectedOrganizationId;
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<StudentLandingCard | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<CardForm>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const queryKey = ["admin", "student-landing-cards", organizationId];
  const cardsQuery = useQuery({
    enabled: organizationId !== null,
    queryFn: () => studentLandingApi.listAdmin(organizationId as number),
    queryKey,
  });
  const cards = useMemo(() => cardsQuery.data ?? [], [cardsQuery.data]);
  const customCards = useMemo(
    () => cards.filter((card) => card.type === "CUSTOM"),
    [cards],
  );
  const visibleCards = useMemo(
    () => cards.filter((card) => card.isActive).length,
    [cards],
  );
  const organizationOptions = useMemo(
    () =>
      academic.organizations.map((organization) => ({
        label: organization.name,
        value: String(organization.id),
      })),
    [academic.organizations],
  );
  const imagePreviewUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile],
  );

  useEffect(
    () => () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    },
    [imagePreviewUrl],
  );

  const refresh = () => queryClient.invalidateQueries({ queryKey });
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error("Select an organization first.");
      const commonPayload = {
        title: form.title.trim(),
        description: form.description.trim(),
        ctaLabel: form.ctaLabel.trim(),
        imageUrl: form.imageUrl?.trim() || null,
        imageAlt: form.imageAlt?.trim() || null,
      };
      const savedCard = await (editing
        ? studentLandingApi.update(editing.id, {
            ...commonPayload,
            ...(editing.type === "CUSTOM"
              ? {
                  destinationUrl: form.destinationUrl.trim(),
                  openInNewTab: form.openInNewTab,
                }
              : {}),
            ...(editing.type === "CUSTOM" ? { isActive: form.isActive } : {}),
          })
        : studentLandingApi.create(organizationId, {
            ...commonPayload,
            imageUrl: commonPayload.imageUrl ?? undefined,
            imageAlt: commonPayload.imageAlt ?? undefined,
            destinationUrl: form.destinationUrl.trim(),
            openInNewTab: form.openInNewTab,
          }));
      return imageFile
        ? studentLandingApi.uploadImage(savedCard.id, imageFile)
        : savedCard;
    },
    onError: (error) =>
      setMessage(getApiErrorMessage(error, "Card could not be saved.")),
    onSuccess: async () => {
      await refresh();
      setIsFormOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setImageFile(null);
      setMessage("Landing card saved.");
    },
  });
  const removeMutation = useMutation({
    mutationFn: (id: number) => studentLandingApi.remove(id),
    onError: (error) =>
      setMessage(getApiErrorMessage(error, "Card could not be deleted.")),
    onSuccess: async () => {
      await refresh();
      setMessage("Landing card deleted.");
    },
  });
  const reorderMutation = useMutation({
    mutationFn: (ids: number[]) =>
      studentLandingApi.reorder(organizationId as number, ids),
    onError: (error) =>
      setMessage(getApiErrorMessage(error, "Card order could not be saved.")),
    onSuccess: async () => {
      await refresh();
      setMessage("Card order updated.");
    },
  });

  const openEdit = (card: StudentLandingCard) => {
    setEditing(card);
    setImageFile(null);
    setForm({
      title: card.title,
      description: card.description,
      ctaLabel: card.ctaLabel,
      destinationUrl: card.destinationUrl,
      imageUrl: card.imageUrl ?? "",
      imageAlt: card.imageAlt ?? "",
      openInNewTab: card.openInNewTab,
      isActive: card.isActive,
    });
    setMessage(null);
    setIsFormOpen(true);
  };
  const move = (cardId: number, direction: -1 | 1) => {
    const ids = customCards.map((card) => card.id);
    const from = ids.indexOf(cardId);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to]!, ids[from]!];
    reorderMutation.mutate(ids);
  };
  const formImageSrc =
    imagePreviewUrl ||
    form.imageUrl.trim() ||
    (editing?.type === "SYSTEM_LMS"
      ? "/images/dashboard.png"
      : "/images/external-links.png");
  const selectImage = (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage("Image must be JPEG, PNG, or WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image must not exceed 5 MB.");
      return;
    }
    setImageFile(file);
    setMessage(null);
  };

  return (
    <PageContainer>
      <div className={styles.page}>
        <section
          aria-label="Landing card summary"
          className={styles.bentoHeader}
        >
          <div aria-hidden="true" className={styles.bentoHeaderIcon}>
            <LayoutGrid size={24} strokeWidth={1.8} />
          </div>
          <div className={styles.bentoHeading}>
            <p className={styles.eyebrow}>Student experience</p>
            <h1>Landing Cards</h1>
            <span>Manage the destinations shown immediately after login.</span>
          </div>
          <div className={styles.headerMetrics}>
            <span>
              <strong>{cards.length}</strong>
              <small>Total</small>
            </span>
            <span>
              <strong>{visibleCards}</strong>
              <small>Visible</small>
            </span>
            <span>
              <strong>{customCards.length}</strong>
              <small>Custom</small>
            </span>
          </div>
          <div className={styles.headerActions}>
            {academic.organizations.length > 1 ? (
              <div className={styles.organizationSelect}>
                <CrudSelect
                  ariaLabel="Organization"
                  label="Organization"
                  loading={academic.isLoading}
                  onChange={(value) => {
                    academic.setSelectedOrganizationId(Number(value));
                    setIsFormOpen(false);
                    setEditing(null);
                    setForm(emptyForm);
                    setImageFile(null);
                    setMessage(null);
                  }}
                  options={organizationOptions}
                  value={organizationId ? String(organizationId) : ""}
                  width="100%"
                />
              </div>
            ) : null}
            <button
              className={styles.primaryButton}
              disabled={!organizationId}
              onClick={() => {
                setEditing(null);
                setForm(emptyForm);
                setImageFile(null);
                setMessage(null);
                setIsFormOpen(true);
              }}
              type="button"
            >
              <Plus size={16} /> Add card
            </button>
          </div>
        </section>

        {message ? <div className={styles.message}>{message}</div> : null}

        {cardsQuery.isLoading ? (
          <div className={styles.state}>Loading cards…</div>
        ) : null}
        {cardsQuery.isError ? (
          <div className={styles.state}>
            Cards could not be loaded. Please refresh.
          </div>
        ) : null}
        {!cardsQuery.isLoading && !cardsQuery.isError ? (
          <div className={styles.cardList}>
            {cards.map((card) => {
              const customIndex = customCards.findIndex(
                (item) => item.id === card.id,
              );
              return (
                <article className={styles.cardRow} key={card.uuid}>
                  <div className={styles.preview}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={card.imageAlt ?? card.title}
                      src={
                        card.imageUrl ??
                        (card.type === "SYSTEM_LMS"
                          ? "/images/dashboard.png"
                          : "/images/external-links.png")
                      }
                    />
                  </div>
                  <div className={styles.cardCopy}>
                    <div className={styles.cardTitleLine}>
                      <h2>{card.title}</h2>
                      <span>
                        {card.type === "SYSTEM_LMS"
                          ? "Fixed LMS card"
                          : card.isActive
                            ? "Visible"
                            : "Hidden"}
                      </span>
                    </div>
                    <p>{card.description}</p>
                    <div className={styles.cardMeta}>
                      <span>CTA: {card.ctaLabel}</span>
                      <a
                        href={card.destinationUrl}
                        rel="noreferrer"
                        target={card.openInNewTab ? "_blank" : undefined}
                      >
                        Open destination <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                  <div className={styles.actions}>
                    {card.type === "CUSTOM" ? (
                      <>
                        <button
                          aria-label={`Move ${card.title} up`}
                          disabled={
                            customIndex <= 0 || reorderMutation.isPending
                          }
                          onClick={() => move(card.id, -1)}
                          type="button"
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          aria-label={`Move ${card.title} down`}
                          disabled={
                            customIndex === customCards.length - 1 ||
                            reorderMutation.isPending
                          }
                          onClick={() => move(card.id, 1)}
                          type="button"
                        >
                          <ArrowDown size={16} />
                        </button>
                      </>
                    ) : null}
                    <button
                      aria-label={`Edit ${card.title}`}
                      onClick={() => openEdit(card)}
                      type="button"
                    >
                      <Pencil size={16} />
                    </button>
                    {card.type === "CUSTOM" ? (
                      <button
                        aria-label={`Delete ${card.title}`}
                        className={styles.dangerButton}
                        disabled={removeMutation.isPending}
                        onClick={() => {
                          if (window.confirm(`Delete “${card.title}”?`))
                            removeMutation.mutate(card.id);
                        }}
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}

        <AppModal
          className="lms-organization-create-modal"
          description="Save the form and refresh the current list."
          footer={
            <div className={styles.modalActions}>
              <button
                className={styles.secondaryButton}
                disabled={saveMutation.isPending}
                onClick={() => {
                  setIsFormOpen(false);
                  setImageFile(null);
                }}
                type="button"
              >
                Cancel
              </button>
              <button
                className={styles.primaryButton}
                disabled={saveMutation.isPending}
                form="student-landing-card-form"
                type="submit"
              >
                {saveMutation.isPending
                  ? "Saving…"
                  : editing
                    ? "Update"
                    : "Create"}
              </button>
            </div>
          }
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setImageFile(null);
          }}
          title={editing ? "Edit Landing Card" : "Add Landing Card"}
        >
          <form
            id="student-landing-card-form"
            onSubmit={(event) => {
              event.preventDefault();
              setMessage(null);
              saveMutation.mutate();
            }}
          >
            <div className={styles.formGrid}>
              {message ? (
                <div className={styles.formError}>{message}</div>
              ) : null}
              <Field label="Heading">
                <input
                  autoFocus
                  maxLength={120}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  required
                  value={form.title}
                />
              </Field>
              <Field label="CTA label">
                <input
                  maxLength={80}
                  onChange={(event) =>
                    setForm({ ...form, ctaLabel: event.target.value })
                  }
                  required
                  value={form.ctaLabel}
                />
              </Field>
              <Field full label="Description">
                <textarea
                  maxLength={500}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  required
                  rows={2}
                  value={form.description}
                />
              </Field>
              <div className={styles.imageUploader}>
                <div className={styles.imageUploadPreview}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="Card preview" src={formImageSrc} />
                </div>
                <div className={styles.imageUploadCopy}>
                  <strong>Card image</strong>
                  <span>JPEG, PNG, or WebP. Maximum file size 5 MB.</span>
                  {imageFile ? <small>{imageFile.name}</small> : null}
                  <div>
                    <label className={styles.secondaryButton}>
                      <UploadCloud size={15} />
                      {imageFile ? "Replace image" : "Choose image"}
                      <input
                        accept="image/jpeg,image/png,image/webp"
                        className={styles.hiddenFileInput}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) selectImage(file);
                          event.currentTarget.value = "";
                        }}
                        type="file"
                      />
                    </label>
                    {imageFile || form.imageUrl ? (
                      <button
                        className={styles.removeImageButton}
                        onClick={() => {
                          setImageFile(null);
                          setForm({ ...form, imageUrl: "" });
                        }}
                        type="button"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
              <Field full label="Image URL (optional alternative)">
                <input
                  onChange={(event) =>
                    setForm({ ...form, imageUrl: event.target.value })
                  }
                  placeholder="/images/external-links.png or https://…"
                  value={form.imageUrl}
                />
              </Field>
              <Field full label="Image alternative text">
                <input
                  maxLength={200}
                  onChange={(event) =>
                    setForm({ ...form, imageAlt: event.target.value })
                  }
                  placeholder="Describe the image for screen readers"
                  value={form.imageAlt}
                />
              </Field>
              <Field full label="Destination URL">
                <input
                  disabled={editing?.type === "SYSTEM_LMS"}
                  onChange={(event) =>
                    setForm({ ...form, destinationUrl: event.target.value })
                  }
                  placeholder="https://example.com"
                  required
                  value={form.destinationUrl}
                />
              </Field>
              {editing?.type !== "SYSTEM_LMS" ? (
                <>
                  <label className={styles.checkField}>
                    <input
                      checked={Boolean(form.openInNewTab)}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          openInNewTab: event.target.checked,
                        })
                      }
                      type="checkbox"
                    />{" "}
                    Open in a new tab
                  </label>
                  {editing ? (
                    <label className={styles.checkField}>
                      <input
                        checked={form.isActive}
                        onChange={(event) =>
                          setForm({ ...form, isActive: event.target.checked })
                        }
                        type="checkbox"
                      />{" "}
                      Visible to students
                    </label>
                  ) : null}
                </>
              ) : null}
            </div>
          </form>
        </AppModal>
      </div>
    </PageContainer>
  );
}

function Field({
  children,
  full,
  label,
}: {
  children: React.ReactNode;
  full?: boolean;
  label: string;
}) {
  return (
    <label className={full ? styles.fullField : styles.field}>
      <span>{label}</span>
      {children}
    </label>
  );
}
