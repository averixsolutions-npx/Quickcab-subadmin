import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: string;
  trendUp?: boolean;
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = "text-brand-purple",
  iconBg = "bg-brand-purple-muted dark:bg-brand-purple-muted-dark",
  trend,
  trendUp,
  className,
  onClick,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "card flex items-start gap-4 transition-all duration-150",
        onClick && "cursor-pointer hover:ring-2 hover:ring-brand-purple/30 hover:shadow-md",
        className
      )}
      onClick={onClick}
    >
      {Icon && (
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
          <Icon size={18} className={iconColor} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-light-text-3 dark:text-dark-text-3 font-medium uppercase tracking-wide mb-1">
          {label}
        </p>
        <p className="text-2xl font-bold text-light-text dark:text-dark-text leading-tight">
          {value}
        </p>
        {trend && (
          <p className={cn(
            "text-xs mt-1",
            trendUp === true  ? "text-brand-green" :
            trendUp === false ? "text-brand-red" :
            "text-light-text-3 dark:text-dark-text-3"
          )}>
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}
