"use client";

import { useQuery } from "@tanstack/react-query";
import { ToolsBridge } from "@/src/bridges/tools-bridge";
import type { TimeRange } from "@/src/generated/typeshare-types";

export function useService(timeRange: TimeRange) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["code-edit-by-language", timeRange],
    queryFn: () => ToolsBridge.getCodeEditByLanguage(timeRange),
  });

  const totalAccepts = (data ?? []).reduce((s, d) => s + d.accepts, 0);
  const totalRejects = (data ?? []).reduce((s, d) => s + d.rejects, 0);

  return {
    data: data ?? [],
    totalAccepts,
    totalRejects,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
