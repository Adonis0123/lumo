"use client";

import { useQuery } from "@tanstack/react-query";
import { AnalyticsBridge } from "@/src/bridges/analytics-bridge";
import type { TimeRange } from "@/src/generated/typeshare-types";
import { foregroundRefreshQueryOptions } from "@/src/lib/query-options";

export function useService(timeRange: TimeRange) {
  const { data, isLoading, error, refetch } = useQuery({
    ...foregroundRefreshQueryOptions,
    queryKey: ["cache-hit-trend", timeRange],
    queryFn: () => AnalyticsBridge.getCacheHitTrend(timeRange),
  });

  return {
    data: data ?? [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
