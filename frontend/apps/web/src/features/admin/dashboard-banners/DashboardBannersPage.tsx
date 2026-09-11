"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Image as ImageIcon,
  Pencil,
  Plus,
  Trash2,
  UploadCloud,
  Video,
} from "lucide-react";

import { getApiErrorMessage, studentDashboardBannersApi } from "@repo/api";
import type {
  AdminStudentDashboardBanner,
  SaveStudentDashboardBannerRequest,
} from "@repo/types";
import { PageContainer } from "@repo/ui/dashboard";

import { AppModal } from "@/components/AppModal";
import { useProtectedMediaUrl } from "@/hooks/useProtectedMediaUrl";
import { useAcademicSessions } from "../academic/useAcademicSessions";
import { CrudSelect } from "../components/crud";
import styles from "./DashboardBannersPage.module.css";

type FormState = SaveStudentDashboardBannerRequest;
const emptyForm: FormState = {
  title: "",
  description: "",
  ctaLabel: "Learn more",
  destinationUrl: "",
  mediaType: "IMAGE",
  mediaUrl: "",
  mediaAlt: "",
  posterUrl: "",
  sessionIds: [],
  autoplay: false,
  openInNewTab: false,
  isActive: true,
  startsAt: null,
  endsAt: null,
};

export function DashboardBannersPage() {
  const academic = useAcademicSessions();
  const organizationId = academic.selectedOrganizationId;
  const sessionId = academic.selectedSessionId;
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<AdminStudentDashboardBanner | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const queryKey = ["admin", "dashboard-banners", organizationId, sessionId];
  const query = useQuery({
    enabled: Boolean(organizationId && sessionId),
    queryFn: () =>
      studentDashboardBannersApi.listAdmin(organizationId!, sessionId!),
    queryKey,
  });
  const banners = query.data ?? [];
  const activeBanners = banners.filter((banner) => banner.isActive);
  const imageBanners = banners.filter((banner) => banner.mediaType === "IMAGE");
  const videoBanners = banners.filter((banner) => banner.mediaType === "VIDEO");
  const organizationOptions = useMemo(
    () =>
      academic.organizations.map((item) => ({
        label: item.name,
        value: String(item.id),
      })),
    [academic.organizations],
  );
  const sessionOptions = useMemo(
    () =>
      academic.sessions.map((item) => ({
        label: item.name,
        value: String(item.id),
      })),
    [academic.sessions],
  );
  const refresh = () => queryClient.invalidateQueries({ queryKey });
  const save = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error("Select an organization.");
      if (!form.sessionIds.length)
        throw new Error("Select at least one session.");
      const payload: FormState = {
        ...form,
        title: form.title.trim(),
        description: form.description?.trim() || null,
        ctaLabel: form.ctaLabel?.trim() || null,
        destinationUrl: form.destinationUrl?.trim() || null,
        mediaUrl:
          form.mediaUrl.trim() || (imageFile ? "/images/dashboard.png" : ""),
        mediaAlt: form.mediaAlt?.trim() || null,
        posterUrl: form.posterUrl?.trim() || null,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      };
      let result = editing
        ? await studentDashboardBannersApi.update(editing.id, payload)
        : await studentDashboardBannersApi.create(organizationId, payload);
      if (imageFile)
        result = await studentDashboardBannersApi.uploadImage(
          result.id,
          "media",
          imageFile,
        );
      if (posterFile)
        result = await studentDashboardBannersApi.uploadImage(
          result.id,
          "poster",
          posterFile,
        );
      return result;
    },
    onError: (error) =>
      setMessage(getApiErrorMessage(error, "Banner could not be saved.")),
    onSuccess: async () => {
      await refresh();
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setImageFile(null);
      setPosterFile(null);
      setMessage("Dashboard banner saved.");
    },
  });
  const remove = useMutation({
    mutationFn: studentDashboardBannersApi.remove,
    onError: (error) =>
      setMessage(getApiErrorMessage(error, "Banner could not be deleted.")),
    onSuccess: async () => {
      await refresh();
      setMessage("Dashboard banner deleted.");
    },
  });
  const reorder = useMutation({
    mutationFn: (ids: number[]) =>
      studentDashboardBannersApi.reorder(organizationId!, sessionId!, ids),
    onError: (error) =>
      setMessage(
        getApiErrorMessage(error, "Banner order could not be updated."),
      ),
    onSuccess: refresh,
  });
  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, sessionIds: sessionId ? [sessionId] : [] });
    setImageFile(null);
    setPosterFile(null);
    setOpen(true);
  };
  const openEdit = (banner: AdminStudentDashboardBanner) => {
    setEditing(banner);
    setForm({
      title: banner.title,
      description: banner.description,
      ctaLabel: banner.ctaLabel,
      destinationUrl: banner.destinationUrl,
      mediaType: banner.mediaType,
      mediaUrl: banner.mediaUrl,
      mediaAlt: banner.mediaAlt,
      posterUrl: banner.posterUrl,
      sessionIds: banner.sessions.map((item) => item.sessionId),
      autoplay: banner.autoplay,
      openInNewTab: banner.openInNewTab,
      isActive: banner.isActive,
      startsAt: toLocalInput(banner.startsAt),
      endsAt: toLocalInput(banner.endsAt),
    });
    setImageFile(null);
    setPosterFile(null);
    setOpen(true);
  };
  const move = (index: number, delta: -1 | 1) => {
    const ids = banners.map(({ id }) => id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    reorder.mutate(ids);
  };

  return (
    <PageContainer>
      <div className={styles.page}>
        <section
          className={styles.headerGrid}
          aria-label="Dashboard banner summary"
        >
          <div className={styles.heroCard}>
            <img
              alt=""
              aria-hidden="true"
              className={styles.dotGrid}
              src="/exam-subject-assets/dot-grid.png"
            />
            <div>
              <span>Student experience</span>
              <h1>Dashboard Banners</h1>
              <p>
                Manage session-specific images and videos shown above the
                student course list.
              </p>
            </div>
            <span className={styles.heroIcon}>
              <Video aria-hidden="true" size={42} />
            </span>
          </div>

          <div className={styles.insightCard}>
            <span>Banner insights</span>
            <h2>Media coverage</h2>
            <div className={styles.insightStats}>
              <span>
                <CheckCircle2 aria-hidden="true" size={24} />
                <strong>{activeBanners.length}</strong>
                <small>Active</small>
              </span>
              <span>
                <ImageIcon aria-hidden="true" size={24} />
                <strong>{imageBanners.length}</strong>
                <small>Images</small>
              </span>
              <span>
                <Video aria-hidden="true" size={24} />
                <strong>{videoBanners.length}</strong>
                <small>Videos</small>
              </span>
            </div>
          </div>
        </section>

        <div className={styles.headerControls}>
          {academic.organizations.length > 1 ? (
            <CrudSelect
              ariaLabel="Organization"
              options={organizationOptions}
              value={organizationId ? String(organizationId) : ""}
              onChange={(value) =>
                academic.setSelectedOrganizationId(Number(value))
              }
              width="210px"
            />
          ) : null}
          <CrudSelect
            ariaLabel="Session"
            options={sessionOptions}
            value={sessionId ? String(sessionId) : ""}
            onChange={(value) => academic.setSelectedSessionId(Number(value))}
            width="210px"
          />
          <button
            className={styles.primary}
            disabled={!sessionId}
            onClick={openCreate}
            type="button"
          >
            <Plus size={16} /> Add banner
          </button>
        </div>

        {message ? <div className={styles.message}>{message}</div> : null}
        {query.isLoading ? (
          <div className={styles.state}>Loading banners…</div>
        ) : null}
        {!query.isLoading && banners.length === 0 ? (
          <div className={styles.state}>
            No banners are configured for this session. Students will see the
            default welcome card.
          </div>
        ) : null}
        <section className={styles.list}>
          {banners.map((banner, index) => (
            <article className={styles.row} key={banner.uuid}>
              <div className={styles.preview}>
                <BannerPreview banner={banner} />
              </div>
              <div className={styles.copy}>
                <div>
                  <h2>{banner.title || "Untitled video banner"}</h2>
                  <span>{banner.mediaType}</span>
                  <span>{banner.isActive ? "Active" : "Hidden"}</span>
                </div>
                <p>{banner.description || "No description"}</p>
                <small>
                  {banner.sessions
                    .map(({ session }) => session.name)
                    .join(", ")}
                </small>
              </div>
              <div className={styles.actions}>
                <button
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label="Move up"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  disabled={index === banners.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label="Move down"
                >
                  <ArrowDown size={16} />
                </button>
                <button onClick={() => openEdit(banner)} aria-label="Edit">
                  <Pencil size={16} />
                </button>
                <button
                  className={styles.danger}
                  onClick={() =>
                    window.confirm(`Delete “${banner.title}”?`) &&
                    remove.mutate(banner.id)
                  }
                  aria-label="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </section>

        <AppModal
          className="lms-organization-create-modal"
          description="Configure content, media, sessions, visibility and schedule."
          footer={
            <div className={styles.modalActions}>
              <button onClick={() => setOpen(false)} type="button">
                Cancel
              </button>
              <button
                className={styles.primary}
                disabled={save.isPending}
                form="dashboard-banner-form"
                type="submit"
              >
                {save.isPending ? "Saving…" : editing ? "Update" : "Create"}
              </button>
            </div>
          }
          isOpen={open}
          onClose={() => setOpen(false)}
          title={editing ? "Edit Dashboard Banner" : "Add Dashboard Banner"}
        >
          <form
            id="dashboard-banner-form"
            onSubmit={(event) => {
              event.preventDefault();
              setMessage(null);
              save.mutate();
            }}
          >
            <div className={styles.formGrid}>
              <Field
                label={
                  form.mediaType === "VIDEO" ? "Heading (optional)" : "Heading"
                }
              >
                <input
                  required={form.mediaType === "IMAGE"}
                  maxLength={120}
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                />
              </Field>
              <Field label="Media type">
                <select
                  value={form.mediaType}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      mediaType: event.target.value as "IMAGE" | "VIDEO",
                      mediaUrl: "",
                      posterUrl: "",
                      autoplay: false,
                    })
                  }
                >
                  <option value="IMAGE">Image</option>
                  <option value="VIDEO">Video</option>
                </select>
              </Field>
              <Field full label="Description (optional)">
                <textarea
                  rows={2}
                  maxLength={500}
                  value={form.description ?? ""}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                />
              </Field>
              <Field label="CTA label (optional)">
                <input
                  maxLength={80}
                  value={form.ctaLabel ?? ""}
                  onChange={(event) =>
                    setForm({ ...form, ctaLabel: event.target.value })
                  }
                />
              </Field>
              <Field label="Destination URL (optional)">
                <input
                  value={form.destinationUrl ?? ""}
                  placeholder="/student/my-courses or https://…"
                  onChange={(event) =>
                    setForm({ ...form, destinationUrl: event.target.value })
                  }
                />
              </Field>
              <Field
                full
                label={form.mediaType === "IMAGE" ? "Image URL" : "Video URL"}
              >
                <input
                  required={!imageFile}
                  value={form.mediaUrl}
                  placeholder={
                    form.mediaType === "IMAGE"
                      ? "https://… or choose an image below"
                      : "YouTube, Vimeo, MP4, WebM, HLS or another HTTPS URL"
                  }
                  onChange={(event) =>
                    setForm({ ...form, mediaUrl: event.target.value })
                  }
                />
              </Field>
              {form.mediaType === "IMAGE" ? (
                <Upload
                  label="Banner image"
                  file={imageFile}
                  setFile={setImageFile}
                />
              ) : (
                <>
                  <Field full label="Poster URL (optional)">
                    <input
                      value={form.posterUrl ?? ""}
                      onChange={(event) =>
                        setForm({ ...form, posterUrl: event.target.value })
                      }
                    />
                  </Field>
                  <Upload
                    label="Video poster"
                    file={posterFile}
                    setFile={setPosterFile}
                  />
                  <label className={styles.check}>
                    <input
                      type="checkbox"
                      checked={Boolean(form.autoplay)}
                      onChange={(event) =>
                        setForm({ ...form, autoplay: event.target.checked })
                      }
                    />{" "}
                    Autoplay video (muted)
                  </label>
                </>
              )}
              <Field full label="Media alternative text">
                <input
                  maxLength={200}
                  value={form.mediaAlt ?? ""}
                  onChange={(event) =>
                    setForm({ ...form, mediaAlt: event.target.value })
                  }
                />
              </Field>
              <div className={styles.full}>
                <strong>Sessions</strong>
                <div className={styles.sessions}>
                  {academic.sessions.map((session) => (
                    <label key={session.id}>
                      <input
                        type="checkbox"
                        checked={form.sessionIds.includes(session.id)}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            sessionIds: event.target.checked
                              ? [...form.sessionIds, session.id]
                              : form.sessionIds.filter(
                                  (id) => id !== session.id,
                                ),
                          })
                        }
                      />{" "}
                      {session.name}
                    </label>
                  ))}
                </div>
              </div>
              <Field label="Show from">
                <input
                  type="datetime-local"
                  value={form.startsAt ?? ""}
                  onChange={(event) =>
                    setForm({ ...form, startsAt: event.target.value || null })
                  }
                />
              </Field>
              <Field label="Show until">
                <input
                  type="datetime-local"
                  value={form.endsAt ?? ""}
                  onChange={(event) =>
                    setForm({ ...form, endsAt: event.target.value || null })
                  }
                />
              </Field>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={Boolean(form.isActive)}
                  onChange={(event) =>
                    setForm({ ...form, isActive: event.target.checked })
                  }
                />{" "}
                Visible to students
              </label>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={Boolean(form.openInNewTab)}
                  onChange={(event) =>
                    setForm({ ...form, openInNewTab: event.target.checked })
                  }
                />{" "}
                Open CTA in new tab
              </label>
            </div>
          </form>
        </AppModal>
      </div>
    </PageContainer>
  );
}

function BannerPreview({ banner }: { banner: AdminStudentDashboardBanner }) {
  const source = useProtectedMediaUrl(
    banner.mediaType === "IMAGE" ? banner.mediaUrl : banner.posterUrl,
  );
  return source ? (
    <img alt={banner.mediaAlt ?? banner.title} src={source} />
  ) : (
    <Video aria-label="Video banner" size={34} />
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
    <label className={full ? styles.full : styles.field}>
      <strong>{label}</strong>
      {children}
    </label>
  );
}
function Upload({
  file,
  label,
  setFile,
}: {
  file: File | null;
  label: string;
  setFile: (file: File | null) => void;
}) {
  return (
    <div className={styles.full}>
      <strong>{label}</strong>
      <label className={styles.upload}>
        <UploadCloud size={17} />{" "}
        {file?.name ?? "Choose JPEG, PNG, WebP, GIF or AVIF"}
        <input
          hidden
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  );
}
function toLocalInput(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}
