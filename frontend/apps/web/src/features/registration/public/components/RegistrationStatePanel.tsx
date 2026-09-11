import type { ReactNode } from "react";

type RegistrationStatePanelProps = {
  description: string;
  icon?: ReactNode;
  title: string;
};

export const RegistrationStatePanel = ({
  description,
  icon,
  title,
}: RegistrationStatePanelProps) => (
  <section className="registration-state-panel">
    {icon}
    <h1>{title}</h1>
    <p>{description}</p>
  </section>
);
