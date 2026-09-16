"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getApiErrorMessage, studentDashboardBannersApi } from "@repo/api";
import type { AdminStudentDashboardBanner } from "@repo/types";
import { PageContainer } from "@repo/ui/dashboard";

import { useAcademicSessions } from "../academic/useAcademicSessions";
import { DashboardBannerModal } from "./components/form/DashboardBannerModal";
import { BannerContextControls } from "./components/header/BannerContextControls";
import { DashboardBannersHeader } from "./components/header/DashboardBannersHeader";
import { DashboardBannerList } from "./components/list/DashboardBannerList";
import { EMPTY_DASHBOARD_BANNER_FORM } from "./constants";
import type { DashboardBannerFormState } from "./types";
import { buildDashboardBannerPayload } from "./utils/buildDashboardBannerPayload";
import { createDashboardBannerForm } from "./utils/createDashboardBannerForm";
import { reorderDashboardBannerIds } from "./utils/reorderDashboardBanners";
import styles from "./DashboardBannersPage.module.css";

export const DashboardBannersPage = () => {
  const academic = useAcademicSessions();
  const organizationId = academic.selectedOrganizationId;
  const sessionId = academic.selectedSessionId;
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<AdminStudentDashboardBanner | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<DashboardBannerFormState>(
    EMPTY_DASHBOARD_BANNER_FORM,
  );
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
      const payload = buildDashboardBannerPayload({ form, imageFile });
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
      setForm(EMPTY_DASHBOARD_BANNER_FORM);
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
    setForm(createDashboardBannerForm(null, sessionId));
    setImageFile(null);
    setPosterFile(null);
    setOpen(true);
  };
  const openEdit = (banner: AdminStudentDashboardBanner) => {
    setEditing(banner);
    setForm(createDashboardBannerForm(banner));
    setImageFile(null);
    setPosterFile(null);
    setOpen(true);
  };
  const move = (index: number, delta: -1 | 1) => {
    const ids = reorderDashboardBannerIds(banners, index, delta);
    if (ids) reorder.mutate(ids);
  };

  return (
    <PageContainer>
      <div className={styles.page}>
        <DashboardBannersHeader
          activeCount={activeBanners.length}
          imageCount={imageBanners.length}
          videoCount={videoBanners.length}
        />
        <BannerContextControls
          onCreate={openCreate}
          organizationId={organizationId}
          organizationOptions={organizationOptions}
          sessionId={sessionId}
          sessionOptions={sessionOptions}
          setOrganizationId={academic.setSelectedOrganizationId}
          setSessionId={academic.setSelectedSessionId}
        />

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
        <DashboardBannerList
          banners={banners}
          onDelete={(banner) => {
            if (window.confirm(`Delete “${banner.title}”?`)) {
              remove.mutate(banner.id);
            }
          }}
          onEdit={openEdit}
          onMove={move}
        />

        <DashboardBannerModal
          editing={editing}
          form={form}
          imageFile={imageFile}
          isOpen={open}
          isSaving={save.isPending}
          onClose={() => setOpen(false)}
          onSubmit={(event) => {
            event.preventDefault();
            setMessage(null);
            save.mutate();
          }}
          posterFile={posterFile}
          sessions={academic.sessions}
          setForm={setForm}
          setImageFile={setImageFile}
          setPosterFile={setPosterFile}
        />
      </div>
    </PageContainer>
  );
};
