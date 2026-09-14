import Image from "next/image";

import styles from "../StudentLandingPage.module.css";

export const LandingBrand = () => (
  <div className={styles.organizationLogo}>
    <Image
      alt="Keonjhar Digital Library"
      className={styles.organizationLogoImage}
      height={500}
      priority
      quality={100}
      sizes="(max-width: 600px) and (max-height: 620px) 120px, (max-width: 600px) 190px, (max-height: 620px) 144px, (max-height: 760px) 200px, 270px"
      src="/images/keonjhar-logo.png"
      width={500}
    />
  </div>
);
