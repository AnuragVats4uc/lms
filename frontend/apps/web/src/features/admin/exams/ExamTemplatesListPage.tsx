"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { examsApi, organizationsApi } from "@repo/api";
import { useCurrentUser } from "@repo/auth";
import type { ExamTemplateListItem, ExamTemplateStatus } from "@repo/types";
import {
  CheckCircle2,
  Eye,
  FileText,
  Layers3,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import { CrudSelect } from "../components/crud";
import styles from "./ExamManagementPage.module.css";

const templateStatusOptions = [
  { label: "All statuses", value: "all" },
  { label: "Draft", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Archived", value: "ARCHIVED" },
] as const;

const templateDuration = (template: ExamTemplateListItem) =>
  template._summary?.durationMinutes ??
  template.versions[0]?.defaultDurationMinutes ??
  null;

const templateStructure = (template: ExamTemplateListItem) => {
  const summary = template._summary;
  if (!summary) return "Not configured";
  return `${summary.slotCount} ${summary.slotCount === 1 ? "slot" : "slots"} · ${summary.sectionCount} ${summary.sectionCount === 1 ? "section" : "sections"} · ${summary.questionCount} questions`;
};

const templateStatus = (template: ExamTemplateListItem) =>
  template._summary?.latestVersionStatus ??
  template.versions[0]?.status ??
  template.status;

export function ExamTemplatesListPage() {
  const currentUser = useCurrentUser();
  const router = useRouter();
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<
    number | undefined
  >(currentUser?.organizationId ?? undefined);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      300,
    );
    return () => window.clearTimeout(timer);
  }, [search]);

  const organizations = useQuery({
    queryKey: ["exam-template-list-organizations"],
    queryFn: () => organizationsApi.findAll({ page: 1, limit: 100 }),
    enabled: !currentUser?.organizationId,
  });
  const organizationId =
    currentUser?.organizationId ??
    selectedOrganizationId ??
    organizations.data?.items[0]?.id;

  const templates = useQuery({
    queryKey: [
      "exam-template-list",
      organizationId,
      debouncedSearch,
      status,
    ],
    queryFn: () =>
      examsApi.templates.list({
        organizationId,
        search: debouncedSearch || undefined,
        status:
          status === "all" ? undefined : (status as ExamTemplateStatus),
      }),
    enabled: Boolean(organizationId),
  });

  const rows = templates.data ?? [];
  const stats = useMemo(
    () => ({
      total: rows.length,
      published: rows.filter((template) => templateStatus(template) === "PUBLISHED")
        .length,
      draft: rows.filter((template) => templateStatus(template) === "DRAFT")
        .length,
    }),
    [rows],
  );

  return (
    <main className={`${styles.page} ${styles.templateListPage}`}>
      <section className={styles.templateHeroGrid} aria-label="Template summary">
        <div className={styles.templateHeroCard}>
          <div>
            <p>Assessment Management</p>
            <h1>Exam Templates</h1>
            <span>
              Create reusable exam blueprints with timing, sections, and
              question mapping before scheduling.
            </span>
          </div>
          <span className={styles.templateHeroIcon}>
            <Layers3 size={52} />
          </span>
        </div>

        <div className={styles.templateCountCard}>
          <span className={styles.templateCountDot} />
          <span className={styles.templateCountIcon}>
            <FileText size={28} />
          </span>
          <strong>{stats.total}</strong>
          <p>
            Total
            <span>templates</span>
          </p>
        </div>

        <div className={styles.templateInsightCard}>
          <div>
            <p>Template Insights</p>
            <h2>Ready for scheduling</h2>
            <div className={styles.templateInsightStats}>
              <span>
                <CheckCircle2 size={22} />
                <strong>{stats.published}</strong>
                <small>Published</small>
              </span>
              <span>
                <FileText size={22} />
                <strong>{stats.draft}</strong>
                <small>Draft</small>
              </span>
            </div>
          </div>
          <button
            className={styles.templateHeroButton}
            disabled={!organizationId}
            onClick={() => router.push("/admin/exams/templates/builder")}
            type="button"
          >
            <Plus size={18} />
            Create template
          </button>
        </div>
      </section>

      <section className={styles.templateTableCard}>
        <div className={styles.templateTableTitle}>
          <h2>Your exam templates</h2>
        </div>
        <div className={styles.templateTableToolbar}>
          {!currentUser?.organizationId ? (
            <CrudSelect
              ariaLabel="Organization"
              label="Organization"
              loading={organizations.isLoading}
              onChange={(value) =>
                setSelectedOrganizationId(Number(value) || undefined)
              }
              options={
                organizations.data?.items.map((organization) => ({
                  label: organization.name,
                  value: String(organization.id),
                })) ?? []
              }
              placeholder="Choose organization"
              value={organizationId?.toString() ?? ""}
              width="100%"
            />
          ) : null}
          <label className={styles.templateSearchBox}>
            <Search size={18} aria-hidden="true" />
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search templates..."
              type="search"
              value={search}
            />
          </label>
          <CrudSelect
            ariaLabel="Filter templates by status"
            onChange={setStatus}
            options={templateStatusOptions}
            value={status}
            width="100%"
          />
        </div>
        <div className={styles.templateTableWrap}>
          <table className={styles.templateTable}>
            <thead>
              <tr>
                <th>Template name</th>
                <th>Duration</th>
                <th>Structure</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!rows.length ? (
                <tr>
                  <td colSpan={6}>
                    <div className={styles.templateTableEmpty}>
                      {organizationId
                        ? "No templates found."
                        : "Choose an organization to view templates."}
                    </div>
                  </td>
                </tr>
              ) : null}
              {rows.map((template) => {
                const duration = templateDuration(template);
                const updatedAt = (template as { updatedAt?: string }).updatedAt;
                return (
                  <tr key={template.id}>
                    <td>
                      <div className={styles.templateNameCell}>
                        <span>
                          <Layers3 size={18} />
                        </span>
                        <div>
                          <strong>{template.name}</strong>
                        </div>
                      </div>
                    </td>
                    <td>{duration ? `${duration} min` : "Not set"}</td>
                    <td>{templateStructure(template)}</td>
                    <td>
                      <span
                        className={styles.templateStatusPill}
                        data-status={templateStatus(template)}
                      >
                        {String(templateStatus(template)).toLowerCase()}
                      </span>
                    </td>
                    <td>
                      {updatedAt
                        ? new Intl.DateTimeFormat("en", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }).format(new Date(updatedAt))
                        : "-"}
                      <small>by Super Admin</small>
                    </td>
                    <td>
                      <div className={styles.templateActionButtons}>
                        <button
                          aria-label={`Edit ${template.name}`}
                          onClick={() =>
                            router.push(
                              `/admin/exams/templates/${template.id}/builder`,
                            )
                          }
                          type="button"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          aria-label={`Preview ${template.name}`}
                          onClick={() =>
                            router.push(
                              `/admin/exams/templates/${template.id}/builder?preview=1`,
                            )
                          }
                          type="button"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className={styles.templateTableFooter}>
          Showing 1 to {rows.length} of {rows.length} templates
        </p>
      </section>
    </main>
  );
}
