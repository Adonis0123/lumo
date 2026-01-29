"use client";

import { useQuery } from "@tanstack/react-query";
import { ClaudeSessionBridge } from "@/src/bridges/claude-session-bridge";

export function useService(sessionPath: string) {
  const detailQuery = useQuery({
    queryKey: ["claude-session-detail", sessionPath],
    queryFn: () => ClaudeSessionBridge.getSessionDetail(sessionPath),
    enabled: !!sessionPath,
  });

  return {
    sessionDetail: detailQuery.data ?? null,
    isLoading: detailQuery.isLoading,
    error: detailQuery.error as Error | null,
  };
}
