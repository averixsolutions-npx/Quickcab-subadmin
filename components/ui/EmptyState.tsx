import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-light-surface-2 dark:bg-dark-surface flex items-center justify-center mb-4">
          <Icon size={24} className="text-light-text-3 dark:text-dark-text-3" />
        </div>
      )}
      <p className="text-sm font-medium text-light-text dark:text-dark-text mb-1">{title}</p>
      {description && (
        <p className="text-sm text-light-text-3 dark:text-dark-text-3 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
