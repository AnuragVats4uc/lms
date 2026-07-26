import { AuthLayout } from "@/features/layouts/AuthLayout";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayout>{children}</AuthLayout>;
}
