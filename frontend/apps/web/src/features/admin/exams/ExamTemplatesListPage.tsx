"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { examsApi, organizationsApi } from "@repo/api";
import { useCurrentUser } from "@repo/auth";
import type { ExamSubject, ExamTemplateListItem, ExamTemplateStatus } from "@repo/types";
import {
  CheckCircle2,
  Eye,
  FileText,
  Layers3,
  Pencil,
  Plus,
  Search,
  type LucideIcon,
} from "lucide-react";
import { CrudSelect } from "../components/crud";
import styles from "./ExamManagementPage.module.css";

const templateStatusOptions = [
  { label: "All statuses", value: "all" },
  { label: "Draft", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Archived", value: "ARCHIVED" },
] as const;

const templateSubject = (template: ExamTemplateListItem) =>
  template._summary?.subject ?? template.primarySubject ?? null;

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
  const organizationId = currentUser?.organizationId ?? selectedOrganizationId;
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [subjectId, setSubjectId] = useState("all");
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
  const subjects = useQuery({
    queryKey: ["exam-template-list-subjects", organizationId],
    queryFn: () => examsApi.subjects.list(organizationId),
    enabled: Boolean(organizationId),
  });
  const templates = useQuery({
    queryKey: [
      "exam-template-list",
      organizationId,
      debouncedSearch,
      subjectId,
      status,
    ],
    queryFn: () =>
      examsApi.templates.list({
        organizationId,
        search: debouncedSearch || undefined,
        subjectId: subjectId === "all" ? undefined : Number(subjectId),
        status:
          status === "all" ? undefined : (status as ExamTemplateStatus),
        page: 1,
        limit: 100,
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
      <header className={styles.templateListHeader}>
        <div>
          <h1>Exam Templates</h1>
          <p>Create reusable exam blueprints, then schedule them when ready.</p>
        </div>
        <button
          className={styles.templateCreateButton}
          disabled={!organizationId}
          onClick={() => router.push("/admin/exams/templates/builder")}
          type="button"
        >
          <Plus size={20} />
          Create template
        </button>
      </header>

      {!currentUser?.organizationId ? (
        <section className={styles.templateListOrgRow}>
          <CrudSelect
            ariaLabel="Organization"
            label="Organization"
            loading={organizations.isLoading}
            onChange={(value) => setSelectedOrganizationId(Number(value) || undefined)}
            options={
              organizations.data?.items.map((organization) => ({
                label: organization.name,
                value: String(organization.id),
              })) ?? []
            }
            placeholder="Choose organization"
            value={selectedOrganizationId?.toString() ?? ""}
            variant="form"
            width="100%"
          />
        </section>
      ) : null}

      <section className={styles.templateStatsGrid}>
        <TemplateStat icon={Layers3} label="Total templates" title="templates" value={stats.total} />
        <TemplateStat icon={CheckCircle2} label="Templates published" title="published" value={stats.published} />
        <TemplateStat icon={FileText} label="Templates in draft" title="draft" value={stats.draft} />
      </section>

      <section className={styles.templateTableCard}>
        <div className={styles.templateTableTitle}>
          <h2>Your exam templates</h2>
        </div>
        <div className={styles.templateTableToolbar}>
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
            ariaLabel="Filter templates by subject"
            onChange={setSubjectId}
            options={[
              { label: "All subjects", value: "all" },
              ...((subjects.data ?? []) as ExamSubject[]).map((subject) => ({
                label: subject.name,
                value: String(subject.id),
              })),
            ]}
            value={subjectId}
            width="100%"
          />
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
                <th>Subject</th>
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
                  <td colSpan={7}>
                    <div className={styles.templateTableEmpty}>
                      {organizationId
                        ? "No templates found."
                        : "Choose an organization to view templates."}
                    </div>
                  </td>
                </tr>
              ) : null}
              {rows.map((template) => {
                const subject = templateSubject(template);
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
                          <small>{template.code}</small>
                        </div>
                      </div>
                    </td>
                    <td>{subject?.name ?? "Not selected"}</td>
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

function TemplateStat({
  icon: Icon,
  label,
  title,
  value,
}: {
  icon: LucideIcon;
  label: string;
  title: string;
  value: number;
}) {
  return (
    <article className={styles.templateStatCard}>
      <span>
        <Icon size={31} />
      </span>
      <div>
        <strong>{value}</strong>
        <b>{title}</b>
        <small>{label}</small>
      </div>
    </article>
  );
}
