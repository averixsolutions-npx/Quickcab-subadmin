"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { bookingsApi } from "@/lib/api/bookings";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { Pagination } from "@/components/ui/Pagination";
import { BookingStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/SkeletonLoader";
import { Button } from "@/components/ui/Button";
import { CancelBookingModal } from "@/components/bookings/CancelBookingModal";
import { formatDateTime } from "@/lib/utils";
import type { Booking } from "@/types/booking";
import toast from "react-hot-toast";

const STATUS_OPTIONS = [
  { label: "Open",      value: "OPEN" },
  { label: "Booked",    value: "BOOKED" },
  { label: "Expired",   value: "EXPIRED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export default function BookingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["bookings", { page, search, status }],
    queryFn: () =>
      bookingsApi.getAll({
        page,
        limit: 20,
        ...(search && { search }),
        ...(status && { status }),
      }),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => bookingsApi.cancel(id, reason),
    onSuccess: () => {
      toast.success("Booking cancelled");
      setCancelTarget(null);
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: () => toast.error("Failed to cancel booking"),
  });

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    setPage(1);
  }, []);

  const bookings: Booking[] = data?.items ?? [];
  const pagination = data?.pagination;

  const canCancel = (s: string) => ["OPEN", "BOOKED"].includes(s);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Search by booking ID, partner..."
          className="w-full sm:w-72"
        />
        <FilterSelect
          value={status}
          onChange={(v) => { setStatus(v); setPage(1); }}
          options={STATUS_OPTIONS}
          placeholder="All Statuses"
          className="w-44"
        />
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : bookings.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={BookOpen}
            title="No bookings found"
            description="Try adjusting your search or filters"
          />
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Posted By</th>
                  <th>Pickup</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/bookings/${booking.id}`)}
                  >
                    <td>
                      <span className="font-mono text-xs text-light-text dark:text-dark-text">
                        {booking.id.slice(-8).toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-light-text-2 dark:text-dark-text-2">
                        {booking.postedBy?.name ?? "—"}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-light-text-2 dark:text-dark-text-2 line-clamp-1 max-w-[180px] block">
                        {booking.pickupCity}
                      </span>
                    </td>
                    <td>
                      <BookingStatusBadge status={booking.status} />
                    </td>
                    <td>
                      <span className="text-sm text-light-text-2 dark:text-dark-text-2">
                        {formatDateTime(booking.createdAt)}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {canCancel(booking.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCancelTarget(booking)}
                          className="text-brand-red hover:text-brand-red hover:bg-brand-red-muted"
                        >
                          Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}
        </div>
      )}

      <CancelBookingModal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        bookingId={cancelTarget?.id.slice(-8).toUpperCase() ?? ""}
        onConfirm={async (reason) => {
          if (!cancelTarget) return;
          await cancelMutation.mutateAsync({ id: cancelTarget.id, reason });
        }}
      />
    </div>
  );
}
