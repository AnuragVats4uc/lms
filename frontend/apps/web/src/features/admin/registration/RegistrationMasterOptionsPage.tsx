"use client";

import { type ReactNode } from "react";
import { BookOpen, GraduationCap, MapPin, ShieldCheck } from "lucide-react";
import { registrationApi } from "@repo/api";
import type {
  CreateRegistrationMasterOptionRequest,
  RegistrationMasterOption,
  UpdateRegistrationMasterOptionRequest,
} from "@repo/types";

import {
  DataTableDateCell,
  DataTableTextCell,
  type DataTableColumn,
} from "@/components/DataTable";

import { useAcademicSessions } from "../academic/useAcademicSessions";
import {
  CrudBadge,
  CrudDetailField,
  CrudDetailSection,
  CrudSelect,
} from "../components/crud";
import {
  CrudManagementPage,
  type ResourceFormContext,
} from "../components/crud/CrudManagementPage";

type MasterKind = "education" | "location";

type MasterForm = {
  name: string;
  sortOrder: string;
  isActive: boolean;
};

const initialForm: MasterForm = {
  name: "",
  sortOrder: "0",
  isActive: true,
};

const statusOptions = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

const kindConfig = {
  education: {
    createLabel: "Add Education Option",
    description:
      "Maintain organization-specific education dropdown options for public student registration.",
    entityLabel: "Education Option",
    icon: <GraduationCap color="#059669" size={20} />,
    title: "Education Options",
  },
  location: {
    createLabel: "Add Location",
    description:
      "Maintain organization-specific digital library locations for public student registration.",
    entityLabel: "Digital Library Location",
    icon: <MapPin color="#059669" size={20} />,
    title: "Digital Library Locations",
  },
} satisfies Record<
  MasterKind,
  {
    createLabel: string;
    description: string;
    entityLabel: string;
    icon: ReactNode;
    title: string;
  }
>;

export function RegistrationMasterOptionsPage({ kind }: { kind: MasterKind }) {
  const academic = useAcademicSessions();
  const organizationId = academic.selectedOrganizationId;
  const config = kindConfig[kind];
  const columns = masterColumns(config.entityLabel);

  const context = academic.organizations.length ? (
    <div className="registration-master-context">
      <CrudSelect
        ariaLabel="Select organization"
        label="Organization"
        onChange={(value) => {
          academic.setSelectedOrganizationId(Number(value));
          academic.setSelectedSessionId(null);
        }}
        options={academic.organizations.map((organization) => ({
          label: organization.name,
          value: String(organization.id),
        }))}
        value={organizationId ? String(organizationId) : ""}
      />
    </div>
  ) : null;

  return (
    <CrudManagementPage<
      RegistrationMasterOption,
      MasterForm,
      CreateRegistrationMasterOptionRequest,
      UpdateRegistrationMasterOptionRequest
    >
      columns={columns}
      context={context}
      create={(payload) =>
        organizationId === null
          ? Promise.reject(new Error("Select an organization first."))
          : kind === "education"
            ? registrationApi.createEducationOption(organizationId, payload)
            : registrationApi.createDigitalLibraryLocation(
                organizationId,
                payload,
              )
      }
      createLabel={config.createLabel}
      description={config.description}
      emptyDescription={`Create the first ${config.entityLabel.toLowerCase()} for this organization.`}
      enabled={organizationId !== null}
      entityLabel={config.entityLabel}
      getDisplayName={(item) => item.name}
      getIsActive={(item) => item.isActive}
      getRowId={(item) => item.id}
      getStats={({ rows, total }) => [
        {
          icon: config.icon,
          label: `Total ${config.entityLabel}s`,
          value: total,
        },
        {
          icon: <ShieldCheck color="#059669" size={20} />,
          label: "Active",
          value: rows.filter((row) => row.isActive).length,
        },
        {
          icon: <BookOpen color="#64748B" size={20} />,
          label: "Inactive",
          value: rows.filter((row) => !row.isActive).length,
        },
      ]}
      initialForm={initialForm}
      permissionPrefix="organizations"
      queryFn={(query) =>
        organizationId === null
          ? Promise.reject(new Error("Select an organization first."))
          : kind === "education"
            ? registrationApi.listEducationOptions(organizationId, {
                limit: query.limit,
                page: query.page,
                search: query.search,
                isActive:
                  query.status === "ACTIVE"
                    ? true
                    : query.status === "INACTIVE"
                      ? false
                      : undefined,
              })
            : registrationApi.listDigitalLibraryLocations(organizationId, {
                limit: query.limit,
                page: query.page,
                search: query.search,
                isActive:
                  query.status === "ACTIVE"
                    ? true
                    : query.status === "INACTIVE"
                      ? false
                      : undefined,
              })
      }
      queryKey={["admin", kind, organizationId]}
      renderDetails={(item) => (
        <CrudDetailSection icon={config.icon} title={config.entityLabel}>
          <CrudDetailField icon={config.icon} label="Name" value={item.name} />
          <CrudDetailField
            icon={<BookOpen color="#059669" size={15} />}
            label="Display order"
            value={item.sortOrder}
          />
          <CrudDetailField
            icon={<ShieldCheck color="#059669" size={15} />}
            label="Status"
            value={item.isActive ? "Active" : "Inactive"}
          />
        </CrudDetailSection>
      )}
      renderForm={(context) => <MasterFormFields {...context} />}
      remove={(id) =>
        organizationId === null
          ? Promise.reject(new Error("Select an organization first."))
          : kind === "education"
            ? registrationApi.removeEducationOption(organizationId, id)
            : registrationApi.removeDigitalLibraryLocation(organizationId, id)
      }
      searchPlaceholder={`Search ${config.entityLabel.toLowerCase()}s...`}
      setActive={(id, active) =>
        organizationId === null
          ? Promise.reject(new Error("Select an organization first."))
          : kind === "education"
            ? registrationApi.updateEducationOption(organizationId, id, {
                isActive: active,
              })
            : registrationApi.updateDigitalLibraryLocation(organizationId, id, {
                isActive: active,
              })
      }
      statusOptions={statusOptions}
      title={config.title}
      toCreatePayload={toCreatePayload}
      toForm={(item) => ({
        name: item.name,
        sortOrder: String(item.sortOrder),
        isActive: item.isActive,
      })}
      toUpdatePayload={toUpdatePayload}
      update={(id, payload) =>
        organizationId === null
          ? Promise.reject(new Error("Select an organization first."))
          : kind === "education"
            ? registrationApi.updateEducationOption(organizationId, id, payload)
            : registrationApi.updateDigitalLibraryLocation(
                organizationId,
                id,
                payload,
              )
      }
      validate={validate}
    />
  );
}

function masterColumns(
  entityLabel: string,
): DataTableColumn<RegistrationMasterOption>[] {
  return [
    {
      cell: ({ row }) => (
        <DataTableTextCell
          primary={row.name}
          secondary={`${entityLabel} - Order ${row.sortOrder}`}
        />
      ),
      header: "Name",
      id: "name",
      sticky: true,
      width: 280,
    },
    {
      cell: ({ row }) => (
        <CrudBadge tone={row.isActive ? "success" : "danger"}>
          {row.isActive ? "Active" : "Inactive"}
        </CrudBadge>
      ),
      header: "Status",
      id: "status",
      width: 130,
    },
    {
      cell: ({ row }) => <DataTableTextCell primary={String(row.sortOrder)} />,
      header: "Display Order",
      id: "sortOrder",
      width: 150,
    },
    {
      cell: ({ row }) => <DataTableDateCell value={row.updatedAt} />,
      header: "Updated",
      id: "updatedAt",
      width: 160,
    },
  ];
}

function MasterFormFields({
  error,
  form,
  onChange,
}: ResourceFormContext<MasterForm>) {
  return (
    <div className="registration-master-form">
      {error ? <div className="registration-error">{error}</div> : null}
      <label className="registration-admin-field">
        <span>Name</span>
        <input
          autoFocus
          onChange={(event) => onChange("name", event.target.value)}
          value={form.name}
        />
      </label>
      <label className="registration-admin-field">
        <span>Display order</span>
        <input
          min={0}
          onChange={(event) => onChange("sortOrder", event.target.value)}
          type="number"
          value={form.sortOrder}
        />
      </label>
      <label className="registration-master-checkbox">
        <input
          checked={form.isActive}
          onChange={(event) => onChange("isActive", event.target.checked)}
          type="checkbox"
        />
        <span>Active</span>
      </label>
    </div>
  );
}

function toCreatePayload(
  form: MasterForm,
): CreateRegistrationMasterOptionRequest {
  return toPayload(form);
}

function toUpdatePayload(
  form: MasterForm,
): UpdateRegistrationMasterOptionRequest {
  return toPayload(form);
}

function toPayload(form: MasterForm) {
  return {
    name: form.name.trim(),
    sortOrder: Number(form.sortOrder || 0),
    isActive: form.isActive,
  };
}

function validate(form: MasterForm) {
  if (form.name.trim().length < 2) {
    return "Name must be at least 2 characters.";
  }
  if (!/^\d+$/.test(form.sortOrder) || Number(form.sortOrder) < 0) {
    return "Display order must be zero or a positive whole number.";
  }
  return null;
}

export default RegistrationMasterOptionsPage;
