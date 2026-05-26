"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { partnersApi } from "@/lib/api/partners";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { Pagination } from "@/components/ui/Pagination";
import { UserStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/SkeletonLoader";
import { Avatar } from "@/components/ui/Avatar";
import { SuspendModal } from "@/components/partners/SuspendModal";
import { BlockModal } from "@/components/partners/BlockModal";
import { DeleteUserModal } from "@/components/partners/DeleteUserModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Button } from "@/components/ui/Button";
import type { Partner } from "@/types/partner";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

const STATUS_OPTIONS = [
  { label: "Onboarding",       value: "ONBOARDING" },
  { label: "Profile Complete", value: "PROFILE_COMPLETE" },
  { label: "KYC Pending",      value: "KYC_PENDING" },
  { label: "Active",           value: "ACTIVE" },
  { label: "Suspended",        value: "SUSPENDED" },
  { label: "Blocked",          value: "BLOCKED" },
];

const SUB_TYPE_OPTIONS = [
  { label: "Individual", value: "INDIVIDUAL" },
  { label: "Business",   value: "BUSINESS" },
];

export default function PartnersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [subType, setSubType] = useState("");
  const [city, setCity] = useState("");

  const [suspendTarget, setSuspendTarget] = useState<Partner | null>(null);
  const [unsuspendTarget, setUnsuspendTarget] = useState<Partner | null>(null);
  const [blockTarget, setBlockTarget] = useState<Partner | null>(null);
  const [unblockTarget, setUnblockTarget] = useState<Partner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);

  const { data: citiesData } = useQuery({
    queryKey: ["partner-cities"],
    queryFn: partnersApi.getCities,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["partners", { page, search, status, subType, city }],
    queryFn: () =>
      partnersApi.getAll({
        page,
        limit: 20,
        ...(search && { search }),
        ...(status && { status }),
        ...(subType && { subType }),
        ...(city && { city }),
      }),
  });

  const cityOptions = (citiesData ?? []).map((c) => ({ label: c.city, value: c.city }));

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["partners"] });

  const suspendMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { reason: string; isPermanent: boolean; endDate?: string } }) =>
      partnersApi.suspend(id, payload),
    onSuccess: () => { toast.success("Partner suspended"); setSuspendTarget(null); invalidate(); },
    onError: () => toast.error("Failed to suspend partner"),
  });

  const unsuspendMutation = useMutation({
    mutationFn: (id: string) => partnersApi.unsuspend(id),
    onSuccess: () => { toast.success("Partner unsuspended"); setUnsuspendTarget(null); invalidate(); },
    onError: () => toast.error("Failed to unsuspend partner"),
  });

  const blockMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => partnersApi.block(id, reason),
    onSuccess: () => { toast.success("Partner blocked"); setBlockTarget(null); invalidate(); },
    onError: () => toast.error("Failed to block partner"),
  });

  const unblockMutation = useMutation({
    mutationFn: (id: string) => partnersApi.unblock(id),
    onSuccess: () => { toast.success("Partner unblocked"); setUnblockTarget(null); invalidate(); },
    onError: () => toast.error("Failed to unblock partner"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => partnersApi.deleteUser(id),
    onSuccess: () => { toast.success("Partner deleted"); setDeleteTarget(null); invalidate(); },
    onError: () => toast.error("Failed to delete partner"),
  });

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    setPage(1);
  }, []);

  const partners: Partner[] = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Search by name, email, phone..."
          className="w-full sm:w-72"
        />
        <FilterSelect
          value={status}
          onChange={(v) => { setStatus(v); setPage(1); }}
          options={STATUS_OPTIONS}
          placeholder="All Statuses"
          className="w-40"
        />
        <FilterSelect
          value={subType}
          onChange={(v) => { setSubType(v); setPage(1); }}
          options={SUB_TYPE_OPTIONS}
          placeholder="All Types"
          className="w-36"
        />
        {cityOptions.length > 0 && (
          <FilterSelect
            value={city}
            onChange={(v) => { setCity(v); setPage(1); }}
            options={cityOptions}
            placeholder="All Cities"
            className="w-36"
          />
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : partners.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Users}
            title="No partners found"
            description="Try adjusting your search or filters"
          />
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Partner</th>
                  <th>Type</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((partner) => (
                  <tr
                    key={partner._id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/partners/${partner._id}`)}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={partner.profilePicture}
                          name={partner.name}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium text-light-text dark:text-dark-text text-sm">
                            {partner.name}
                          </p>
                          <p className="text-xs text-light-text-3 dark:text-dark-text-3">
                            {partner.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm text-light-text-2 dark:text-dark-text-2">
                        {partner.subType === "BUSINESS"
                          ? partner.businessName ?? "Business"
                          : "Individual"}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-light-text-2 dark:text-dark-text-2">
                        {partner.city ?? "—"}
                      </span>
                    </td>
                    <td>
                      <UserStatusBadge status={partner.status} />
                    </td>
                    <td>
                      <span className="text-sm text-light-text-2 dark:text-dark-text-2">
                        {formatDate(partner.createdAt)}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {partner.status === "SUSPENDED" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setUnsuspendTarget(partner)}
                          >
                            Unsuspend
                          </Button>
                        ) : partner.status === "BLOCKED" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setUnblockTarget(partner)}
                          >
                            Unblock
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSuspendTarget(partner)}
                            >
                              Suspend
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setBlockTarget(partner)}
                              className="text-brand-red hover:text-brand-red hover:bg-brand-red-muted"
                            >
                              Block
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(partner)}
                          className="text-brand-red hover:text-brand-red hover:bg-brand-red-muted"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && (
            <Pagination pagination={pagination} onPageChange={setPage} />
          )}
        </div>
      )}

      {/* Modals */}
      <SuspendModal
        open={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        partnerName={suspendTarget?.name ?? ""}
        onConfirm={async (payload) => {
          if (!suspendTarget) return;
          await suspendMutation.mutateAsync({ id: suspendTarget._id, payload });
        }}
      />

      <ConfirmModal
        open={!!unsuspendTarget}
        onClose={() => setUnsuspendTarget(null)}
        onConfirm={() => unsuspendTarget && unsuspendMutation.mutate(unsuspendTarget._id)}
        title="Unsuspend Partner"
        description={`Remove suspension from ${unsuspendTarget?.name ?? "this partner"}?`}
        confirmLabel="Unsuspend"
        variant="primary"
        loading={unsuspendMutation.isPending}
      />

      <BlockModal
        open={!!blockTarget}
        onClose={() => setBlockTarget(null)}
        partnerName={blockTarget?.name ?? ""}
        onConfirm={async (reason) => {
          if (!blockTarget) return;
          await blockMutation.mutateAsync({ id: blockTarget._id, reason });
        }}
      />

      <ConfirmModal
        open={!!unblockTarget}
        onClose={() => setUnblockTarget(null)}
        onConfirm={() => unblockTarget && unblockMutation.mutate(unblockTarget._id)}
        title="Unblock Partner"
        description={`Unblock ${unblockTarget?.name ?? "this partner"}? They will regain platform access.`}
        confirmLabel="Unblock"
        variant="primary"
        loading={unblockMutation.isPending}
      />

      <DeleteUserModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        partnerName={deleteTarget?.name ?? ""}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync(deleteTarget._id);
        }}
      />
    </div>
  );
}
