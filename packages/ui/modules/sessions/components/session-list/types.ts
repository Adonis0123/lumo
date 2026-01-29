import type { ClaudeSession } from "../../types";

export interface SessionListProps {
  sessions: ClaudeSession[];
  onSelectSession: (session: ClaudeSession) => void;
}

export interface SessionListItemProps {
  session: ClaudeSession;
  onSelect: () => void;
}
