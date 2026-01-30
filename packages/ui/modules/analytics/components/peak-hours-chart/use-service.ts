"use client";

import { useQuery } from "@tanstack/react-query";
import { AnalyticsBridge } from "@/src/bridges/analytics-bridge";
import type { TimeRange } from "@/src/generated/typeshare-types";

export function useService(timeRange: TimeRange) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["hourly-activity", timeRange],
    queryFn: () => AnalyticsBridge.getHourlyActivity(timeRange),
  });

  const peakHour = data?.reduce(
    (max, h) => (h.count > max.count ? h : max),
    { hour: 0, count: 0 },
  );

  return {
    data: data ?? [],
    peakHour: peakHour?.hour ?? 0,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
