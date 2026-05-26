"use client";

import { useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, User, Car, CreditCard, Clock } from "lucide-react";
import { bookingsApi } from "@/lib/api/bookings";
import { BookingStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/SkeletonLoader";
import { EmptyState } from "@/components/ui/EmptyState";
import { CancelBookingModal } from "@/components/bookings/CancelBookingModal";
import { cn, formatDateTime } from "@/lib/utils";
import toast from "react-hot-toast";

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => bookingsApi.getById(id),
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => bookingsApi.cancel(id, reason),
    onSuccess: () => {
      toast.success("Booking cancelled");
      setCancelOpen(false);
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: () => toast.error("Failed to cancel booking"),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="card">
        <EmptyState title="Booking not found" description="This booking does not exist or was deleted." />
      </div>
    );
  }

  const canCancel = ["PENDING", "ACCEPTED", "DRIVER_ASSIGNED", "PICKUP_REACHED"].includes(booking.status);

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="card">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-light-text-2 dark:text-dark-text-2 hover:text-light-text dark:hover:text-dark-text mb-4 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Bookings
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-light-text-3 dark:text-dark-text-3 mb-1">Booking ID</p>
            <p className="font-mono font-semibold text-light-text dark:text-dark-text">{booking.bookingId}</p>
            <div className="mt-2">
              <BookingStatusBadge status={booking.status} />
            </div>
          </div>
          <div className="flex gap-2">
            {canCancel && (
              <Button variant="danger" size="sm" onClick={() => setCancelOpen(true)}>
                Cancel Booking
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Route */}
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-light-text dark:text-dark-text flex items-center gap-2">
            <MapPin size={14} className="text-brand-purple" />
            Route
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-light-text-3 dark:text-dark-text-3 mb-0.5">Pickup</p>
              <p className="text-sm text-light-text dark:text-dark-text">{booking.pickupLocation.address}</p>
            </div>
            <div className="border-l-2 border-dashed border-light-border dark:border-dark-border ml-1 pl-3 py-1">
              {booking.distance != null && (
                <p className="text-xs text-light-text-3 dark:text-dark-text-3">
                  {booking.distance} km · {booking.duration} min
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-light-text-3 dark:text-dark-text-3 mb-0.5">Drop</p>
              <p className="text-sm text-light-text dark:text-dark-text">{booking.dropLocation.address}</p>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-light-text dark:text-dark-text flex items-center gap-2">
            <CreditCard size={14} className="text-brand-purple" />
            Payment
          </h3>
          {booking.fare != null && (
            <p className="text-2xl font-bold text-light-text dark:text-dark-text">
              ₹{booking.fare}
            </p>
          )}
          <DetailRow label="Method"  value={booking.paymentMethod} />
          <DetailRow label="Status"  value={booking.paymentStatus} />
          {booking.vehicleType && <DetailRow label="Vehicle" value={booking.vehicleType} />}
        </div>

        {/* People */}
        {(booking.partner || booking.customer || booking.driver) && (
          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-light-text dark:text-dark-text flex items-center gap-2">
              <User size={14} className="text-brand-purple" />
              People
            </h3>
            {booking.partner && <DetailRow label="Partner"  value={booking.partner.name} />}
            {booking.customer && <DetailRow label="Customer" value={booking.customer.name} />}
            {booking.driver && <DetailRow label="Driver"   value={booking.driver.name} />}
          </div>
        )}

        {/* Timeline */}
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-light-text dark:text-dark-text flex items-center gap-2">
            <Clock size={14} className="text-brand-purple" />
            Timeline
          </h3>
          <DetailRow label="Created"    value={formatDateTime(booking.createdAt)} />
          {booking.scheduledAt && <DetailRow label="Scheduled"  value={formatDateTime(booking.scheduledAt)} />}
          {booking.startedAt && <DetailRow label="Started"    value={formatDateTime(booking.startedAt)} />}
          {booking.completedAt && <DetailRow label="Completed"  value={formatDateTime(booking.completedAt)} />}
          {booking.cancelReason && (
            <div>
              <p className="text-xs text-light-text-3 dark:text-dark-text-3 mb-0.5">Cancel Reason</p>
              <p className="text-sm text-brand-red">{booking.cancelReason}</p>
            </div>
          )}
        </div>
      </div>

      <CancelBookingModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        bookingId={booking.bookingId}
        onConfirm={async (reason) => { await cancelMutation.mutateAsync(reason); }}
      />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-light-text-2 dark:text-dark-text-2">{label}</span>
      <span className="text-light-text dark:text-dark-text font-medium">{value}</span>
    </div>
  );
}
