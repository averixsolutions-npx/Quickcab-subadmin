import apiClient from "./client";
import { partnersApi } from "./partners";

export const providersApi = {
  getAll: async (filters: Record<string, unknown> = {}) => {
    const response = await apiClient.get("/admin/providers", { params: filters });
    return { items: response.data.data || [], pagination: response.data.pagination };
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/admin/providers/${id}`);
    return response.data.data;
  },

  getServiceRequests: async (userId: string, params: Record<string, unknown> = {}) => {
    const response = await apiClient.get(`/admin/providers/${userId}/service-requests`, { params });
    return { items: response.data.data || [], pagination: response.data.pagination };
  },

  getCities: async (): Promise<{ city: string; count: number }[]> => {
    const response = await apiClient.get("/admin/providers/cities");
    return response.data.data || [];
  },

  suspend: async (id: string, payload: { reason: string; isPermanent: boolean; endDate?: string }) => {
    await apiClient.post(`/admin/providers/${id}/suspend`, payload);
  },
  unsuspend: async (id: string) => {
    await apiClient.post(`/admin/providers/${id}/unsuspend`);
  },
  block: async (id: string, reason: string) => {
    await apiClient.post(`/admin/providers/${id}/block`, { reason });
  },
  unblock: async (id: string) => {
    await apiClient.post(`/admin/providers/${id}/unblock`);
  },
  deleteUser: async (id: string) => {
    await apiClient.delete(`/admin/providers/${id}`);
  },

  // ── KYC is shared with partners (backend /admin/kyc/:userId is role-agnostic).
  // Re-export the partner KYC helpers so the provider detail page approves/
  // rejects/reviews/uploads through the exact same, already-working flow. ──
  approveKyc: partnersApi.approveKyc,
  rejectKyc: partnersApi.rejectKyc,
  reviewDocument: partnersApi.reviewDocument,
  getKycUploadUrl: partnersApi.getKycUploadUrl,
  saveKycDocImage: partnersApi.saveKycDocImage,
};
