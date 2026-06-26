"use client";

import { useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Phone, MapPin, Car, Building2, RefreshCw } from "lucide-react";
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
import { KycDocViewer, KycActionBar } from "@/components/partners/KycDocViewer";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import type { Booking } from "@/types/booking";
import toast from "react-hot-toast";

type Tab = "overview" | "kyc" | "bookings";


export default function PartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [bookingsPage, setBookingsPage] = useState(1);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

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
    mutationFn: (note?: string) => partnersApi.approveKyc(id, note),
    onSuccess: () => { toast.success("KYC approved"); setApproveKycOpen(false); invalidate(); refetch(); },
    onError: () => toast.error("Failed to approve KYC"),
  });

  const rejectKycMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => partnersApi.rejectKyc(id, payload),
    onSuccess: () => { toast.success("KYC rejected — partner notified"); setRejectKycOpen(false); invalidate(); refetch(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to reject KYC"),
  });

  const reviewDocMutation = useMutation({
    mutationFn: (vars: { document: string; status: "APPROVED" | "REJECTED"; rejectReason?: string }) =>
      partnersApi.reviewDocument(id, vars.document, vars.status, vars.rejectReason),
    onSuccess: () => { invalidate(); refetch(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to review document"),
  });

  const uploadKycDocMutation = useMutation({
    mutationFn: async (vars: { fieldKey: string; file: File }) => {
      const ext = vars.file.name.split(".").pop() || "jpg";
      const { uploadUrl, fileKey } = await partnersApi.getKycUploadUrl(vars.fieldKey, ext);
      await fetch(uploadUrl, {
        method: "PUT",
        body: vars.file,
        headers: { "Content-Type": vars.file.type },
      });
      await partnersApi.saveKycDocImage(id, vars.fieldKey, fileKey);
    },
    onSuccess: () => { toast.success("Document uploaded"); invalidate(); refetch(); },
    onError: () => toast.error("Upload failed. Please try again."),
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
  const kycRecord = partner.kycRecord;
  const resubmittedSet = new Set<string>(
    (kycRecord as any)?.resubmittedDocuments ?? []
  );

  const kycDocs = kycRecord
    ? [
        {
          label: "Aadhaar Front",
          fieldKey: "aadhaarFront",
          url: (kycRecord as any).aadhaarFrontUrl ?? null,
          status: (kycRecord as any).aadhaarFrontStatus ?? "PENDING",
          rejectReason: (kycRecord as any).aadhaarRejectReason ?? null,
          isResubmitted: resubmittedSet.has("aadhaarFront"),
        },
        {
          label: "Aadhaar Back",
          fieldKey: "aadhaarBack",
          url: (kycRecord as any).aadhaarBackUrl ?? null,
          status: (kycRecord as any).aadhaarBackStatus ?? "PENDING",
          rejectReason: (kycRecord as any).aadhaarRejectReason ?? null,
          isResubmitted: resubmittedSet.has("aadhaarBack"),
        },
        {
          label: "Driving Licence",
          fieldKey: "drivingLicence",
          url: (kycRecord as any).drivingLicenceUrl ?? null,
          status: (kycRecord as any).drivingLicenceStatus ?? "PENDING",
          rejectReason: (kycRecord as any).drivingLicenceRejectReason ?? null,
          isResubmitted: resubmittedSet.has("drivingLicence"),
        },
        {
          label: "Selfie",
          fieldKey: "selfie",
          url: (kycRecord as any).selfieUrl ?? null,
          status: (kycRecord as any).selfieStatus ?? "PENDING",
          rejectReason: (kycRecord as any).selfieRejectReason ?? null,
          isResubmitted: resubmittedSet.has("selfie"),
        },
      ]
    : [];

  const handleApproveKyc = async () => {
    await approveKycMutation.mutateAsync("All documents verified");
  };

  const handleRejectKyc = async () => {
    const payload = {
      adminNote: "Documents do not meet requirements",
      aadhaarFrontStatus: "REJECTED",
      aadhaarFrontRejectReason: "Documents do not meet requirements",
      aadhaarBackStatus: "REJECTED",
      aadhaarBackRejectReason: "Documents do not meet requirements",
      selfieStatus: "REJECTED",
      selfieRejectReason: "Documents do not meet requirements",
      ...((kycRecord as any)?.drivingLicenceUrl
        ? {
            drivingLicenceStatus: "REJECTED",
            drivingLicenceRejectReason: "Documents do not meet requirements",
          }
        : {}),
    };
    await rejectKycMutation.mutateAsync(payload);
  };

  const handleApproveDoc = async (fieldKey: string) => {
    await reviewDocMutation.mutateAsync({ document: fieldKey, status: "APPROVED" });

    const fresh = await refetch();
    const freshKyc = (fresh.data as any)?.kycRecord;
    if (!freshKyc) return;

    const allApproved =
      freshKyc.aadhaarFrontStatus === "APPROVED" &&
      freshKyc.aadhaarBackStatus === "APPROVED" &&
      freshKyc.selfieStatus === "APPROVED" &&
      (!freshKyc.drivingLicenceUrl || freshKyc.drivingLicenceStatus === "APPROVED");

    const anyRejected =
      freshKyc.aadhaarFrontStatus === "REJECTED" ||
      freshKyc.aadhaarBackStatus === "REJECTED" ||
      freshKyc.selfieStatus === "REJECTED" ||
      (!!freshKyc.drivingLicenceUrl && freshKyc.drivingLicenceStatus === "REJECTED");

    if (allApproved && !anyRejected && freshKyc.status !== "APPROVED") {
      await approveKycMutation.mutateAsync("All documents verified");
    }
  };

  const handleRejectDoc = async (fieldKey: string, reason: string) => {
    await reviewDocMutation.mutateAsync({ document: fieldKey, status: "REJECTED", rejectReason: reason });
  };

  const handleUploadDoc = async (fieldKey: string, file: File) => {
    setUploadingField(fieldKey);
    try {
      await uploadKycDocMutation.mutateAsync({ fieldKey, file });
    } finally {
      setUploadingField(null);
    }
  };

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
          <Avatar name={partner.name} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold text-light-text dark:text-dark-text">{partner.name}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <UserStatusBadge status={partner.status} />
                  {partner.kycRecord && <KycStatusBadge status={partner.kycRecord.status} />}
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
              {partner.mobile && (
                <span className="flex items-center gap-1.5">
                  <Phone size={13} className="shrink-0" />
                  {partner.mobile}
                </span>
              )}
              {partner.partnerProfile?.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} className="shrink-0" />
                  {partner.partnerProfile.city}
                </span>
              )}
              {partner.kycRecord?.vehicleNumber && (
                <span className="flex items-center gap-1.5">
                  <Car size={13} className="shrink-0" />
                  {partner.kycRecord.vehicleNumber}
                </span>
              )}
              {partner.kycRecord?.businessName && (
                <span className="flex items-center gap-1.5">
                  <Building2 size={13} className="shrink-0" />
                  {partner.kycRecord.businessName}
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
            <DetailRow label="Partner ID"   value={partner.id} mono />
            <DetailRow label="Type"         value={partner.partnerProfile?.subType ?? "—"} />
            <DetailRow label="Joined"       value={formatDate(partner.createdAt)} />
            <DetailRow label="Wallet"       value={`₹${partner.walletBalance}`} />
            {partner.partnerProfile?.rating != null && (
              <DetailRow label="Rating" value={`${partner.partnerProfile.rating} ★`} />
            )}
            {partner.referralCode && (
              <DetailRow label="Referral Code" value={partner.referralCode} mono />
            )}
          </div>
        </div>
      )}

      {tab === "kyc" && (
        <div className="space-y-4">
          {kycRecord ? (
            <>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-[13px] text-light-text-2 dark:text-dark-text-2">
                    Review all uploaded documents below
                  </p>
                </div>
                <KycActionBar
                  kycStatus={(kycRecord as any).status}
                  onApprove={handleApproveKyc}
                  onReject={handleRejectKyc}
                  loading={approveKycMutation.isPending || rejectKycMutation.isPending}
                  approving={approveKycMutation.isPending}
                  rejecting={rejectKycMutation.isPending}
                />
              </div>

              {/* Resubmission notice */}
              {((kycRecord as any).resubmittedDocuments?.length ?? 0) > 0 && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-brand-purple-muted dark:bg-brand-purple-muted-dark border border-brand-purple/20">
                  <RefreshCw size={16} className="text-brand-purple mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[13px] font-semibold text-brand-purple">
                      Partner resubmitted documents
                    </p>
                    <p className="text-[12px] text-light-text-2 dark:text-dark-text-2 mt-0.5">
                      Re-uploaded: {(kycRecord as any).resubmittedDocuments!.join(", ")}
                      {(kycRecord as any).resubmittedAt ? ` · ${formatDateTime((kycRecord as any).resubmittedAt)}` : ""}
                    </p>
                    <p className="text-[12px] text-light-text-3 dark:text-dark-text-3 mt-1">
                      Previously approved documents do not need re-review
                    </p>
                  </div>
                </div>
              )}

              <KycDocViewer
                docs={kycDocs}
                userId={id}
                onApproveDoc={handleApproveDoc}
                onRejectDoc={handleRejectDoc}
                onUploadDoc={handleUploadDoc}
                uploadingField={uploadingField}
                loading={reviewDocMutation.isPending}
                processingField={reviewDocMutation.isPending ? reviewDocMutation.variables?.document ?? null : null}
              />
            </>
          ) : (
            <div className="card text-center py-12">
              <p className="text-light-text-2 dark:text-dark-text-2">
                No KYC documents submitted yet
              </p>
            </div>
          )}
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
                    {bookingsData.items.map((b: Booking) => (
                      <tr
                        key={b.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/bookings/${b.id}`)}
                      >
                        <td>
                          <span className="font-mono text-xs text-light-text dark:text-dark-text">
                            {b.id.slice(-8).toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm text-light-text-2 dark:text-dark-text-2 line-clamp-1 max-w-[150px]">
                            {b.pickupCity}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm text-light-text-2 dark:text-dark-text-2 line-clamp-1 max-w-[150px]">
                            {b.dropCity}
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
