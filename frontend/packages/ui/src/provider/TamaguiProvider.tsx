"use client";

import { PropsWithChildren } from "react";
import { TamaguiProvider as Provider } from "tamagui";
import config from "../config/tamagui.config";

export function TamaguiProvider({
    children,
}: PropsWithChildren) {
    return (
        <Provider
            config={config}
            defaultTheme="light"
        >
            {children}
        </Provider>
    );
}