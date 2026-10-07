import Image from "next/image";

export const LoginHeader = () => (
  <header className="lms-login-topbar kdl-login-brand">
    <Image
      src="/images/keonjhar-digital-library.jpeg"
      alt="Keonjhar Digital Library"
      width={1254}
      height={1254}
      priority
      unoptimized
      className="kdl-login-logo"
    />
    <div>
      <strong>Keonjhar Digital Library</strong>
      <span>Learn. Explore. Empower.</span>
    </div>
  </header>
);
