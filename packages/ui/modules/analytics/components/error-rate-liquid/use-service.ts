"use client";

import { useQuery } from "@tanstack/react-query";
import { AnalyticsBridge } from "@/src/bridges/analytics-bridge";
import type { TimeRange } from "@/src/generated/typeshare-types";

export function useService(timeRange: TimeRange) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["error-rate", timeRange],
    queryFn: () => AnalyticsBridge.getErrorRate(timeRange),
  });

  return {
    errorRate: data?.errorRate ?? 0,
    totalErrors: data?.totalErrors ?? 0,
    totalRequests: data?.totalRequests ?? 0,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
