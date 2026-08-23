import axios from "axios";

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;

if (process.env.NODE_ENV === "production" && !configuredApiUrl) {
  throw new Error("NEXT_PUBLIC_API_URL is required for production builds");
}

const apiBaseUrl = (
  configuredApiUrl ?? "http://localhost:5000/api/v1"
).replace(/\/$/, "");

export const api = axios.create({
  baseURL: apiBaseUrl,

  timeout: 30000,

  headers: {
    "Content-Type": "application/json",
  },
});
