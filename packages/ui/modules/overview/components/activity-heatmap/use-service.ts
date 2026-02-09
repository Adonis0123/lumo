"use client";

import { useQuery } from "@tanstack/react-query";
import { AnalyticsBridge } from "@/src/bridges/analytics-bridge";
import { foregroundRefreshQueryOptions } from "@/src/lib/query-options";

export function useService() {
  const { data, isLoading, error, refetch } = useQuery({
    ...foregroundRefreshQueryOptions,
    queryKey: ["activity-heatmap"],
    queryFn: () => AnalyticsBridge.getActivityHeatmap(),
  });

  return {
    data: data ?? [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
