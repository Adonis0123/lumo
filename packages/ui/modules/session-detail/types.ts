import type {
  ClaudeSession,
  ClaudeSessionDetail,
  ClaudeMessage,
  ClaudeToolUse,
} from "@/src/generated/typeshare-types";

export type { ClaudeSession, ClaudeSessionDetail, ClaudeMessage, ClaudeToolUse };

export interface SessionDetailModuleProps {
  sessionPath: string;
}

export interface UseServiceReturn {
  sessionDetail: ClaudeSessionDetail | null;
  isLoading: boolean;
  error: Error | null;
}
