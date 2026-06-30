import apiClient from "./client";

export const partnersApi = {
  getAll: async (filters: Record<string, unknown> = {}) => {
    const response = await apiClient.get("/admin/partners", { params: filters });
    return { items: response.data.data || [], pagination: response.data.pagination };
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/admin/partners/${id}`);
    return response.data.data;
  },

  getBookings: async (userId: string, params: Record<string, unknown> = {}) => {
    const response = await apiClient.get(`/admin/partners/${userId}/bookings`, { params });
    return { items: response.data.data || [], pagination: response.data.pagination };
  },

  getCities: async (): Promise<{ city: string; count: number }[]> => {
    const response = await apiClient.get("/admin/partners/cities");
    return response.data.data || [];
  },

  suspend: async (id: string, payload: { reason: string; isPermanent: boolean; endDate?: string }) => {
    await apiClient.post(`/admin/partners/${id}/suspend`, payload);
  },

  unsuspend: async (id: string) => {
    await apiClient.post(`/admin/partners/${id}/unsuspend`);
  },

  block: async (id: string, reason: string) => {
    await apiClient.post(`/admin/partners/${id}/block`, { reason });
  },

  unblock: async (id: string) => {
    await apiClient.post(`/admin/partners/${id}/unblock`);
  },

  deleteUser: async (id: string) => {
    await apiClient.delete(`/admin/partners/${id}`);
  },

  approveKyc: async (userId: string, adminNote?: string) => {
    await apiClient.post(`/admin/kyc/${userId}/approve`, { adminNote });
  },

  rejectKyc: async (userId: string, payload: Record<string, unknown>) => {
    await apiClient.post(`/admin/kyc/${userId}/reject`, payload);
  },

  reviewDocument: async (userId: string, document: string, status: string, rejectReason?: string) => {
    await apiClient.post(`/admin/kyc/${userId}/document`, { document, status, rejectReason });
  },

  getKycUploadUrl: async (fieldKey: string, fileExtension: string) => {
    const categoryMap: Record<string, string> = {
      aadhaarFront: "kyc-aadhaar-front",
      aadhaarBack: "kyc-aadhaar-back",
      drivingLicence: "kyc-driving-licence",
      selfie: "kyc-selfie",
    };
    const category = categoryMap[fieldKey];
    if (!category) throw new Error(`Unknown fieldKey: ${fieldKey}`);
    const response = await apiClient.post("/upload/presigned-url-admin", {
      category,
      fileExtension,
    });
    return response.data.data as { uploadUrl: string; fileKey: string; publicUrl: string };
  },

  saveKycDocImage: async (userId: string, fieldKey: string, fileKey: string) => {
    await apiClient.patch(`/admin/kyc/${userId}/document-image`, { fieldKey, fileKey });
  },
};
