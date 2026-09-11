import Image from "next/image";
import { BookOpen, GraduationCap, LifeBuoy } from "lucide-react";
import type { PublicRegistrationPage } from "@repo/types";

type RegistrationBrandPanelProps = {
  page: PublicRegistrationPage;
};

export const RegistrationBrandPanel = ({
  page,
}: RegistrationBrandPanelProps) => (
  <aside className="registration-brand-panel">
    <div className="registration-brand-lockup">
      <div className="registration-logo-mark">
        {page.organization.logo ? (
          <Image
            alt={`${page.organization.name} logo`}
            height={46}
            unoptimized
            src={page.organization.logo}
            width={46}
          />
        ) : (
          <GraduationCap aria-hidden="true" size={24} />
        )}
      </div>
      <div>
        <strong>{page.organization.name}</strong>
        <span>{page.session.name}</span>
      </div>
    </div>
    <div className="registration-brand-copy">
      <span>Student Registration</span>
      <h1>{page.registration.title}</h1>
      {page.registration.description ? (
        <p>{page.registration.description}</p>
      ) : null}
    </div>
    {page.registration.heroImage ? (
      <Image
        alt=""
        className="registration-hero-image"
        height={220}
        unoptimized
        src={page.registration.heroImage}
        width={520}
      />
    ) : (
      <div className="registration-hero-placeholder" aria-hidden="true">
        <BookOpen size={42} />
        <span>Learning access starts here</span>
      </div>
    )}
    {page.organization.email || page.organization.phone ? (
      <div className="registration-support">
        <LifeBuoy aria-hidden="true" size={16} />
        <span>{page.organization.email ?? page.organization.phone}</span>
      </div>
    ) : null}
  </aside>
);
