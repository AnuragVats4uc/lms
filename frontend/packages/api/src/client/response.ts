import type { AxiosResponse } from "axios";
import type { ApiResponse } from "@repo/types";

export function unwrapApiData<T>(
  response: AxiosResponse<ApiResponse<T>>
): T {
  return response.data.data;
}
