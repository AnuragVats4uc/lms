import { StorageAdapter } from "./storage.interface";

let storage: StorageAdapter;

export const configureStorage = (
    adapter: StorageAdapter
) => {
    storage = adapter;
};

export const getStorage = () => {
    if (!storage) {
        throw new Error(
            "Storage adapter has not been configured."
        );
    }

    return storage;
};