"use client";

import { useQuery } from "@tanstack/react-query";
import { SessionBridge } from "@/src/bridges/session-bridge";
import { computeHourlyDistribution, findPeakHour } from "../../libs";

export function useService() {
  const { data: sessions = [], isLoading, error, refetch } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => SessionBridge.getSessions(),
  });

  const hourlyData = computeHourlyDistribution(sessions);
  const peakHour = findPeakHour(hourlyData);
  const avgDurationMin =
    sessions.length > 0
      ? sessions.reduce((s, x) => s + x.durationMs, 0) / sessions.length / 60000
      : 0;

  return {
    hourlyData,
    peakHour,
    avgDurationMin,
    totalSessions: sessions.length,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
