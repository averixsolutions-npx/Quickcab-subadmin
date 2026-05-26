import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
  AxiosError,
} from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const TOKEN_KEY = "qc_subadmin_token";

export const tokenStorage = {
  getToken: () =>
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null,
  setToken: (token: string) => {
    if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
  },
  clear: () => {
    if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
  },
};

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 65000,
  headers: {
    "Content-Type": "application/json",
    "X-Client-Type": "SUBADMIN",
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const isAuthEndpoint = originalRequest.url?.includes("/subadmin/auth/");

    if (!isAuthEndpoint) {
      const data = error.response?.data as {
        code?: string;
        reason?: string;
      } | undefined;

      if (error.response?.status === 403) {
        if (data?.code === "ACCESS_DISABLED") {
          tokenStorage.clear();
          if (typeof window !== "undefined") window.location.href = "/disabled";
          return Promise.reject(error);
        }
        if (data?.code === "SUBADMIN_SUSPENDED" || data?.code === "SUBADMIN_BLOCKED") {
          // Store the reason so the /restricted page can display it
          if (typeof window !== "undefined") {
            localStorage.setItem(
              "qc_subadmin_restriction",
              JSON.stringify({
                code: data.code,
                reason: data.reason ?? "No reason provided",
              })
            );
            window.location.href = "/restricted";
          }
          return Promise.reject(error);
        }
      }

      if (error.response?.status === 401) {
        tokenStorage.clear();
        if (typeof window !== "undefined") window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
