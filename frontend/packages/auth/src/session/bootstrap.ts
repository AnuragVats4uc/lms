import { getProfile } from "../services";
import { sessionManager } from "./session-manager";
import { useAuthStore } from "../store";

export async function bootstrapSession() {
    useAuthStore.getState().setInitializing();

    const accessToken =
        await sessionManager.getAccessToken();

    const refreshToken =
        await sessionManager.getRefreshToken();

    if (!accessToken || !refreshToken) {
        useAuthStore.getState().setUnauthenticated();
        return false;
    }

    const storedUser = await sessionManager.getStoredUser();

    if (storedUser) {
        useAuthStore.getState().login(
            storedUser,
            accessToken,
            refreshToken
        );
    }

    try {
        const student = await getProfile();

        await sessionManager.restoreAuthenticatedSession(
            student,
            accessToken,
            refreshToken
        );

        return true;
    } catch {
        await sessionManager.logout({
            notify: false,
            revoke: false,
        });
        return false;
    }
}
