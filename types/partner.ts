export type UserStatus = "ONBOARDING" | "PROFILE_COMPLETE" | "KYC_PENDING" | "ACTIVE" | "SUSPENDED" | "BLOCKED";
export type KycStatus = "NOT_SUBMITTED" | "IN_PROGRESS" | "PENDING" | "APPROVED" | "REJECTED";
export type PartnerSubType = "VEHICLE_OWNER" | "VENDOR";

// Shape used by KycDocViewer prop
export interface KycDocument {
  status: "PENDING" | "APPROVED" | "REJECTED" | "NOT_SUBMITTED";
  url?: string;
  rejectReason?: string;
  uploadedAt?: string;
}

export interface PartnerProfile {
  subType: PartnerSubType;
  areasOfInterest: string[];
  rating: number;
  totalRatings: number;
  city: string | null;
  email: string | null;
}

export interface KycRecord {
  id: string;
  status: KycStatus;
  fullName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  email: string | null;
  aadhaarNumber: string | null;
  city: string | null;
  area: string | null;
  aadhaarFrontUrl: string | null;
  aadhaarBackUrl: string | null;
  drivingLicenceUrl: string | null;
  selfieUrl: string | null;
  businessDocUrl: string | null;
  vehicleName: string | null;
  vehicleType: string | null;
  vehicleNumber: string | null;
  businessName: string | null;
  aadhaarFrontStatus: "PENDING" | "APPROVED" | "REJECTED";
  aadhaarBackStatus: "PENDING" | "APPROVED" | "REJECTED";
  drivingLicenceStatus: "PENDING" | "APPROVED" | "REJECTED";
  selfieStatus: "PENDING" | "APPROVED" | "REJECTED";
  businessDocStatus: "PENDING" | "APPROVED" | "REJECTED";
  aadhaarRejectReason: string | null;
  drivingLicenceRejectReason: string | null;
  selfieRejectReason: string | null;
  businessDocRejectReason: string | null;
  adminNote: string | null;
  reviewedAt: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  resubmittedAt: string | null;
  resubmittedDocuments?: string[];
}

export interface Partner {
  id: string;
  name: string;
  mobile: string;
  status: UserStatus;
  walletBalance: number;
  referralCode: string;
  lastLoginAt: string | null;
  createdAt: string;
  partnerProfile: PartnerProfile | null;
  kycRecord: KycRecord | null;
  subscription: {
    id: string;
    status: "ACTIVE" | "EXPIRED" | "CANCELLED";
    endDate: string;
    plan: { name: string };
  } | null;
}
