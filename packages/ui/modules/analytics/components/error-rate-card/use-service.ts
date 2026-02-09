"use client";

import { useQuery } from "@tanstack/react-query";
import { AnalyticsBridge } from "@/src/bridges/analytics-bridge";
import type { ErrorRateStats, TimeRange } from "@/src/generated/typeshare-types";
import { foregroundRefreshQueryOptions } from "@/src/lib/query-options";

const EMPTY: ErrorRateStats = {
  totalRequests: 0,
  totalErrors: 0,
  errorRate: 0,
};

export function useService(timeRange: TimeRange) {
  const { data, isLoading, error, refetch } = useQuery({
    ...foregroundRefreshQueryOptions,
    queryKey: ["error-rate", timeRange],
    queryFn: () => AnalyticsBridge.getErrorRate(timeRange),
  });

  return {
    data: data ?? EMPTY,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
