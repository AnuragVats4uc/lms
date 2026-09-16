import { Plus } from "lucide-react";

import { CrudSelect } from "../../../components/crud";
import styles from "../../DashboardBannersPage.module.css";

interface Option {
  label: string;
  value: string;
}

export const BannerContextControls = ({
  organizationId,
  organizationOptions,
  sessionId,
  sessionOptions,
  setOrganizationId,
  setSessionId,
  onCreate,
}: {
  organizationId?: number;
  organizationOptions: Option[];
  sessionId?: number;
  sessionOptions: Option[];
  setOrganizationId: (id: number) => void;
  setSessionId: (id: number) => void;
  onCreate: () => void;
}) => (
  <div className={styles.headerControls}>
    {organizationOptions.length > 1 ? (
      <CrudSelect
        ariaLabel="Organization"
        options={organizationOptions}
        value={organizationId ? String(organizationId) : ""}
        onChange={(value) => setOrganizationId(Number(value))}
        width="210px"
      />
    ) : null}
    <CrudSelect
      ariaLabel="Session"
      options={sessionOptions}
      value={sessionId ? String(sessionId) : ""}
      onChange={(value) => setSessionId(Number(value))}
      width="210px"
    />
    <button
      className={styles.primary}
      disabled={!sessionId}
      onClick={onCreate}
      type="button"
    >
      <Plus size={16} /> Add banner
    </button>
  </div>
);
