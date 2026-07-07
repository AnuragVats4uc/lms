import { StorageAdapter } from "./storage.interface";

export function createMemoryStorageAdapter(): StorageAdapter {
  const storage = new Map<string, string>();

  return {
    async getItem(key) {
      return storage.get(key) ?? null;
    },

    async setItem(key, value) {
      storage.set(key, value);
    },

    async removeItem(key) {
      storage.delete(key);
    },

    async clear() {
      storage.clear();
    },
  };
}
