"use client";

import {
  type FormEvent,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  GraduationCap,
  Link2,
  MapPin,
  Power,
  Save,
  Settings2,
  UserRound,
} from "lucide-react";
import { registrationApi, sessionCoursesApi } from "@repo/api";
import type {
  AdminRegistrationPage,
  CreateRegistrationPageRequest,
  RegistrationMasterOption,
  SessionCourse,
  UpdateRegistrationPageRequest,
} from "@repo/types";

import { useAcademicSessions } from "../academic/useAcademicSessions";
import { CrudBadge } from "../components/crud/CrudBadge";
import { CrudSelect } from "../components/crud/CrudSelect";

type SettingsForm = {
  slug: string;
  title: string;
  description: string;
  logoOverride: string;
  heroImage: string;
  primaryColor: string;
  accentColor: string;
  supportEmail: string;
  supportPhone: string;
  submitButtonText: string;
  successTitle: string;
  successMessage: string;
  registrationEnabled: boolean;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  selectedSessionCourseUuids: string[];
  selectedEducationOptionUuids: string[];
  selectedDigitalLibraryLocationUuids: string[];
};

const emptyForm: SettingsForm = {
  slug: "",
  title: "Student Registration",
  description: "",
  logoOverride: "",
  heroImage: "",
  primaryColor: "#059669",
  accentColor: "#2563EB",
  supportEmail: "",
  supportPhone: "",
  submitButtonText: "Submit Registration",
  successTitle: "Registration Successful",
  successMessage: "",
  registrationEnabled: false,
  status: "DRAFT",
  selectedSessionCourseUuids: [],
  selectedEducationOptionUuids: [],
  selectedDigitalLibraryLocationUuids: [],
};

export default function StudentRegistrationSettingsPage() {
  const academic = useAcademicSessions();
  const queryClient = useQueryClient();
  const organizationId = academic.selectedOrganizationId;
  const sessionId = academic.selectedSessionId;
  const [formDraft, setFormDraft] = useState<{
    sourceKey: string;
    value: SettingsForm;
  } | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const pagesQuery = useQuery({
    enabled: organizationId !== null,
    queryFn: () => registrationApi.listAdmin(organizationId as number),
    queryKey: ["admin", "registration-pages", organizationId],
  });

  const sessionCoursesQuery = useQuery({
    enabled: sessionId !== null,
    queryFn: () =>
      sessionCoursesApi.findAll(sessionId as number, {
        limit: 100,
        status: "ACTIVE",
      }),
    queryKey: ["admin", "registration-session-courses", sessionId],
  });

  const educationOptionsQuery = useQuery({
    enabled: organizationId !== null,
    queryFn: () =>
      registrationApi.listEducationOptions(organizationId as number, {
        limit: 100,
        isActive: true,
      }),
    queryKey: ["admin", "registration-education-options", organizationId],
  });

  const digitalLibraryLocationsQuery = useQuery({
    enabled: organizationId !== null,
    queryFn: () =>
      registrationApi.listDigitalLibraryLocations(organizationId as number, {
        limit: 100,
        isActive: true,
      }),
    queryKey: ["admin", "registration-library-locations", organizationId],
  });

  const pages = useMemo(
    () => pagesQuery.data?.items ?? [],
    [pagesQuery.data?.items],
  );
  const selectedPage = useMemo(
    () => pages.find((page) => page.id === selectedPageId) ?? pages[0] ?? null,
    [pages, selectedPageId],
  );
  const selectedPageForm = useMemo(
    () => (selectedPage ? toForm(selectedPage) : null),
    [selectedPage],
  );
  const selectedOrganizationSlug = useMemo(() => {
    if (!organizationId) return "";
    const organization = academic.organizations.find(
      (item) => item.id === organizationId,
    );
    return slugify(organization?.code ?? organization?.name ?? "");
  }, [academic.organizations, organizationId]);
  const formSourceKey = selectedPage
    ? `page:${selectedPage.id}`
    : `new:${organizationId ?? "none"}:${selectedOrganizationSlug}`;
  const defaultForm = useMemo(
    () => selectedPageForm ?? { ...emptyForm, slug: selectedOrganizationSlug },
    [selectedPageForm, selectedOrganizationSlug],
  );
  const form =
    formDraft?.sourceKey === formSourceKey ? formDraft.value : defaultForm;
  const setForm = useCallback(
    (updater: SetStateAction<SettingsForm>) => {
      setFormDraft((current) => {
        const currentValue =
          current?.sourceKey === formSourceKey ? current.value : defaultForm;
        const nextValue =
          typeof updater === "function"
            ? (updater as (value: SettingsForm) => SettingsForm)(currentValue)
            : updater;
        return { sourceKey: formSourceKey, value: nextValue };
      });
    },
    [defaultForm, formSourceKey],
  );
  const publicUrl = useMemo(
    () =>
      typeof window === "undefined" || !form.slug
        ? ""
        : `${window.location.origin}/register/${form.slug}`,
    [form.slug],
  );
  const availableCourses = useMemo(
    () =>
      (sessionCoursesQuery.data?.items ?? []).filter(
        (sessionCourse) =>
          sessionCourse.isActive &&
          sessionCourse.isPublished &&
          sessionCourse.status === "ACTIVE" &&
          sessionCourse.course.isActive &&
          sessionCourse.course.status === "ACTIVE",
      ),
    [sessionCoursesQuery.data?.items],
  );
  const availableEducationOptions = educationOptionsQuery.data?.items ?? [];
  const availableDigitalLibraryLocations =
    digitalLibraryLocationsQuery.data?.items ?? [];

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId || !sessionId) {
        throw new Error("Select an organization and session first.");
      }
      const payload = toPayload(form, sessionId);
      return selectedPage
        ? registrationApi.updateAdmin(
            organizationId,
            selectedPage.id,
            payload as UpdateRegistrationPageRequest,
          )
        : registrationApi.createAdmin(
            organizationId,
            payload as CreateRegistrationPageRequest,
          );
    },
    onSuccess: async (page) => {
      setSelectedPageId(page.id);
      setMessage("Registration settings saved.");
      await queryClient.invalidateQueries({
        queryKey: ["admin", "registration-pages", organizationId],
      });
    },
    onError: (error) =>
      setMessage(
        errorMessage(error, "Registration settings could not be saved."),
      ),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    if (!form.selectedSessionCourseUuids.length) {
      setMessage("Select at least one course for this registration page.");
      return;
    }
    if (!form.selectedEducationOptionUuids.length) {
      setMessage("Select at least one education option.");
      return;
    }
    if (!form.selectedDigitalLibraryLocationUuids.length) {
      setMessage("Select at least one Digital Library Location.");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <div className="registration-admin-page">
      <header className="registration-admin-header">
        <div>
          <span>Organization Settings</span>
          <h1>Student Registration</h1>
          <p>
            Configure the public white-label link, branding, custom fields, and
            session-driven course options.
          </p>
        </div>
        <div className="registration-admin-header-actions">
          {academic.organizations.length ? (
            <CrudSelect
              ariaLabel="Select organization"
              label="Organization"
              onChange={(value) => {
                academic.setSelectedOrganizationId(Number(value));
                academic.setSelectedSessionId(null);
                setSelectedPageId(null);
              }}
              options={academic.organizations.map((organization) => ({
                label: organization.name,
                value: String(organization.id),
              }))}
              value={organizationId ? String(organizationId) : ""}
            />
          ) : null}
          <CrudSelect
            ariaLabel="Select registration session"
            label="Registration Session"
            onChange={(value) => {
              academic.setSelectedSessionId(Number(value));
              setForm((current) => ({
                ...current,
                selectedSessionCourseUuids: [],
              }));
            }}
            options={academic.sessions.map((session) => ({
              label: session.name,
              value: String(session.id),
            }))}
            value={sessionId ? String(sessionId) : ""}
          />
        </div>
      </header>

      <div className="registration-admin-layout">
        <form className="registration-admin-form" onSubmit={submit}>
          <section>
            <div className="registration-admin-section-title">
              <Settings2 size={17} />
              <strong>Registration Status</strong>
            </div>
            <div className="registration-toggle-row">
              <Power size={18} />
              <div>
                <strong>Student Registration</strong>
                <span>
                  {form.registrationEnabled
                    ? "Public form is open"
                    : "Public form is closed"}
                </span>
              </div>
              <label className="registration-switch">
                <input
                  checked={form.registrationEnabled}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      registrationEnabled: event.target.checked,
                      status: event.target.checked ? "ACTIVE" : current.status,
                    }))
                  }
                  type="checkbox"
                />
                <span />
              </label>
            </div>
            <div className="registration-admin-grid">
              <TextInput
                label="Public slug"
                onChange={(value) =>
                  setForm((current) => ({ ...current, slug: slugify(value) }))
                }
                required
                value={form.slug}
              />
              <label className="registration-admin-field">
                <span>Status</span>
                <select
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as SettingsForm["status"],
                    }))
                  }
                  value={form.status}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </label>
            </div>
          </section>

          <section>
            <div className="registration-admin-section-title">
              <BookOpen size={17} />
              <strong>Registration Choices</strong>
            </div>
            <p className="registration-admin-empty">
              Choose exactly what students can select on this public
              registration page.
            </p>
            <div className="registration-choice-grid">
              <OptionPicker
                emptyLabel="No active published courses are available in this session."
                getDescription={(course) => course.course.code}
                getLabel={(course) => course.displayName ?? course.course.name}
                getUuid={(course) => course.uuid}
                icon={<BookOpen size={15} />}
                items={availableCourses}
                onChange={(uuids) =>
                  setForm((current) => ({
                    ...current,
                    selectedSessionCourseUuids: uuids,
                  }))
                }
                selectedUuids={form.selectedSessionCourseUuids}
                title="Courses"
              />
              <OptionPicker
                emptyLabel="No active education options are configured."
                getDescription={(option) => `Order ${option.sortOrder}`}
                getLabel={(option) => option.name}
                getUuid={(option) => option.uuid}
                icon={<GraduationCap size={15} />}
                items={availableEducationOptions}
                onChange={(uuids) =>
                  setForm((current) => ({
                    ...current,
                    selectedEducationOptionUuids: uuids,
                  }))
                }
                selectedUuids={form.selectedEducationOptionUuids}
                title="Education Options"
              />
              <OptionPicker
                emptyLabel="No active library locations are configured."
                getDescription={(location) => `Order ${location.sortOrder}`}
                getLabel={(location) => location.name}
                getUuid={(location) => location.uuid}
                icon={<MapPin size={15} />}
                items={availableDigitalLibraryLocations}
                onChange={(uuids) =>
                  setForm((current) => ({
                    ...current,
                    selectedDigitalLibraryLocationUuids: uuids,
                  }))
                }
                selectedUuids={form.selectedDigitalLibraryLocationUuids}
                title="Library Locations"
              />
            </div>
          </section>

          <section>
            <div className="registration-admin-section-title">
              <Link2 size={17} />
              <strong>Public Registration URL</strong>
            </div>
            <div className="registration-url-box">
              <span>{publicUrl || "Save a slug to generate the link."}</span>
              <button
                disabled={!publicUrl}
                onClick={() => void navigator.clipboard?.writeText(publicUrl)}
                type="button"
              >
                <Clipboard size={15} />
                Copy
              </button>
              <a
                aria-disabled={!publicUrl}
                href={publicUrl || "#"}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink size={15} />
                Preview
              </a>
            </div>
          </section>

          <section>
            <div className="registration-admin-section-title">
              <Settings2 size={17} />
              <strong>Branding Settings</strong>
            </div>
            <div className="registration-admin-grid">
              <TextInput
                label="Registration title"
                onChange={(value) =>
                  setForm((current) => ({ ...current, title: value }))
                }
                required
                value={form.title}
              />
              <TextInput
                label="Submit button text"
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    submitButtonText: value,
                  }))
                }
                required
                value={form.submitButtonText}
              />
              <TextInput
                label="Logo override URL"
                onChange={(value) =>
                  setForm((current) => ({ ...current, logoOverride: value }))
                }
                value={form.logoOverride}
              />
              <TextInput
                label="Hero image URL"
                onChange={(value) =>
                  setForm((current) => ({ ...current, heroImage: value }))
                }
                value={form.heroImage}
              />
              <ColorInput
                label="Primary color"
                onChange={(value) =>
                  setForm((current) => ({ ...current, primaryColor: value }))
                }
                value={form.primaryColor}
              />
              <ColorInput
                label="Accent color"
                onChange={(value) =>
                  setForm((current) => ({ ...current, accentColor: value }))
                }
                value={form.accentColor}
              />
            </div>
            <TextArea
              label="Description"
              onChange={(value) =>
                setForm((current) => ({ ...current, description: value }))
              }
              value={form.description}
            />
          </section>

          <section>
            <div className="registration-admin-section-title">
              <CheckCircle2 size={17} />
              <strong>Success Message</strong>
            </div>
            <div className="registration-admin-grid">
              <TextInput
                label="Success title"
                onChange={(value) =>
                  setForm((current) => ({ ...current, successTitle: value }))
                }
                required
                value={form.successTitle}
              />
              <TextInput
                label="Support email"
                onChange={(value) =>
                  setForm((current) => ({ ...current, supportEmail: value }))
                }
                value={form.supportEmail}
              />
            </div>
            <TextArea
              label="Success message"
              onChange={(value) =>
                setForm((current) => ({ ...current, successMessage: value }))
              }
              value={form.successMessage}
            />
          </section>

          {message ? (
            <div className="registration-admin-message">{message}</div>
          ) : null}

          <button
            className="registration-admin-save"
            disabled={!organizationId || !sessionId || saveMutation.isPending}
            type="submit"
          >
            <Save size={16} />
            {saveMutation.isPending
              ? "Saving..."
              : "Save Registration Settings"}
          </button>
        </form>

        <aside className="registration-admin-side">
          <section>
            <div className="registration-admin-section-title">
              <BookOpen size={17} />
              <strong>Courses available on registration page</strong>
            </div>
            <p>
              These options are selected from the session courses configured
              above and are not custom field options.
            </p>
            <div className="registration-course-preview">
              {availableCourses
                .filter((course) =>
                  form.selectedSessionCourseUuids.includes(course.uuid),
                )
                .map((course) => (
                  <span key={course.uuid}>
                    <CheckCircle2 size={14} />
                    {course.displayName ?? course.course.name}
                  </span>
                ))}
              {!form.selectedSessionCourseUuids.length ? (
                <div className="registration-admin-empty">
                  Select courses in Registration Choices.
                </div>
              ) : null}
            </div>
          </section>

          <section>
            <div className="registration-admin-section-title">
              <Settings2 size={17} />
              <strong>Configured Fields</strong>
            </div>
            <div className="registration-field-preview">
              <ConfiguredField
                description="Student's full name"
                icon={<UserRound size={16} />}
                name="Student Name"
                required
              />
              <ConfiguredField
                description="Student gender"
                icon={<UserRound size={16} />}
                name="Gender"
                required
              />
              <ConfiguredField
                description="Student date of birth"
                icon={<UserRound size={16} />}
                name="Date of Birth"
                required
              />
              <ConfiguredField
                description="Primary contact number"
                icon={<UserRound size={16} />}
                name="Mobile Number"
                required
              />
              <ConfiguredField
                description="Optional account email"
                icon={<UserRound size={16} />}
                name="Email Address"
              />
              <ConfiguredField
                description="Loaded from organization education options"
                icon={<GraduationCap size={16} />}
                name="Education"
                required
                system
              />
              <ConfiguredField
                description="Loaded from organization library locations"
                icon={<MapPin size={16} />}
                name="Digital Library Location"
                required
                system
              />
              <ConfiguredField
                description="Loaded from the configured session courses"
                icon={<BookOpen size={16} />}
                name="Which course/exam are you preparing for?"
                required
                system
              />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function TextInput({
  label,
  onChange,
  required,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="registration-admin-field">
      <span>{label}</span>
      <input
        onChange={(event) => onChange(event.target.value)}
        required={required}
        value={value}
      />
    </label>
  );
}

function ColorInput({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="registration-admin-field">
      <span>{label}</span>
      <div className="registration-color-input">
        <input
          onChange={(event) => onChange(event.target.value)}
          type="color"
          value={value || "#059669"}
        />
        <input
          onChange={(event) => onChange(event.target.value)}
          pattern="^#[0-9a-fA-F]{6}$"
          value={value}
        />
      </div>
    </label>
  );
}

function TextArea({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="registration-admin-field">
      <span>{label}</span>
      <textarea
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function OptionPicker<TItem extends SessionCourse | RegistrationMasterOption>({
  emptyLabel,
  getDescription,
  getLabel,
  getUuid,
  icon,
  items,
  onChange,
  selectedUuids,
  title,
}: {
  emptyLabel: string;
  getDescription: (item: TItem) => string | null | undefined;
  getLabel: (item: TItem) => string;
  getUuid: (item: TItem) => string;
  icon: ReactNode;
  items: TItem[];
  onChange: (uuids: string[]) => void;
  selectedUuids: string[];
  title: string;
}) {
  const selected = new Set(selectedUuids);
  return (
    <div className="registration-choice-panel">
      <div className="registration-choice-panel-title">
        {icon}
        <strong>{title}</strong>
        <span>{selectedUuids.length}</span>
      </div>
      {items.length ? (
        <div className="registration-choice-list">
          {items.map((item) => {
            const uuid = getUuid(item);
            const checked = selected.has(uuid);
            return (
              <label className="registration-choice-item" key={uuid}>
                <input
                  checked={checked}
                  onChange={() =>
                    onChange(
                      checked
                        ? selectedUuids.filter((itemUuid) => itemUuid !== uuid)
                        : [...selectedUuids, uuid],
                    )
                  }
                  type="checkbox"
                />
                <span>
                  <strong>{getLabel(item)}</strong>
                  {getDescription(item) ? (
                    <small>{getDescription(item)}</small>
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>
      ) : (
        <div className="registration-admin-empty">{emptyLabel}</div>
      )}
    </div>
  );
}

function toForm(page: AdminRegistrationPage): SettingsForm {
  return {
    slug: page.slug,
    title: page.title,
    description: page.description ?? "",
    logoOverride: page.logoOverride ?? "",
    heroImage: page.heroImage ?? "",
    primaryColor: page.primaryColor ?? "#059669",
    accentColor: page.accentColor ?? "#2563EB",
    supportEmail: page.supportEmail ?? "",
    supportPhone: page.supportPhone ?? "",
    submitButtonText: page.submitButtonText,
    successTitle: page.successTitle,
    successMessage: page.successMessage ?? "",
    registrationEnabled: page.registrationEnabled,
    status: page.status,
    selectedSessionCourseUuids: page.selectedSessionCourseUuids,
    selectedEducationOptionUuids: page.selectedEducationOptionUuids,
    selectedDigitalLibraryLocationUuids:
      page.selectedDigitalLibraryLocationUuids,
  };
}

function toPayload(
  form: SettingsForm,
  sessionId: number,
): CreateRegistrationPageRequest | UpdateRegistrationPageRequest {
  return {
    sessionId,
    slug: form.slug,
    title: form.title,
    description: form.description || undefined,
    logoOverride: form.logoOverride || undefined,
    heroImage: form.heroImage || undefined,
    primaryColor: form.primaryColor || undefined,
    accentColor: form.accentColor || undefined,
    supportEmail: form.supportEmail || undefined,
    supportPhone: form.supportPhone || undefined,
    submitButtonText: form.submitButtonText,
    successTitle: form.successTitle,
    successMessage: form.successMessage || undefined,
    registrationEnabled: form.registrationEnabled,
    status: form.status,
    selectedSessionCourseUuids: form.selectedSessionCourseUuids,
    selectedEducationOptionUuids: form.selectedEducationOptionUuids,
    selectedDigitalLibraryLocationUuids:
      form.selectedDigitalLibraryLocationUuids,
  };
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function ConfiguredField({
  description,
  icon,
  name,
  required = false,
  system = false,
}: {
  description: string;
  icon: ReactNode;
  name: string;
  required?: boolean;
  system?: boolean;
}) {
  return (
    <div className="registration-configured-field">
      <span className="registration-configured-field-icon">{icon}</span>
      <div className="registration-configured-field-copy">
        <div className="registration-configured-field-heading">
          <strong>{name}</strong>
          <div className="registration-configured-field-badges">
            {required ? <CrudBadge tone="success">Required</CrudBadge> : null}
            {system ? <CrudBadge tone="warning">System Field</CrudBadge> : null}
          </div>
        </div>
        <small>{description}</small>
      </div>
    </div>
  );
}

function errorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response &&
    "data" in error.response
  ) {
    const data = error.response.data as { message?: string | string[] };
    if (Array.isArray(data.message)) return data.message[0] ?? fallback;
    if (data.message) return data.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
