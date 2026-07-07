import { StorageAdapter } from "./storage.interface";

export function createBrowserStorageAdapter(): StorageAdapter {
  return {
    async getItem(key) {
      if (!isBrowserStorageAvailable()) {
        return null;
      }

      return globalThis.localStorage.getItem(key);
    },

    async setItem(key, value) {
      if (!isBrowserStorageAvailable()) {
        return;
      }

      globalThis.localStorage.setItem(key, value);
    },

    async removeItem(key) {
      if (!isBrowserStorageAvailable()) {
        return;
      }

      globalThis.localStorage.removeItem(key);
    },

    async clear() {
      if (!isBrowserStorageAvailable()) {
        return;
      }

      globalThis.localStorage.clear();
    },
  };
}

function isBrowserStorageAvailable() {
  return typeof globalThis.localStorage !== "undefined";
}
