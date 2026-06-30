import apiClient from "./client";

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post("/admin/auth/login", { email, password });
    return response.data.data as {
      accessToken: string;
      refreshToken: string;
      admin: { id: string; name: string; email: string; role: string };
    };
  },
};
