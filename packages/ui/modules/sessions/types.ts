import type {
  ClaudeSession,
  ClaudeSessionDetail,
  ClaudeMessage,
} from "@/src/generated/typeshare-types";

export type { ClaudeSession, ClaudeSessionDetail, ClaudeMessage };

export interface SessionsModuleProps {
  // Module props if needed
}

export interface UseServiceReturn {
  sessions: ClaudeSession[];
  selectedSession: ClaudeSessionDetail | null;
  isLoading: boolean;
  isLoadingDetail: boolean;
  error: Error | null;
  refetch: () => void;
  selectSession: (session: ClaudeSession | null) => void;
}
