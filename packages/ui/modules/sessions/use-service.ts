"use client";

import { useQuery } from "@tanstack/react-query";
import { ClaudeSessionBridge } from "@/src/bridges/claude-session-bridge";

export function useService() {
  const sessionsQuery = useQuery({
    queryKey: ["claude-sessions"],
    queryFn: () => ClaudeSessionBridge.getAllSessions(),
  });

  return {
    sessions: sessionsQuery.data ?? [],
    isLoading: sessionsQuery.isLoading,
    error: sessionsQuery.error as Error | null,
    refetch: sessionsQuery.refetch,
  };
}
