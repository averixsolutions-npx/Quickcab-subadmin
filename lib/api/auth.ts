import apiClient, { tokenStorage } from "./client";

export const authApi = {
  login: async (username: string, password: string): Promise<{ token: string }> => {
    const response = await apiClient.post("/subadmin/auth/login", { username, password });
    const { token } = response.data.data;
    tokenStorage.setToken(token);
    return { token };
  },

  setName: async (name: string): Promise<{ token: string }> => {
    const response = await apiClient.post("/subadmin/auth/set-name", { name });
    const { token } = response.data.data;
    tokenStorage.setToken(token);
    return { token };
  },
};
