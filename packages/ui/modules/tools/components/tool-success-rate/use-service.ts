"use client";

import { useQuery } from "@tanstack/react-query";
import { ToolsBridge } from "@/src/bridges/tools-bridge";
import type { TimeRange } from "@/src/generated/typeshare-types";

export function useService(timeRange: TimeRange) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["tool-usage-stats", timeRange],
    queryFn: () => ToolsBridge.getToolUsageStats(timeRange),
  });

  return {
    data: (data ?? []).filter((d) => d.count > 0).slice(0, 10),
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
