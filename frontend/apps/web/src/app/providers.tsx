"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@repo/api";
import { TamaguiProvider } from "@repo/ui";
import {
    AuthProvider,
    createBrowserStorageAdapter,
} from "@repo/auth";
import {
    getAuthenticatedPath,
    LOGIN_PATH,
} from "@/features/auth/routes";

export default function Providers({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const storage = useMemo(
        () => createBrowserStorageAdapter(),
        []
    );

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider
                dashboardPath="/admin/dashboard"
                getAuthenticatedPath={getAuthenticatedPath}
                loginPath={LOGIN_PATH}
                onRedirect={router.replace}
                queryClient={queryClient}
                storage={storage}
            >
                <TamaguiProvider>
                    {children}
                </TamaguiProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}
