"use client";

import { useQuery } from "@tanstack/react-query";
import { StatsBridge } from "@/src/bridges/stats-bridge";
import { TimeRange } from "@/src/generated/typeshare-types";
import { computeWeeklyDelta } from "../../libs";
import type { WeekDelta } from "../../types";

export function useService() {
  const currentQuery = useQuery({
    queryKey: ["summary-stats", TimeRange.Week],
    queryFn: () => StatsBridge.getSummaryStats(TimeRange.Week),
  });

  // We use Month stats as a proxy for "previous week" comparison
  // since the backend doesn't support arbitrary date ranges.
  // The month stats include both weeks, so we estimate previous = month - current.
  const monthQuery = useQuery({
    queryKey: ["summary-stats", TimeRange.Month],
    queryFn: () => StatsBridge.getSummaryStats(TimeRange.Month),
  });

  const isLoading = currentQuery.isLoading || monthQuery.isLoading;
  const error = currentQuery.error || monthQuery.error;

  let deltas: WeekDelta[] = [];
  if (currentQuery.data && monthQuery.data) {
    const current = currentQuery.data;
    const month = monthQuery.data;
    // Estimate previous week by subtracting current from month totals
    const previous = {
      ...month,
      totalSessions: Math.max(0, month.totalSessions - current.totalSessions),
      totalCost: Math.max(0, month.totalCost - current.totalCost),
      activeTimeSeconds: Math.max(
        0,
        month.activeTimeSeconds - current.activeTimeSeconds
      ),
    };
    deltas = computeWeeklyDelta(current, previous);
  }

  return {
    deltas,
    isLoading,
    error: error as Error | null,
    refetch: () => {
      currentQuery.refetch();
      monthQuery.refetch();
    },
  };
}
