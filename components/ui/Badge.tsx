import { cn } from "@/lib/utils";
import type { UserStatus, KycStatus } from "@/types/partner";
import type { BookingStatus } from "@/types/booking";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral" | "purple";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-green-100 text-green-700 dark:bg-brand-green-muted dark:text-brand-green",
  warning: "bg-orange-100 text-orange-700 dark:bg-brand-orange-muted dark:text-brand-orange",
  danger:  "bg-red-100 text-brand-red dark:bg-brand-red-muted dark:text-brand-red",
  info:    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  neutral: "bg-light-surface-2 text-light-text-2 dark:bg-dark-surface dark:text-dark-text-2",
  purple:  "bg-brand-purple-muted text-brand-purple dark:bg-brand-purple-muted-dark dark:text-brand-purple-light",
};

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  return (
    <span className={cn("badge", variantClasses[variant], className)}>
      {children}
    </span>
  );
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const map: Record<UserStatus, { label: string; variant: BadgeVariant }> = {
    ONBOARDING:       { label: "Onboarding",       variant: "info" },
    PROFILE_COMPLETE: { label: "Profile Complete",  variant: "info" },
    KYC_PENDING:      { label: "KYC Pending",       variant: "warning" },
    ACTIVE:           { label: "Active",            variant: "success" },
    SUSPENDED:        { label: "Suspended",         variant: "warning" },
    BLOCKED:          { label: "Blocked",           variant: "danger" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "neutral" };
  return <Badge variant={variant}>{label}</Badge>;
}

export function KycStatusBadge({ status }: { status: KycStatus }) {
  const map: Record<KycStatus, { label: string; variant: BadgeVariant }> = {
    NOT_SUBMITTED: { label: "Not Submitted", variant: "neutral" },
    IN_PROGRESS:   { label: "In Progress",   variant: "info" },
    PENDING:       { label: "Pending",       variant: "warning" },
    APPROVED:      { label: "Approved",      variant: "success" },
    REJECTED:      { label: "Rejected",      variant: "danger" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "neutral" };
  return <Badge variant={variant}>{label}</Badge>;
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const map: Record<BookingStatus, { label: string; variant: BadgeVariant }> = {
    PENDING:         { label: "Pending",          variant: "warning" },
    ACCEPTED:        { label: "Accepted",         variant: "info" },
    DRIVER_ASSIGNED: { label: "Driver Assigned",  variant: "info" },
    PICKUP_REACHED:  { label: "Pickup Reached",   variant: "purple" },
    TRIP_STARTED:    { label: "In Progress",      variant: "purple" },
    COMPLETED:       { label: "Completed",        variant: "success" },
    CANCELLED:       { label: "Cancelled",        variant: "danger" },
    NO_DRIVER:       { label: "No Driver",        variant: "neutral" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "neutral" };
  return <Badge variant={variant}>{label}</Badge>;
}
