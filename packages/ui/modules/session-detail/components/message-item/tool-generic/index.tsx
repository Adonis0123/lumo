import {
  Terminal,
  FileSearch,
  FolderSearch,
  Search,
  FileText,
  Globe,
  MessageSquare,
  Wrench,
} from "lucide-react";
import type { ClaudeToolUse } from "../../../types";
import { formatToolInput } from "../libs";

const TOOL_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Bash: Terminal,
  Read: FileText,
  Grep: FileSearch,
  Glob: FolderSearch,
  WebSearch: Globe,
  WebFetch: Globe,
  Search: Search,
  AskUserQuestion: MessageSquare,
};

interface ToolGenericProps {
  tool: ClaudeToolUse;
}

export function ToolGeneric({ tool }: ToolGenericProps) {
  const Icon = TOOL_ICONS[tool.name] ?? Wrench;
  const summary = tool.input ? formatToolInput(tool.input) : null;

  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-1.5 text-xs">
      <div className="flex items-center gap-2">
        <Icon className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="shrink-0 font-medium">{tool.name}</span>
      </div>
      {summary && (
        <code className="mt-1 block whitespace-pre-wrap break-all text-muted-foreground">
          {summary}
        </code>
      )}
    </div>
  );
}
