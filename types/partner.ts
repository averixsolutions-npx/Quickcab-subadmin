import type { UserStatus, KycStatus } from "./api";

export type { UserStatus, KycStatus };

export type PartnerSubType = "INDIVIDUAL" | "BUSINESS";

export interface KycDocument {
  status: "PENDING" | "APPROVED" | "REJECTED" | "NOT_SUBMITTED";
  url?: string;
  rejectReason?: string;
  uploadedAt?: string;
}

export interface KycData {
  status: KycStatus;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  adminNote?: string;
  aadhaarFront?: KycDocument;
  aadhaarBack?: KycDocument;
  drivingLicence?: KycDocument;
  selfie?: KycDocument;
  businessDoc?: KycDocument;
}

export interface SuspensionData {
  reason: string;
  isPermanent: boolean;
  startDate: string;
  endDate?: string;
  suspendedBy?: string;
}

export interface Partner {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  status: UserStatus;
  subType: PartnerSubType;
  businessName?: string;
  profilePicture?: string;
  kyc?: KycData;
  suspension?: SuspensionData;
  blockReason?: string;
  createdAt: string;
  updatedAt: string;
  vehicleNumber?: string;
  vehicleType?: string;
  totalBookings?: number;
  totalEarnings?: number;
  rating?: number;
}
