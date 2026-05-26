"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FileCheck } from "lucide-react";
import { partnersApi } from "@/lib/api/partners";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { KycStatusBadge, UserStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/SkeletonLoader";
import { Avatar } from "@/components/ui/Avatar";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { formatDate } from "@/lib/utils";
import type { Partner } from "@/types/partner";

const KYC_STATUS_OPTIONS = [
  { label: "Pending",       value: "PENDING" },
  { label: "In Progress",   value: "IN_PROGRESS" },
  { label: "Approved",      value: "APPROVED" },
  { label: "Rejected",      value: "REJECTED" },
  { label: "Not Submitted", value: "NOT_SUBMITTED" },
];

export default function KycPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [kycStatus, setKycStatus] = useState("PENDING");

  const { data, isLoading } = useQuery({
    queryKey: ["kyc-partners", { page, search, kycStatus }],
    queryFn: () =>
      partnersApi.getAll({
        page,
        limit: 20,
        kycStatus: kycStatus || undefined,
        ...(search && { search }),
      }),
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
          placeholder="Search by name, email..."
          className="w-full sm:w-72"
        />
        <FilterSelect
          value={kycStatus}
          onChange={(v) => { setKycStatus(v); setPage(1); }}
          options={KYC_STATUS_OPTIONS}
          placeholder="All KYC Statuses"
          className="w-44"
        />
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} cols={5} />
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
                  <th>Submitted</th>
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
                        <Avatar src={partner.profilePicture} name={partner.name} size="sm" />
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
                        {partner.subType === "BUSINESS" ? "Business" : "Individual"}
                      </span>
                    </td>
                    <td>
                      {partner.kyc ? (
                        <KycStatusBadge status={partner.kyc.status} />
                      ) : (
                        <span className="text-xs text-light-text-3 dark:text-dark-text-3">—</span>
                      )}
                    </td>
                    <td>
                      <UserStatusBadge status={partner.status} />
                    </td>
                    <td>
                      <span className="text-sm text-light-text-2 dark:text-dark-text-2">
                        {partner.kyc?.submittedAt ? formatDate(partner.kyc.submittedAt) : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}
        </div>
      )}
    </div>
  );
}
