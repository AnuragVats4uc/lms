import { AUTH_KEYS } from "../constants/auth.constant";
import { getStorage } from "./auth-storage";

export const token = {
    async save(
        accessToken: string,
        refreshToken: string
    ) {
        const storage = getStorage();

        await storage.setItem(
            AUTH_KEYS.ACCESS_TOKEN,
            accessToken
        );

        await storage.setItem(
            AUTH_KEYS.REFRESH_TOKEN,
            refreshToken
        );
    },

    async getAccessToken() {
        return getStorage().getItem(
            AUTH_KEYS.ACCESS_TOKEN
        );
    },

    async getRefreshToken() {
        return getStorage().getItem(
            AUTH_KEYS.REFRESH_TOKEN
        );
    },

    async clear() {
        const storage = getStorage();

        await storage.removeItem(
            AUTH_KEYS.ACCESS_TOKEN
        );

        await storage.removeItem(
            AUTH_KEYS.REFRESH_TOKEN
        );
    },
};