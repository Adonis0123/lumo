"use client";

import { useQuery } from "@tanstack/react-query";
import { StatsBridge } from "@/src/bridges/stats-bridge";
import type { TimeRange } from "@/src/generated/typeshare-types";
import { computeEfficiency } from "../../libs";
import type { EfficiencyScores } from "../../types";

const DEFAULT_SCORES: EfficiencyScores = {
  cacheRate: 0,
  costPerSession: 0,
  editAcceptRate: 0,
};

export function useService(timeRange: TimeRange) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["summary-stats", timeRange],
    queryFn: () => StatsBridge.getSummaryStats(timeRange),
  });

  const scores = data ? computeEfficiency(data) : DEFAULT_SCORES;

  return { scores, isLoading, error: error as Error | null, refetch };
}
