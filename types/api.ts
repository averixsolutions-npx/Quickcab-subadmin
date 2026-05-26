export type UserStatus =
  | "ONBOARDING"
  | "PROFILE_COMPLETE"
  | "KYC_PENDING"
  | "ACTIVE"
  | "SUSPENDED"
  | "BLOCKED";

export type KycStatus =
  | "NOT_SUBMITTED"
  | "IN_PROGRESS"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}
