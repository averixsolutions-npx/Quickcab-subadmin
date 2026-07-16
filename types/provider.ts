import type { UserStatus, KycRecord } from "./partner";

export type ServiceProviderCategory =
  | "DRIVER"
  | "PUNCTURE_REPAIR"
  | "MECHANIC"
  | "TOWING"
  | "FUEL_PUMP"
  | "RESTAURANT_HOTEL"
  | "HOSPITAL";

export const CATEGORY_LABELS: Record<ServiceProviderCategory, string> = {
  DRIVER: "Driver",
  PUNCTURE_REPAIR: "Puncture Repair",
  MECHANIC: "Mechanic",
  TOWING: "Towing",
  FUEL_PUMP: "Fuel Pump",
  RESTAURANT_HOTEL: "Restaurant / Hotel",
  HOSPITAL: "Hospital",
};

export interface ProviderProfile {
  category: ServiceProviderCategory | null;
  businessName: string | null;
  rating: number;
  totalRatings: number;
  city: string | null;
  state: string | null;
  email: string | null;
  isOnline: boolean;
  subServices?: string[];
  area?: string | null;
  fullAddress?: string | null;
  serviceRadius?: number | null;
  operatingHours?: unknown;
  photos?: string[];
}

export interface Provider {
  id: string;
  displayId?: string;
  name: string;
  mobile: string;
  status: UserStatus;
  walletBalance: number;
  referralCode: string;
  lastLoginAt: string | null;
  createdAt: string;
  providerProfile: ProviderProfile | null;
  kycRecord: KycRecord | null;
  subscription: {
    id: string;
    status: "ACTIVE" | "EXPIRED" | "CANCELLED";
    endDate: string;
    plan: { name: string };
  } | null;
  _count?: {
    serviceRequestsReceived: number;
    ratingsGiven: number;
    ratingsReceived: number;
  };

  // Compatibility shim so SuspendModal/BlockModal/DeleteUserModal (typed to
  // Partner, and only reading .name) accept a Provider. Undefined at runtime.
  partnerProfile?: { subType: string } | null;
}

export interface ProviderServiceRequest {
  id: string;
  category: ServiceProviderCategory;
  serviceType: string;
  description: string | null;
  status: "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "DECLINED" | "CANCELLED";
  declineReason: string | null;
  respondedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  driver: { id: string; name: string; mobile: string } | null;
  provider: { id: string; name: string; mobile: string } | null;
}
