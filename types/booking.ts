export type BookingStatus = "OPEN" | "BOOKED" | "EXPIRED" | "CANCELLED";

export interface Booking {
  id: string;
  status: BookingStatus;
  pickupCity: string;
  dropCity: string;
  date: string;
  time: string;
  vehicleType: string;
  postedAmount: number;
  notes: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  postedBy: {
    id: string;
    name: string;
    mobile: string;
    partnerProfile: { subType: string } | null;
  };
  acceptedBy: {
    id: string;
    name: string;
    mobile: string;
    partnerProfile: { subType: string } | null;
  } | null;
}
