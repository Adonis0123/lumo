"use client";

import { useQuery } from "@tanstack/react-query";
import { StatsBridge } from "@/src/bridges/stats-bridge";
import type { TimeRange } from "@/src/generated/typeshare-types";
import { foregroundRefreshQueryOptions } from "@/src/lib/query-options";

export function useService(timeRange: TimeRange) {
  const { data, isLoading, error, refetch } = useQuery({
    ...foregroundRefreshQueryOptions,
    queryKey: ["token-stats", timeRange],
    queryFn: () => StatsBridge.getTokenStats(timeRange),
  });

  return {
    data: data ?? [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
