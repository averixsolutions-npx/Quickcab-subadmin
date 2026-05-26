"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaginationMeta } from "@/types/api";

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, totalPages, total, limit } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-light-border dark:border-dark-border">
      <p className="text-xs text-light-text-3 dark:text-dark-text-3">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!pagination.hasPrevPage}
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            pagination.hasPrevPage
              ? "text-light-text-2 dark:text-dark-text-2 hover:bg-light-surface-2 dark:hover:bg-dark-surface"
              : "text-light-text-3 dark:text-dark-text-3 cursor-not-allowed opacity-50"
          )}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="px-3 text-sm font-medium text-light-text dark:text-dark-text">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!pagination.hasNextPage}
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            pagination.hasNextPage
              ? "text-light-text-2 dark:text-dark-text-2 hover:bg-light-surface-2 dark:hover:bg-dark-surface"
              : "text-light-text-3 dark:text-dark-text-3 cursor-not-allowed opacity-50"
          )}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
