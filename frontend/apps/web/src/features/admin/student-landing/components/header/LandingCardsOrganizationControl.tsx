import { Plus } from "lucide-react";
import { CrudSelect } from "../../../components/crud";
import styles from "../../StudentLandingCardsPage.module.css";

export const LandingCardsOrganizationControl = ({
  disabled,
  loading,
  onAdd,
  onOrganizationChange,
  options,
  organizationId,
  showOrganization,
}: {
  disabled: boolean;
  loading: boolean;
  onAdd: () => void;
  onOrganizationChange: (id: number) => void;
  options: Array<{ label: string; value: string }>;
  organizationId: number | null;
  showOrganization: boolean;
}) => (
  <div className={styles.headerControls}>
    {showOrganization ? (
      <div className={styles.organizationSelect}>
        <CrudSelect
          ariaLabel="Organization"
          label="Organization"
          loading={loading}
          onChange={(value) => onOrganizationChange(Number(value))}
          options={options}
          value={organizationId ? String(organizationId) : ""}
          width="100%"
        />
      </div>
    ) : null}
    <button
      className={styles.primaryButton}
      disabled={disabled}
      onClick={onAdd}
      type="button"
    >
      <Plus size={16} /> Add card
    </button>
  </div>
);
