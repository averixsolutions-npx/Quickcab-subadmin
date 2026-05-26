"use client";

import { useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Phone, Mail, MapPin, Car, Building2 } from "lucide-react";
import { partnersApi } from "@/lib/api/partners";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { UserStatusBadge, KycStatusBadge } from "@/components/ui/Badge";
import { TableSkeleton, Skeleton } from "@/components/ui/SkeletonLoader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { BookingStatusBadge } from "@/components/ui/Badge";
import { SuspendModal } from "@/components/partners/SuspendModal";
import { BlockModal } from "@/components/partners/BlockModal";
import { DeleteUserModal } from "@/components/partners/DeleteUserModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { KycDocViewer } from "@/components/partners/KycDocViewer";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import toast from "react-hot-toast";

type Tab = "overview" | "kyc" | "bookings";

const KYC_DOCS = [
  { key: "aadhaarFront",  label: "Aadhaar Front" },
  { key: "aadhaarBack",   label: "Aadhaar Back" },
  { key: "drivingLicence",label: "Driving Licence" },
  { key: "selfie",        label: "Selfie" },
  { key: "businessDoc",   label: "Business Document" },
] as const;

export default function PartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [bookingsPage, setBookingsPage] = useState(1);

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [unsuspendOpen, setUnsuspendOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [unblockOpen, setUnblockOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [approveKycOpen, setApproveKycOpen] = useState(false);
  const [rejectKycOpen, setRejectKycOpen] = useState(false);

  const { data: partner, isLoading, refetch } = useQuery({
    queryKey: ["partner", id],
    queryFn: () => partnersApi.getById(id),
  });

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ["partner-bookings", id, bookingsPage],
    queryFn: () => partnersApi.getBookings(id, { page: bookingsPage, limit: 15 }),
    enabled: tab === "bookings",
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["partner", id] });
    queryClient.invalidateQueries({ queryKey: ["partners"] });
  };

  const suspendMutation = useMutation({
    mutationFn: (payload: { reason: string; isPermanent: boolean; endDate?: string }) =>
      partnersApi.suspend(id, payload),
    onSuccess: () => { toast.success("Partner suspended"); setSuspendOpen(false); invalidate(); },
    onError: () => toast.error("Failed to suspend partner"),
  });

  const unsuspendMutation = useMutation({
    mutationFn: () => partnersApi.unsuspend(id),
    onSuccess: () => { toast.success("Partner unsuspended"); setUnsuspendOpen(false); invalidate(); },
    onError: () => toast.error("Failed to unsuspend partner"),
  });

  const blockMutation = useMutation({
    mutationFn: (reason: string) => partnersApi.block(id, reason),
    onSuccess: () => { toast.success("Partner blocked"); setBlockOpen(false); invalidate(); },
    onError: () => toast.error("Failed to block partner"),
  });

  const unblockMutation = useMutation({
    mutationFn: () => partnersApi.unblock(id),
    onSuccess: () => { toast.success("Partner unblocked"); setUnblockOpen(false); invalidate(); },
    onError: () => toast.error("Failed to unblock partner"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => partnersApi.deleteUser(id),
    onSuccess: () => {
      toast.success("Partner deleted");
      router.push("/partners");
    },
    onError: () => toast.error("Failed to delete partner"),
  });

  const approveKycMutation = useMutation({
    mutationFn: () => partnersApi.approveKyc(id),
    onSuccess: () => { toast.success("KYC approved"); setApproveKycOpen(false); invalidate(); },
    onError: () => toast.error("Failed to approve KYC"),
  });

  const rejectKycMutation = useMutation({
    mutationFn: () => partnersApi.rejectKyc(id, { reason: "Documents do not meet requirements" }),
    onSuccess: () => { toast.success("KYC rejected"); setRejectKycOpen(false); invalidate(); },
    onError: () => toast.error("Failed to reject KYC"),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="card">
        <EmptyState title="Partner not found" description="This partner does not exist or was deleted." />
      </div>
    );
  }

  const isSuspended = partner.status === "SUSPENDED";
  const isBlocked = partner.status === "BLOCKED";
  const kycPending = partner.kyc?.status === "PENDING";

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header card */}
      <div className="card">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-light-text-2 dark:text-dark-text-2 hover:text-light-text dark:hover:text-dark-text mb-4 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Partners
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <Avatar src={partner.profilePicture} name={partner.name} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold text-light-text dark:text-dark-text">{partner.name}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <UserStatusBadge status={partner.status} />
                  {partner.kyc && <KycStatusBadge status={partner.kyc.status} />}
                </div>
              </div>
              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                {isSuspended ? (
                  <Button variant="secondary" size="sm" onClick={() => setUnsuspendOpen(true)}>
                    Unsuspend
                  </Button>
                ) : isBlocked ? (
                  <Button variant="secondary" size="sm" onClick={() => setUnblockOpen(true)}>
                    Unblock
                  </Button>
                ) : (
                  <>
                    <Button variant="secondary" size="sm" onClick={() => setSuspendOpen(true)}>
                      Suspend
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setBlockOpen(true)}>
                      Block
                    </Button>
                  </>
                )}
                <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
                  Delete
                </Button>
              </div>
            </div>

            {/* Info row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-sm text-light-text-2 dark:text-dark-text-2">
              {partner.email && (
                <span className="flex items-center gap-1.5">
                  <Mail size={13} className="shrink-0" />
                  {partner.email}
                </span>
              )}
              {partner.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone size={13} className="shrink-0" />
                  {partner.phone}
                </span>
              )}
              {partner.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} className="shrink-0" />
                  {partner.city}
                </span>
              )}
              {partner.vehicleNumber && (
                <span className="flex items-center gap-1.5">
                  <Car size={13} className="shrink-0" />
                  {partner.vehicleNumber}
                </span>
              )}
              {partner.businessName && (
                <span className="flex items-center gap-1.5">
                  <Building2 size={13} className="shrink-0" />
                  {partner.businessName}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-light-surface-2 dark:bg-dark-surface-2 rounded-xl p-1 w-fit">
        {(["overview", "kyc", "bookings"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 capitalize",
              tab === t
                ? "bg-white dark:bg-dark-surface text-light-text dark:text-dark-text shadow-sm"
                : "text-light-text-2 dark:text-dark-text-2 hover:text-light-text dark:hover:text-dark-text"
            )}
          >
            {t === "kyc" ? "KYC" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-light-text dark:text-dark-text">Account Details</h3>
            <DetailRow label="Partner ID"    value={partner._id} mono />
            <DetailRow label="Type"          value={partner.subType} />
            <DetailRow label="Joined"        value={formatDate(partner.createdAt)} />
            <DetailRow label="Last Updated"  value={formatDate(partner.updatedAt)} />
            {partner.rating != null && <DetailRow label="Rating" value={`${partner.rating} ★`} />}
            {partner.totalBookings != null && <DetailRow label="Total Bookings" value={String(partner.totalBookings)} />}
          </div>

          {(isSuspended || isBlocked) && (
            <div className="card space-y-3">
              <h3 className="text-sm font-semibold text-light-text dark:text-dark-text">
                {isSuspended ? "Suspension Details" : "Block Details"}
              </h3>
              {isSuspended && partner.suspension && (
                <>
                  <DetailRow label="Reason"    value={partner.suspension.reason} />
                  <DetailRow label="Permanent" value={partner.suspension.isPermanent ? "Yes" : "No"} />
                  {partner.suspension.endDate && (
                    <DetailRow label="End Date" value={formatDate(partner.suspension.endDate)} />
                  )}
                  <DetailRow label="Since" value={formatDate(partner.suspension.startDate)} />
                </>
              )}
              {isBlocked && partner.blockReason && (
                <DetailRow label="Reason" value={partner.blockReason} />
              )}
            </div>
          )}
        </div>
      )}

      {tab === "kyc" && (
        <div className="space-y-4">
          {kycPending && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-brand-orange-muted border border-brand-orange/20">
              <p className="text-sm text-brand-orange flex-1">
                KYC submission is pending review. Review all documents before approving or rejecting.
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setApproveKycOpen(true)}>
                  Approve All
                </Button>
                <Button variant="danger" size="sm" onClick={() => setRejectKycOpen(true)}>
                  Reject
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {KYC_DOCS.map(({ key, label }) => (
              <KycDocViewer
                key={key}
                userId={id}
                fieldKey={key}
                label={label}
                doc={partner.kyc?.[key as keyof typeof partner.kyc] as Parameters<typeof KycDocViewer>[0]["doc"]}
                onRefresh={refetch}
              />
            ))}
          </div>
        </div>
      )}

      {tab === "bookings" && (
        <div>
          {bookingsLoading ? (
            <TableSkeleton rows={6} cols={5} />
          ) : !bookingsData?.items?.length ? (
            <div className="card">
              <EmptyState title="No bookings" description="This partner has no bookings yet." />
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Pickup</th>
                      <th>Drop</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingsData.items.map((b: { _id: string; bookingId: string; pickupLocation: { address: string }; dropLocation: { address: string }; status: import("@/types/booking").BookingStatus; createdAt: string }) => (
                      <tr
                        key={b._id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/bookings/${b._id}`)}
                      >
                        <td>
                          <span className="font-mono text-xs text-light-text dark:text-dark-text">
                            {b.bookingId}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm text-light-text-2 dark:text-dark-text-2 line-clamp-1 max-w-[150px]">
                            {b.pickupLocation.address}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm text-light-text-2 dark:text-dark-text-2 line-clamp-1 max-w-[150px]">
                            {b.dropLocation.address}
                          </span>
                        </td>
                        <td><BookingStatusBadge status={b.status} /></td>
                        <td>
                          <span className="text-sm text-light-text-2 dark:text-dark-text-2">
                            {formatDate(b.createdAt)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {bookingsData.pagination && (
                <Pagination pagination={bookingsData.pagination} onPageChange={setBookingsPage} />
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <SuspendModal
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        partnerName={partner.name}
        onConfirm={async (payload) => { await suspendMutation.mutateAsync(payload); }}
      />
      <ConfirmModal
        open={unsuspendOpen}
        onClose={() => setUnsuspendOpen(false)}
        onConfirm={() => unsuspendMutation.mutate()}
        title="Unsuspend Partner"
        description={`Remove suspension from ${partner.name}?`}
        confirmLabel="Unsuspend"
        variant="primary"
        loading={unsuspendMutation.isPending}
      />
      <BlockModal
        open={blockOpen}
        onClose={() => setBlockOpen(false)}
        partnerName={partner.name}
        onConfirm={async (reason) => { await blockMutation.mutateAsync(reason); }}
      />
      <ConfirmModal
        open={unblockOpen}
        onClose={() => setUnblockOpen(false)}
        onConfirm={() => unblockMutation.mutate()}
        title="Unblock Partner"
        description={`Unblock ${partner.name}?`}
        confirmLabel="Unblock"
        variant="primary"
        loading={unblockMutation.isPending}
      />
      <DeleteUserModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        partnerName={partner.name}
        onConfirm={async () => { await deleteMutation.mutateAsync(); }}
      />
      <ConfirmModal
        open={approveKycOpen}
        onClose={() => setApproveKycOpen(false)}
        onConfirm={() => approveKycMutation.mutate()}
        title="Approve KYC"
        description={`Approve the KYC submission for ${partner.name}?`}
        confirmLabel="Approve"
        variant="primary"
        loading={approveKycMutation.isPending}
      />
      <ConfirmModal
        open={rejectKycOpen}
        onClose={() => setRejectKycOpen(false)}
        onConfirm={() => rejectKycMutation.mutate()}
        title="Reject KYC"
        description={`Reject the KYC submission for ${partner.name}?`}
        confirmLabel="Reject"
        variant="danger"
        loading={rejectKycMutation.isPending}
      />
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-light-text-2 dark:text-dark-text-2 shrink-0">{label}</span>
      <span className={cn("text-light-text dark:text-dark-text text-right", mono && "font-mono text-xs")}>
        {value}
      </span>
    </div>
  );
}
