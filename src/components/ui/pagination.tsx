"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    if (start > 2) pages.push("...");

    for (let i = start; i <= end; i++) pages.push(i);

    if (end < totalPages - 1) pages.push("...");

    pages.push(totalPages);
    return pages;
  };

  const pages = getVisiblePages();

  return (
    <div className={cn("flex items-center justify-center gap-1.5", className)}>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {pages.map((page, i) =>
        typeof page === "string" ? (
          <span key={`dots-${i}`} className="px-2 text-sm text-muted-foreground">
            {page}
          </span>
        ) : (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            className={cn(
              "min-w-[32px] px-2.5 text-sm",
              currentPage === page && "bg-[#7b1f3a] hover:bg-[#5a1530] text-white"
            )}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
