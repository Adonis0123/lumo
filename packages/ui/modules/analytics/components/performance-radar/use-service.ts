"use client";

import { useQuery } from "@tanstack/react-query";
import { StatsBridge } from "@/src/bridges/stats-bridge";
import { AnalyticsBridge } from "@/src/bridges/analytics-bridge";
import type { TimeRange } from "@/src/generated/typeshare-types";

export function useService(timeRange: TimeRange) {
  const summaryQuery = useQuery({
    queryKey: ["summary-stats", timeRange],
    queryFn: () => StatsBridge.getSummaryStats(timeRange),
  });

  const errorQuery = useQuery({
    queryKey: ["error-rate", timeRange],
    queryFn: () => AnalyticsBridge.getErrorRate(timeRange),
  });

  const stats = summaryQuery.data;
  const errorData = errorQuery.data;

  const costPerSession =
    stats && stats.totalSessions > 0
      ? stats.totalCost / stats.totalSessions
      : 0;

  const dimensions = stats
    ? [
        Math.max(0, 100 - (costPerSession / 0.5) * 100),
        stats.cachePercentage,
        (1 - (errorData?.errorRate ?? 0)) * 100,
        Math.min((stats.todaySessions / 10) * 100, 100),
        Math.min(
          ((stats.linesOfCodeAdded + stats.commits) / 500) * 100,
          100,
        ),
      ]
    : [0, 0, 0, 0, 0];

  return {
    dimensions,
    isLoading: summaryQuery.isLoading || errorQuery.isLoading,
    error: (summaryQuery.error ?? errorQuery.error) as Error | null,
    refetch: () => {
      summaryQuery.refetch();
      errorQuery.refetch();
    },
  };
}
