import { api, ApiResponse } from "@repo/api";
import { Student } from "../types";

export async function getProfile() {
    const response = await api.get<ApiResponse<Student>>(
        "/students/me"
    );

    return response.data.data;
}
