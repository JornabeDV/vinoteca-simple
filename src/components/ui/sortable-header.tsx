"use client";

import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SortState } from "@/hooks/use-data-table";

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  sort: SortState | null;
  onSort: (key: string) => void;
  className?: string;
}

export function SortableHeader({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: SortableHeaderProps) {
  const isActive = sort?.key === sortKey;

  return (
    <button
      onClick={() => onSort(sortKey)}
      className={cn(
        "inline-flex items-center gap-1.5 hover:text-foreground transition-colors select-none",
        isActive ? "text-foreground font-medium" : "text-muted-foreground",
        className
      )}
    >
      {label}
      {isActive ? (
        sort.direction === "asc" ? (
          <ArrowUp className="h-3.5 w-3.5 text-[#7b1f3a]" />
        ) : (
          <ArrowDown className="h-3.5 w-3.5 text-[#7b1f3a]" />
        )
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
      )}
    </button>
  );
}
