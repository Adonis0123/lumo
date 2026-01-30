"use client";

import { useQuery } from "@tanstack/react-query";
import { StatsBridge } from "@/src/bridges/stats-bridge";
import type { TimeRange } from "@/src/generated/typeshare-types";

export function useService(timeRange: TimeRange) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["summary-stats", timeRange],
    queryFn: () => StatsBridge.getSummaryStats(timeRange),
  });

  const cachePercentage = data?.cachePercentage ?? 0;

  return {
    cachePercentage,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
