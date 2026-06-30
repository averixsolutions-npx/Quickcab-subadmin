"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Users, FileCheck, BookOpen,
  ShieldOff, ShieldBan, Wallet,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { useAuthStore } from "@/stores/authStore";
import apiClient from "@/lib/api/client";

interface DashboardStats {
  partners: {
    total: number;
    active: number;
    pendingKyc: number;
    suspended: number;
    blocked: number;
  };
  bookings: {
    total: number;
    open: number;
    today: number;
  };
  wallet: {
    pendingWithdrawals: number;
    pendingWithdrawalAmount: number;
  };
}

async function fetchStats(): Promise<DashboardStats> {
  const res = await apiClient.get("/admin/dashboard/stats");
  return res.data.data;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { admin } = useAuthStore();

  const { data: stats, isLoading, isError, refetch } = useQuery({
    queryKey: ["subadmin-dashboard-stats"],
    queryFn: fetchStats,
    refetchInterval: 60_000,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-light-text dark:text-dark-text">
            Dashboard
          </h1>
          <p className="text-sm text-light-text-2 dark:text-dark-text-2 mt-0.5">
            {getGreeting()}{admin?.name ? `, ${admin.name}` : ""} — here&apos;s what&apos;s happening
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium text-light-text-2 dark:text-dark-text-2 hover:bg-light-surface-2 dark:hover:bg-dark-surface transition-colors border border-light-border dark:border-dark-border"
        >
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="card h-24 animate-pulse bg-light-surface-2 dark:bg-dark-surface-2"
            />
          ))}
        </div>
      ) : isError || !stats ? (
        <div className="card text-center py-12">
          <p className="text-sm text-light-text-2 dark:text-dark-text-2">
            Failed to load stats.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-3 text-sm text-brand-purple hover:underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Total Partners"
            value={stats.partners.total.toLocaleString("en-IN")}
            icon={Users}
            trend={`${stats.partners.active} active`}
            trendUp
          />
          <StatCard
            label="Pending KYC"
            value={stats.partners.pendingKyc}
            icon={FileCheck}
            iconColor={
              stats.partners.pendingKyc > 5
                ? "text-brand-orange"
                : "text-brand-purple"
            }
            iconBg={
              stats.partners.pendingKyc > 5
                ? "bg-orange-50 dark:bg-orange-950/30"
                : "bg-brand-purple-muted dark:bg-brand-purple-muted-dark"
            }
            trend={
              stats.partners.pendingKyc > 0
                ? "Needs review"
                : "All clear"
            }
            trendUp={stats.partners.pendingKyc === 0}
          />
          <StatCard
            label="Open Bookings"
            value={stats.bookings.open.toLocaleString("en-IN")}
            icon={BookOpen}
            iconColor="text-brand-green"
            iconBg="bg-green-50 dark:bg-green-950/30"
            trend={`${stats.bookings.today} posted today`}
            trendUp
          />
          <StatCard
            label="Suspended Partners"
            value={stats.partners.suspended}
            icon={ShieldOff}
            iconColor="text-brand-orange"
            iconBg="bg-orange-50 dark:bg-orange-950/30"
            trend={stats.partners.suspended > 0 ? "Under review" : "None"}
            trendUp={stats.partners.suspended === 0}
          />
          <StatCard
            label="Blocked Partners"
            value={stats.partners.blocked}
            icon={ShieldBan}
            iconColor="text-brand-red"
            iconBg="bg-red-50 dark:bg-red-950/30"
            trend={stats.partners.blocked > 0 ? "Permanently blocked" : "None"}
            trendUp={stats.partners.blocked === 0}
          />
          <StatCard
            label="Pending Payouts"
            value={`₹${(stats.wallet.pendingWithdrawalAmount ?? 0).toLocaleString("en-IN")}`}
            icon={Wallet}
            iconColor="text-brand-purple"
            trend={`${stats.wallet.pendingWithdrawals} requests pending`}
            trendUp={stats.wallet.pendingWithdrawals === 0}
          />
        </div>
      )}
    </div>
  );
}
