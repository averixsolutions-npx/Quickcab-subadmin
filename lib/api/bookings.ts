import apiClient from "./client";

export const bookingsApi = {
  getAll: async (filters: Record<string, unknown> = {}) => {
    const response = await apiClient.get("/admin/bookings", { params: filters });
    return { items: response.data.data || [], pagination: response.data.pagination };
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/admin/bookings/${id}`);
    return response.data.data;
  },

  cancel: async (id: string, reason: string) => {
    await apiClient.post(`/admin/bookings/${id}/cancel`, { reason });
  },
};
