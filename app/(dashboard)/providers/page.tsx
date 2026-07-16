"use client";

import { Suspense, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wrench, UserCheck, UserX, Clock } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { providersApi } from "@/lib/api/providers";
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
import type { Provider } from "@/types/provider";
import { CATEGORY_LABELS } from "@/types/provider";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

const CATEGORY_OPTIONS = [
  { label: "Driver",             value: "DRIVER" },
  { label: "Puncture Repair",    value: "PUNCTURE_REPAIR" },
  { label: "Mechanic",           value: "MECHANIC" },
  { label: "Towing",             value: "TOWING" },
  { label: "Fuel Pump",          value: "FUEL_PUMP" },
  { label: "Restaurant / Hotel", value: "RESTAURANT_HOTEL" },
  { label: "Hospital",           value: "HOSPITAL" },
];

const STATUS_OPTIONS = [
  { label: "Onboarding",       value: "ONBOARDING" },
  { label: "Profile Complete", value: "PROFILE_COMPLETE" },
  { label: "KYC Pending",      value: "KYC_PENDING" },
  { label: "Active",           value: "ACTIVE" },
  { label: "Suspended",        value: "SUSPENDED" },
  { label: "Blocked",          value: "BLOCKED" },
];

const DATE_PRESET_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "week",  label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year",  label: "This Year" },
];

function getDateRange(preset: string): { dateFrom?: string; dateTo?: string } {
  if (!preset) return {};
  const now = new Date();
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  if (preset === "today") return { dateFrom: start.toISOString() };
  if (preset === "week")  { const d = new Date(start); d.setDate(d.getDate() - 7);        return { dateFrom: d.toISOString() }; }
  if (preset === "month") { const d = new Date(start); d.setMonth(d.getMonth() - 1);      return { dateFrom: d.toISOString() }; }
  if (preset === "year")  { const d = new Date(start); d.setFullYear(d.getFullYear() - 1); return { dateFrom: d.toISOString() }; }
  return {};
}

function ProvidersPageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  // ── URL-driven filter state ──────────────────────────────────────────────
  const page       = Number(searchParams.get("page")       ?? "1");
  const search     = searchParams.get("search")     ?? "";
  const status     = searchParams.get("status")     ?? "";
  const category   = searchParams.get("category")   ?? "";
  const city       = searchParams.get("city")       ?? "";
  const datePreset = searchParams.get("datePreset") ?? "";

  // Keep a ref so stable callbacks always read the latest params
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const updateParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParamsRef.current.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    router.replace(`?${params.toString()}`);
  }, [router]);

  // ── Modal state (UI-only — not in URL) ───────────────────────────────────
  const [suspendTarget,   setSuspendTarget]   = useState<Provider | null>(null);
  const [unsuspendTarget, setUnsuspendTarget] = useState<Provider | null>(null);
  const [blockTarget,     setBlockTarget]     = useState<Provider | null>(null);
  const [unblockTarget,   setUnblockTarget]   = useState<Provider | null>(null);
  const [deleteTarget,    setDeleteTarget]    = useState<Provider | null>(null);

  // ── Data ─────────────────────────────────────────────────────────────────
  const { data: citiesData } = useQuery({
    queryKey: ["provider-cities"],
    queryFn: providersApi.getCities,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["providers", { page, search, status, category, city, datePreset }],
    queryFn: () =>
      providersApi.getAll({
        page,
        limit: 20,
        ...(search   && { search }),
        ...(status   && { status }),
        ...(category && { category }),
        ...(city     && { city }),
        ...getDateRange(datePreset),
      }),
  });

  // Global stat counts — each fetches only 1 record to get pagination.total
  const { data: activeStats }    = useQuery({
    queryKey: ["providers-stat", "ACTIVE"],
    queryFn: () => providersApi.getAll({ page: 1, limit: 1, status: "ACTIVE" }),
    staleTime: 60_000,
  });
  const { data: kycStats }       = useQuery({
    queryKey: ["providers-stat", "KYC_PENDING"],
    queryFn: () => providersApi.getAll({ page: 1, limit: 1, status: "KYC_PENDING" }),
    staleTime: 60_000,
  });
  const { data: suspendedStats } = useQuery({
    queryKey: ["providers-stat", "SUSPENDED"],
    queryFn: () => providersApi.getAll({ page: 1, limit: 1, status: "SUSPENDED" }),
    staleTime: 60_000,
  });

  const cityOptions = (citiesData ?? []).map((c) => ({ label: c.city, value: c.city }));
  const invalidate  = () => queryClient.invalidateQueries({ queryKey: ["providers"] });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const suspendMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { reason: string; isPermanent: boolean; endDate?: string } }) =>
      providersApi.suspend(id, payload),
    onSuccess: () => { toast.success("Provider suspended");   setSuspendTarget(null);   invalidate(); },
    onError:   () => toast.error("Failed to suspend provider"),
  });

  const unsuspendMutation = useMutation({
    mutationFn: (id: string) => providersApi.unsuspend(id),
    onSuccess: () => { toast.success("Provider unsuspended"); setUnsuspendTarget(null); invalidate(); },
    onError:   () => toast.error("Failed to unsuspend provider"),
  });

  const blockMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => providersApi.block(id, reason),
    onSuccess: () => { toast.success("Provider blocked");     setBlockTarget(null);     invalidate(); },
    onError:   () => toast.error("Failed to block provider"),
  });

  const unblockMutation = useMutation({
    mutationFn: (id: string) => providersApi.unblock(id),
    onSuccess: () => { toast.success("Provider unblocked");   setUnblockTarget(null);   invalidate(); },
    onError:   () => toast.error("Failed to unblock provider"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => providersApi.deleteUser(id),
    onSuccess: () => { toast.success("Provider deleted");     setDeleteTarget(null);    invalidate(); },
    onError:   () => toast.error("Failed to delete provider"),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  // Guard: only update if value actually changed — prevents SearchInput's
  // onChange from resetting page on mount when value matches URL already
  const handleSearch = useCallback((val: string) => {
    if (val === (searchParamsRef.current.get("search") ?? "")) return;
    updateParams({ search: val, page: "1" });
  }, [updateParams]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const providers: Provider[] = data?.items ?? [];
  const pagination = data?.pagination;

  const activeCount     = activeStats?.pagination?.total    ?? 0;
  const pendingKycCount = kycStats?.pagination?.total       ?? 0;
  const suspendedCount  = suspendedStats?.pagination?.total ?? 0;

  return (
    <div className="space-y-6">

      {/* ── Stat Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Providers"
          value={(pagination?.total ?? 0).toLocaleString("en-IN")}
          icon={Wrench}
          onClick={() => updateParams({ status: "", category: "", city: "", datePreset: "", page: "1" })}
        />
        <StatCard
          label="Active"
          value={activeCount}
          icon={UserCheck}
          iconColor="text-brand-green"
          iconBg="bg-green-50 dark:bg-green-950/30"
          onClick={() => updateParams({ status: "ACTIVE", page: "1" })}
        />
        <StatCard
          label="KYC Pending"
          value={pendingKycCount}
          icon={Clock}
          iconColor={pendingKycCount > 5 ? "text-brand-orange" : "text-brand-purple"}
          iconBg={pendingKycCount > 5 ? "bg-orange-50 dark:bg-orange-950/30" : "bg-brand-purple-muted dark:bg-brand-purple-muted-dark"}
          onClick={() => updateParams({ status: "KYC_PENDING", page: "1" })}
        />
        <StatCard
          label="Suspended"
          value={suspendedCount}
          icon={UserX}
          iconColor="text-brand-red"
          iconBg="bg-red-50 dark:bg-red-950/30"
          onClick={() => updateParams({ status: "SUSPENDED", page: "1" })}
        />
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Search by name, mobile, business..."
          className="w-full sm:w-72"
        />
        <FilterSelect
          value={status}
          onChange={(v) => updateParams({ status: v, page: "1" })}
          options={STATUS_OPTIONS}
          placeholder="All Statuses"
          className="w-40"
        />
        <FilterSelect
          value={category}
          onChange={(v) => updateParams({ category: v, page: "1" })}
          options={CATEGORY_OPTIONS}
          placeholder="All Categories"
          className="w-44"
        />
        {cityOptions.length > 0 && (
          <FilterSelect
            value={city}
            onChange={(v) => updateParams({ city: v, page: "1" })}
            options={cityOptions}
            placeholder="All Cities"
            className="w-36"
          />
        )}
        <FilterSelect
          value={datePreset}
          onChange={(v) => updateParams({ datePreset: v, page: "1" })}
          options={DATE_PRESET_OPTIONS}
          placeholder="All Time"
          className="w-36"
        />
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : providers.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Wrench}
            title="No service providers found"
            description="Try adjusting your search or filters"
          />
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Category</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((provider) => (
                  <tr
                    key={provider.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/providers/${provider.id}`)}
                  >
                    {/* Provider */}
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={provider.name} size="sm" />
                        <div>
                          <p className="font-medium text-light-text dark:text-dark-text text-sm">
                            {provider.name}
                          </p>
                          <p className="text-xs text-light-text-3 dark:text-dark-text-3">
                            {provider.providerProfile?.email ?? provider.mobile}
                          </p>
                          {provider.displayId && (
                            <p className="text-[10px] text-light-text-3 dark:text-dark-text-3 font-mono">
                              {provider.displayId}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td>
                      <span className="text-sm text-light-text-2 dark:text-dark-text-2">
                        {provider.providerProfile?.category
                          ? CATEGORY_LABELS[provider.providerProfile.category]
                          : "—"}
                      </span>
                    </td>

                    {/* City */}
                    <td>
                      <span className="text-sm text-light-text-2 dark:text-dark-text-2">
                        {provider.providerProfile?.city ?? "—"}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <UserStatusBadge status={provider.status} />
                    </td>

                    {/* Joined */}
                    <td>
                      <span className="text-sm text-light-text-2 dark:text-dark-text-2">
                        {formatDate(provider.createdAt)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {provider.status === "SUSPENDED" ? (
                          <Button variant="ghost" size="sm" onClick={() => setUnsuspendTarget(provider)}>
                            Unsuspend
                          </Button>
                        ) : provider.status === "BLOCKED" ? (
                          <Button variant="ghost" size="sm" onClick={() => setUnblockTarget(provider)}>
                            Unblock
                          </Button>
                        ) : (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => setSuspendTarget(provider)}>
                              Suspend
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setBlockTarget(provider)}
                              className="text-brand-red hover:text-brand-red hover:bg-brand-red-muted"
                            >
                              Block
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(provider)}
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
            <Pagination
              pagination={pagination}
              onPageChange={(n) => updateParams({ page: String(n) })}
            />
          )}
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <SuspendModal
        open={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        partnerName={suspendTarget?.name ?? ""}
        onConfirm={async (payload) => {
          if (!suspendTarget) return;
          await suspendMutation.mutateAsync({ id: suspendTarget.id, payload });
        }}
      />

      <ConfirmModal
        open={!!unsuspendTarget}
        onClose={() => setUnsuspendTarget(null)}
        onConfirm={() => unsuspendTarget && unsuspendMutation.mutate(unsuspendTarget.id)}
        title="Unsuspend Provider"
        description={`Remove suspension from ${unsuspendTarget?.name ?? "this provider"}?`}
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
          await blockMutation.mutateAsync({ id: blockTarget.id, reason });
        }}
      />

      <ConfirmModal
        open={!!unblockTarget}
        onClose={() => setUnblockTarget(null)}
        onConfirm={() => unblockTarget && unblockMutation.mutate(unblockTarget.id)}
        title="Unblock Provider"
        description={`Unblock ${unblockTarget?.name ?? "this provider"}? They will regain platform access.`}
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
          await deleteMutation.mutateAsync(deleteTarget.id);
        }}
      />
    </div>
  );
}

export default function ProvidersPage() {
  return (
    <Suspense fallback={null}>
      <ProvidersPageContent />
    </Suspense>
  );
}
