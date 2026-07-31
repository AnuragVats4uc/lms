import axios from "axios";

let BASE_URL = "";

export const setApiBaseUrl = (url: string) => {
  BASE_URL = url;
};

export const api = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  config.baseURL = BASE_URL;
  return config;
});