"use client";

import { useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Phone, MapPin, Car, Building2, RefreshCw } from "lucide-react";
import { providersApi } from "@/lib/api/providers";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { UserStatusBadge, KycStatusBadge } from "@/components/ui/Badge";
import { TableSkeleton, Skeleton } from "@/components/ui/SkeletonLoader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { SuspendModal } from "@/components/partners/SuspendModal";
import { BlockModal } from "@/components/partners/BlockModal";
import { DeleteUserModal } from "@/components/partners/DeleteUserModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { KycDocViewer, KycActionBar } from "@/components/partners/KycDocViewer";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import type { ProviderServiceRequest, ServiceProviderCategory } from "@/types/provider";
import { CATEGORY_LABELS } from "@/types/provider";
import toast from "react-hot-toast";

type Tab = "overview" | "kyc" | "requests";


export default function ProviderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [requestsPage, setRequestsPage] = useState(1);

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [unsuspendOpen, setUnsuspendOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [unblockOpen, setUnblockOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [approveKycOpen, setApproveKycOpen] = useState(false);
  const [rejectKycOpen, setRejectKycOpen] = useState(false);

  const { data: provider, isLoading, refetch } = useQuery({
    queryKey: ["provider", id],
    queryFn: () => providersApi.getById(id),
  });

  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ["provider-service-requests", id, requestsPage],
    queryFn: () => providersApi.getServiceRequests(id, { page: requestsPage, limit: 15 }),
    enabled: tab === "requests",
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["provider", id] });
    queryClient.invalidateQueries({ queryKey: ["providers"] });
  };

  const suspendMutation = useMutation({
    mutationFn: (payload: { reason: string; isPermanent: boolean; endDate?: string }) =>
      providersApi.suspend(id, payload),
    onSuccess: () => { toast.success("Provider suspended"); setSuspendOpen(false); invalidate(); },
    onError: () => toast.error("Failed to suspend provider"),
  });

  const unsuspendMutation = useMutation({
    mutationFn: () => providersApi.unsuspend(id),
    onSuccess: () => { toast.success("Provider unsuspended"); setUnsuspendOpen(false); invalidate(); },
    onError: () => toast.error("Failed to unsuspend provider"),
  });

  const blockMutation = useMutation({
    mutationFn: (reason: string) => providersApi.block(id, reason),
    onSuccess: () => { toast.success("Provider blocked"); setBlockOpen(false); invalidate(); },
    onError: () => toast.error("Failed to block provider"),
  });

  const unblockMutation = useMutation({
    mutationFn: () => providersApi.unblock(id),
    onSuccess: () => { toast.success("Provider unblocked"); setUnblockOpen(false); invalidate(); },
    onError: () => toast.error("Failed to unblock provider"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => providersApi.deleteUser(id),
    onSuccess: () => {
      toast.success("Provider deleted");
      router.push("/providers");
    },
    onError: () => toast.error("Failed to delete provider"),
  });

  const approveKycMutation = useMutation({
    mutationFn: (note?: string) => providersApi.approveKyc(id, note),
    onSuccess: () => { toast.success("KYC approved"); setApproveKycOpen(false); invalidate(); refetch(); },
    onError: () => toast.error("Failed to approve KYC"),
  });

  const rejectKycMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => providersApi.rejectKyc(id, payload),
    onSuccess: () => { toast.success("KYC rejected — provider notified"); setRejectKycOpen(false); invalidate(); refetch(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to reject KYC"),
  });

  const reviewDocMutation = useMutation({
    mutationFn: (vars: { document: string; status: "APPROVED" | "REJECTED"; rejectReason?: string }) =>
      providersApi.reviewDocument(id, vars.document, vars.status, vars.rejectReason),
    onSuccess: () => { invalidate(); refetch(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to review document"),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="card">
        <EmptyState title="Provider not found" description="This provider does not exist or was deleted." />
      </div>
    );
  }

  const isSuspended = provider.status === "SUSPENDED";
  const isBlocked = provider.status === "BLOCKED";
  const kycRecord = provider.kycRecord;
  const category = (provider?.providerProfile?.category ?? null) as ServiceProviderCategory | null;
  const isDriver = category === "DRIVER";
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
        isDriver
          ? {
              label: "Driving Licence",
              fieldKey: "drivingLicence",
              url: (kycRecord as any).drivingLicenceUrl ?? null,
              status: (kycRecord as any).drivingLicenceStatus ?? "PENDING",
              rejectReason: (kycRecord as any).drivingLicenceRejectReason ?? null,
              isResubmitted: resubmittedSet.has("drivingLicence"),
            }
          : {
              label: "Business Document (Address Proof)",
              fieldKey: "businessDoc",
              url: (kycRecord as any).businessDocUrl ?? null,
              status: (kycRecord as any).businessDocStatus ?? "PENDING",
              rejectReason: (kycRecord as any).businessDocRejectReason ?? null,
              isResubmitted: resubmittedSet.has("businessDoc"),
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
      ...(isDriver
        ? ((kycRecord as any)?.drivingLicenceUrl
            ? {
                drivingLicenceStatus: "REJECTED",
                drivingLicenceRejectReason: "Documents do not meet requirements",
              }
            : {})
        : ((kycRecord as any)?.businessDocUrl
            ? {
                businessDocStatus: "REJECTED",
                businessDocRejectReason: "Documents do not meet requirements",
              }
            : {})),
    };
    await rejectKycMutation.mutateAsync(payload);
  };

  const handleApproveDoc = async (fieldKey: string) => {
    await reviewDocMutation.mutateAsync({ document: fieldKey, status: "APPROVED" });

    const fresh = await refetch();
    const freshKyc = (fresh.data as any)?.kycRecord;
    if (!freshKyc) return;

    const thirdUrl    = isDriver ? freshKyc.drivingLicenceUrl    : freshKyc.businessDocUrl;
    const thirdStatus = isDriver ? freshKyc.drivingLicenceStatus : freshKyc.businessDocStatus;

    const allApproved =
      freshKyc.aadhaarFrontStatus === "APPROVED" &&
      freshKyc.aadhaarBackStatus === "APPROVED" &&
      freshKyc.selfieStatus === "APPROVED" &&
      (!thirdUrl || thirdStatus === "APPROVED");

    const anyRejected =
      freshKyc.aadhaarFrontStatus === "REJECTED" ||
      freshKyc.aadhaarBackStatus === "REJECTED" ||
      freshKyc.selfieStatus === "REJECTED" ||
      (!!thirdUrl && thirdStatus === "REJECTED");

    if (allApproved && !anyRejected && freshKyc.status !== "APPROVED") {
      await approveKycMutation.mutateAsync("All documents verified");
    }
  };

  const handleRejectDoc = async (fieldKey: string, reason: string) => {
    await reviewDocMutation.mutateAsync({ document: fieldKey, status: "REJECTED", rejectReason: reason });
  };

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header card */}
      <div className="card">
        <button
          onClick={() => router.push("/providers")}
          className="flex items-center gap-1.5 text-sm text-light-text-2 dark:text-dark-text-2 hover:text-light-text dark:hover:text-dark-text mb-4 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Service Providers
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <Avatar name={provider.name} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold text-light-text dark:text-dark-text">{provider.name}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <UserStatusBadge status={provider.status} />
                  {provider.kycRecord && <KycStatusBadge status={provider.kycRecord.status} />}
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
              {provider.mobile && (
                <span className="flex items-center gap-1.5">
                  <Phone size={13} className="shrink-0" />
                  {provider.mobile}
                </span>
              )}
              {provider.providerProfile?.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} className="shrink-0" />
                  {provider.providerProfile.city}
                </span>
              )}
              {provider.kycRecord?.vehicleNumber && (
                <span className="flex items-center gap-1.5">
                  <Car size={13} className="shrink-0" />
                  {provider.kycRecord.vehicleNumber}
                </span>
              )}
              {provider.providerProfile?.businessName && (
                <span className="flex items-center gap-1.5">
                  <Building2 size={13} className="shrink-0" />
                  {provider.providerProfile.businessName}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-light-surface-2 dark:bg-dark-surface-2 rounded-xl p-1 w-fit">
        {(["overview", "kyc", "requests"] as Tab[]).map((t) => (
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
            {t === "kyc" ? "KYC" : t === "requests" ? "Service Requests" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-light-text dark:text-dark-text">Account Details</h3>
            <DetailRow label="Provider ID"  value={provider.id} mono />
            <DetailRow label="Category"     value={category ? CATEGORY_LABELS[category] : "—"} />
            {provider.providerProfile?.businessName && (
              <DetailRow label="Business Name" value={provider.providerProfile.businessName} />
            )}
            <DetailRow label="Joined"       value={formatDate(provider.createdAt)} />
            <DetailRow label="Wallet"       value={`₹${provider.walletBalance}`} />
            {provider.providerProfile?.rating != null && (
              <DetailRow label="Rating" value={`${provider.providerProfile.rating} ★`} />
            )}
            {provider.referralCode && (
              <DetailRow label="Referral Code" value={provider.referralCode} mono />
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
                      Provider resubmitted documents
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

      {tab === "requests" && (
        <div className="card p-0 overflow-hidden">
          {requestsLoading ? (
            <TableSkeleton rows={6} cols={4} />
          ) : (requestsData?.items ?? []).length === 0 ? (
            <EmptyState title="No service requests" description="This provider has no service request history yet" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Requested By</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(requestsData?.items ?? []).map((req: ProviderServiceRequest) => (
                      <tr key={req.id}>
                        <td>
                          <p className="text-sm font-medium text-light-text dark:text-dark-text">
                            {CATEGORY_LABELS[req.category] ?? req.category}
                          </p>
                          <p className="text-xs text-light-text-3 dark:text-dark-text-3">{req.serviceType}</p>
                        </td>
                        <td>
                          <p className="text-sm text-light-text-2 dark:text-dark-text-2">{req.driver?.name ?? "—"}</p>
                          <p className="text-xs text-light-text-3 dark:text-dark-text-3">{req.driver?.mobile ?? ""}</p>
                        </td>
                        <td>
                          <span className="text-sm text-light-text-2 dark:text-dark-text-2">
                            {formatDateTime(req.createdAt)}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm text-light-text-2 dark:text-dark-text-2">{req.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {requestsData?.pagination && (
                <Pagination pagination={requestsData.pagination} onPageChange={setRequestsPage} />
              )}
            </>
          )}
        </div>
      )}

      {/* Modals */}
      <SuspendModal
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        partnerName={provider.name}
        onConfirm={async (payload) => { await suspendMutation.mutateAsync(payload); }}
      />
      <ConfirmModal
        open={unsuspendOpen}
        onClose={() => setUnsuspendOpen(false)}
        onConfirm={() => unsuspendMutation.mutate()}
        title="Unsuspend Provider"
        description={`Remove suspension from ${provider.name}?`}
        confirmLabel="Unsuspend"
        variant="primary"
        loading={unsuspendMutation.isPending}
      />
      <BlockModal
        open={blockOpen}
        onClose={() => setBlockOpen(false)}
        partnerName={provider.name}
        onConfirm={async (reason) => { await blockMutation.mutateAsync(reason); }}
      />
      <ConfirmModal
        open={unblockOpen}
        onClose={() => setUnblockOpen(false)}
        onConfirm={() => unblockMutation.mutate()}
        title="Unblock Provider"
        description={`Unblock ${provider.name}?`}
        confirmLabel="Unblock"
        variant="primary"
        loading={unblockMutation.isPending}
      />
      <DeleteUserModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        partnerName={provider.name}
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
