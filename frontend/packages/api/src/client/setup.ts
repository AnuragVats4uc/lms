import { api } from "./axios";
import { setupRequestInterceptor } from "./request.interceptors";

import { setupResponseInterceptor } from "./response.interceptor";

let isApiConfigured = false;

export function setupApi() {
  if (isApiConfigured) {
    return;
  }

  setupRequestInterceptor(api);

  setupResponseInterceptor(api);

  isApiConfigured = true;
}
