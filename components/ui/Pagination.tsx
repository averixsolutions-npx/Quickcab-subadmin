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
  const to   = Math.min(page * limit, total);

  if (totalPages <= 1) return null;

  // Build the list of page numbers to show, with null meaning "..."
  function getPageNumbers(): (number | null)[] {
    const delta = 2;
    const pages: (number | null)[] = [];
    const left  = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);

    pages.push(1);
    if (left > 2)            pages.push(null);
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push(null);
    if (totalPages > 1)      pages.push(totalPages);

    return pages;
  }

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-light-border dark:border-dark-border">
      {/* Range label */}
      <p className="text-xs text-light-text-3 dark:text-dark-text-3">
        {from}–{to} of {total}
      </p>

      {/* Page controls */}
      <div className="flex items-center gap-1">
        {/* Prev */}
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

        {/* Page numbers */}
        {pageNumbers.map((p, idx) =>
          p === null ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-1 text-xs text-light-text-3 dark:text-dark-text-3"
            >
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                "min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-medium transition-colors",
                p === page
                  ? "bg-brand-purple text-white"
                  : "text-light-text-2 dark:text-dark-text-2 hover:bg-light-surface-2 dark:hover:bg-dark-surface"
              )}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
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
