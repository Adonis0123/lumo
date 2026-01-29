import type { ClaudeSession } from "../../types";

export interface SessionHeaderProps {
  session: ClaudeSession;
  messageCount: number;
  onBack: () => void;
}
