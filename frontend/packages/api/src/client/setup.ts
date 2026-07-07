import { api } from "./axios";
import { setupRequestInterceptor } from "./request.interceptors";

import { setupResponseInterceptor } from "./response.interceptor";

export function setupApi() {
  setupRequestInterceptor(api);

  setupResponseInterceptor(api);
}