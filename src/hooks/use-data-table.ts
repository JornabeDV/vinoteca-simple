"use client";

import { useState, useMemo, useCallback } from "react";

export type SortDirection = "asc" | "desc";

export interface SortState {
  key: string;
  direction: SortDirection;
}

export interface UseDataTableOptions<T> {
  data: T[];
  itemsPerPage?: number;
  sortFn?: (a: T, b: T, sort: SortState) => number;
  searchFn?: (item: T, query: string) => boolean;
}

export function useDataTable<T>(options: UseDataTableOptions<T>) {
  const { data, itemsPerPage = 10, sortFn, searchFn } = options;

  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState<SortState | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSort = useCallback(
    (key: string) => {
      setSort((prev) => {
        if (prev?.key === key) {
          if (prev.direction === "asc") {
            return { key, direction: "desc" };
          }
          return null; // tercer click quita el sort
        }
        return { key, direction: "asc" };
      });
      setCurrentPage(1);
    },
    []
  );

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    if (searchQuery && searchFn) {
      result = result.filter((item) => searchFn(item, searchQuery));
    }

    if (sort && sortFn) {
      result = result.sort((a, b) => sortFn(a, b, sort));
    }

    return result;
  }, [data, searchQuery, sort, searchFn, sortFn]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedData.length / itemsPerPage));

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedData.slice(start, start + itemsPerPage);
  }, [filteredAndSortedData, currentPage, itemsPerPage]);

  return {
    data: paginatedData,
    allData: filteredAndSortedData,
    currentPage,
    totalPages,
    totalItems: filteredAndSortedData.length,
    sort,
    searchQuery,
    setCurrentPage,
    handleSort,
    handleSearch,
  };
}
