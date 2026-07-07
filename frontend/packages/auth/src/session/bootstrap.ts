import { getProfile } from "../services";
import { sessionManager } from "./session-manager";
import { useAuthStore } from "../store";

export async function bootstrapSession() {
    const accessToken =
        await sessionManager.getAccessToken();

    const refreshToken =
        await sessionManager.getRefreshToken();

    if (!accessToken || !refreshToken) {
        return false;
    }

    try {
        const student = await getProfile();

        useAuthStore.getState().login(
            student,
            accessToken,
            refreshToken
        );

        return true;
    } catch {
        await sessionManager.logout();
        return false;
    }
}