"use client";

import { Suspense, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FileCheck, Clock, CheckCircle, XCircle } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { partnersApi } from "@/lib/api/partners";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { KycStatusBadge, UserStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/SkeletonLoader";
import { Avatar } from "@/components/ui/Avatar";
import { FilterSelect } from "@/components/ui/FilterSelect";
import type { Partner } from "@/types/partner";

const KYC_STATUS_OPTIONS = [
  { label: "Pending",       value: "PENDING" },
  { label: "In Progress",   value: "IN_PROGRESS" },
  { label: "Approved",      value: "APPROVED" },
  { label: "Rejected",      value: "REJECTED" },
  { label: "Not Submitted", value: "NOT_SUBMITTED" },
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

function KycPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── URL-driven filter state (survives back-navigation) ───────────────────
  // kycStatus defaults to "PENDING" when the URL carries no status param,
  // preserving the previous default view.
  const page       = Number(searchParams.get("page") ?? "1");
  const search     = searchParams.get("search") ?? "";
  const kycStatus  = searchParams.get("status") ?? "PENDING";
  const datePreset = searchParams.get("datePreset") ?? "";

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

  const { data, isLoading } = useQuery({
    queryKey: ["kyc-partners", { page, search, kycStatus, datePreset }],
    queryFn: () =>
      partnersApi.getAll({
        page,
        limit: 20,
        kycStatus: kycStatus || undefined,
        ...(search && { search }),
        ...getDateRange(datePreset),
      }),
  });

  const handleSearch = useCallback((val: string) => {
    if (val === (searchParamsRef.current.get("search") ?? "")) return;
    updateParams({ search: val, page: "1" });
  }, [updateParams]);

  const partners: Partner[] = data?.items ?? [];
  const pagination = data?.pagination;

  const pendingCount  = partners.filter((p) => p.kycRecord?.status === "PENDING").length;
  const approvedCount = partners.filter((p) => p.kycRecord?.status === "APPROVED").length;
  const rejectedCount = partners.filter((p) => p.kycRecord?.status === "REJECTED").length;

  return (
    <div className="space-y-6">

      {/* ── Stat Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Queue"
          value={(pagination?.total ?? 0).toLocaleString("en-IN")}
          icon={FileCheck}
          onClick={() => updateParams({ status: "", page: "1" })}
        />
        <StatCard
          label="Pending"
          value={pendingCount}
          icon={Clock}
          iconColor={pendingCount > 5 ? "text-brand-orange" : "text-brand-purple"}
          iconBg={pendingCount > 5 ? "bg-orange-50 dark:bg-orange-950/30" : "bg-brand-purple-muted dark:bg-brand-purple-muted-dark"}
          onClick={() => updateParams({ status: "PENDING", page: "1" })}
        />
        <StatCard
          label="Approved"
          value={approvedCount}
          icon={CheckCircle}
          iconColor="text-brand-green"
          iconBg="bg-green-50 dark:bg-green-950/30"
          onClick={() => updateParams({ status: "APPROVED", page: "1" })}
        />
        <StatCard
          label="Rejected"
          value={rejectedCount}
          icon={XCircle}
          iconColor="text-brand-red"
          iconBg="bg-red-50 dark:bg-red-950/30"
          onClick={() => updateParams({ status: "REJECTED", page: "1" })}
        />
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Search by name, mobile, aadhaar..."
          className="w-full sm:w-72"
        />
        <FilterSelect
          value={kycStatus}
          onChange={(v) => updateParams({ status: v, page: "1" })}
          options={KYC_STATUS_OPTIONS}
          placeholder="All KYC Statuses"
          className="w-44"
        />
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
      ) : partners.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FileCheck}
            title="No KYC submissions"
            description={kycStatus === "PENDING" ? "All KYC submissions have been reviewed" : "No partners match the selected filter"}
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
                  <th>KYC Status</th>
                  <th>Account Status</th>
                  <th>Cab No</th>
                  <th>City</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((partner) => (
                  <tr
                    key={partner.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/partners/${partner.id}`)}
                  >
                    {/* Partner */}
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={partner.name} size="sm" />
                        <div>
                          <p className="font-medium text-light-text dark:text-dark-text text-sm">
                            {partner.name}
                          </p>
                          <p className="text-xs text-light-text-3 dark:text-dark-text-3">
                            {partner.partnerProfile?.email ?? partner.mobile}
                          </p>
                          {partner.displayId && (
                            <p className="text-[10px] text-light-text-3 dark:text-dark-text-3 font-mono">
                              {partner.displayId}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td>
                      <span className="text-sm text-light-text-2 dark:text-dark-text-2">
                        {partner.partnerProfile?.subType === "VENDOR" ? "Vendor" : "Vehicle Owner"}
                      </span>
                    </td>

                    {/* KYC Status */}
                    <td>
                      {partner.kycRecord ? (
                        <KycStatusBadge status={partner.kycRecord.status} />
                      ) : (
                        <span className="text-xs text-light-text-3 dark:text-dark-text-3">—</span>
                      )}
                    </td>

                    {/* Account Status */}
                    <td>
                      <UserStatusBadge status={partner.status} />
                    </td>

                    {/* Cab No */}
                    <td>
                      <span className="text-sm font-mono text-light-text-2 dark:text-dark-text-2">
                        {partner.kycRecord?.vehicleNumber ?? "—"}
                      </span>
                    </td>

                    {/* City */}
                    <td>
                      <span className="text-sm text-light-text-2 dark:text-dark-text-2">
                        {partner.kycRecord?.city ?? partner.partnerProfile?.city ?? "—"}
                      </span>
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
    </div>
  );
}

export default function KycPage() {
  return (
    <Suspense fallback={null}>
      <KycPageContent />
    </Suspense>
  );
}
