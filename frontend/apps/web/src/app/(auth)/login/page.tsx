import { Suspense } from "react";
import LoginPage from "@/features/auth/login/LoginPage";

export default function Page() {
  return (
    <Suspense fallback={<div role="status">Loading login…</div>}>
      <LoginPage />
    </Suspense>
  );
}
