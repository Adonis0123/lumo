"use client";

import { useQuery } from "@tanstack/react-query";
import { AnalyticsBridge } from "@/src/bridges/analytics-bridge";

export function useService() {
  const { data, isLoading, error, refetch } = useQuery({
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
