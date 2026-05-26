export type BookingStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DRIVER_ASSIGNED"
  | "PICKUP_REACHED"
  | "TRIP_STARTED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_DRIVER";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type PaymentMethod = "CASH" | "ONLINE" | "WALLET";

export interface BookingLocation {
  address: string;
  lat?: number;
  lng?: number;
}

export interface BookingUser {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface Booking {
  _id: string;
  bookingId: string;
  status: BookingStatus;
  pickupLocation: BookingLocation;
  dropLocation: BookingLocation;
  partner?: BookingUser;
  customer?: BookingUser;
  driver?: BookingUser;
  fare?: number;
  distance?: number;
  duration?: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  cancelReason?: string;
  cancelledBy?: string;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  vehicleType?: string;
  notes?: string;
}
