"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@repo/api";
import { TamaguiProvider } from "@repo/ui";
import { AuthProvider } from "@repo/auth";

export default function Providers({
    children,
}: {
    children: React.ReactNode;
}) {
    // useBootstrapSession();
    return (
        <QueryClientProvider client={queryClient}>
            {/* <AuthProvider> */}
                <TamaguiProvider>
                    {children}
                </TamaguiProvider>
            {/* </AuthProvider> */}
        </QueryClientProvider>
    );
}
