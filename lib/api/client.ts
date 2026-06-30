import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
  AxiosError,
} from "axios";
import toast from "react-hot-toast";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const TOKEN_KEY = "qc_subadmin_token";
const REFRESH_KEY = "qc_subadmin_refresh";

export const tokenStorage = {
  getToken: () =>
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null,
  getRefresh: () =>
    typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null,
  setTokens: (access: string, refresh: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  setAccessToken: (access: string) => {
    if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, access);
  },
  clear: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
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

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const isAuthEndpoint = originalRequest.url?.includes("/admin/auth/");

    if (error.response?.status === 403) {
      toast.error("You don't have permission for this action");
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !isAuthEndpoint) {
      if (!originalRequest._retry) {
        const refreshToken = tokenStorage.getRefresh();

        if (!refreshToken) {
          tokenStorage.clear();
          if (typeof window !== "undefined") window.location.href = "/login";
          return Promise.reject(error);
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const response = await axios.post(`${BASE_URL}/admin/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data.data;
          tokenStorage.setAccessToken(accessToken);
          processQueue(null, accessToken);

          if (originalRequest.headers) {
            originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
          }

          return apiClient(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          tokenStorage.clear();
          if (typeof window !== "undefined") window.location.href = "/login";
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      tokenStorage.clear();
      if (typeof window !== "undefined") window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default apiClient;
