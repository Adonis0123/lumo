"use client";

import { useQuery } from "@tanstack/react-query";
import { StatsBridge } from "@/src/bridges/stats-bridge";
import type { TimeRange } from "@/src/generated/typeshare-types";
import { computeCostInsights } from "../../libs";
import type { CostInsight } from "../../types";

export function useService(timeRange: TimeRange) {
  const statsQuery = useQuery({
    queryKey: ["summary-stats", timeRange],
    queryFn: () => StatsBridge.getSummaryStats(timeRange),
  });

  const modelsQuery = useQuery({
    queryKey: ["model-stats", timeRange],
    queryFn: () => StatsBridge.getModelStats(timeRange),
  });

  const isLoading = statsQuery.isLoading || modelsQuery.isLoading;
  const error = statsQuery.error || modelsQuery.error;

  const insights: CostInsight[] =
    statsQuery.data && modelsQuery.data
      ? computeCostInsights(statsQuery.data, modelsQuery.data)
      : [];

  return {
    insights,
    isLoading,
    error: error as Error | null,
    refetch: () => {
      statsQuery.refetch();
      modelsQuery.refetch();
    },
  };
}
