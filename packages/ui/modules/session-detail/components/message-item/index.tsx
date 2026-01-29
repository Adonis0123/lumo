"use client";

import { memo, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import { ChevronDown, ChevronUp, TerminalSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { MessageItemProps } from "./types";
import { markdownComponents } from "./markdown-components";
import {
  sanitizeMessageText,
  extractSlashCommand,
  extractStandaloneStdout,
} from "./libs";
import { ToolUses } from "./tool-uses";

const COLLAPSE_THRESHOLD = 1500;

export const MessageItem = memo(function MessageItem({
  message,
}: MessageItemProps) {
  const isUser = message.type === "user";
  const hasToolUses = message.toolUses && message.toolUses.length > 0;

  const parsed = useMemo(() => {
    if (!message.text) return { type: "empty" as const };

    // Check if it's a slash command message
    const cmd = extractSlashCommand(message.text);
    if (cmd) return { type: "command" as const, command: cmd };

    // Check if it's a standalone stdout (follow-up message)
    const stdout = extractStandaloneStdout(message.text);
    if (stdout) return { type: "stdout" as const, stdout };

    // Normal text — sanitize
    const text = sanitizeMessageText(message.text);
    if (!text) return { type: "empty" as const };
    return { type: "text" as const, text };
  }, [message.text]);

  const isLongMessage =
    parsed.type === "text" && parsed.text.length > COLLAPSE_THRESHOLD;
  const [isExpanded, setIsExpanded] = useState(!isLongMessage);

  if (parsed.type === "empty" && !hasToolUses) return null;

  // Slash command → render as compact card
  if (parsed.type === "command") {
    return (
      <div className="flex justify-end px-4 py-2 md:px-6">
        <div className="flex items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs">
          <TerminalSquare className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <code className="font-semibold">
              {parsed.command.name}
              {parsed.command.args ? ` ${parsed.command.args}` : ""}
            </code>
            {parsed.command.stdout && (
              <div className="mt-1 whitespace-pre-wrap break-all text-muted-foreground">
                {parsed.command.stdout}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Standalone stdout (follow-up to a command) → render inline
  if (parsed.type === "stdout") {
    return (
      <div className="flex justify-end px-4 py-1 md:px-6">
        <div className="rounded-lg border bg-muted/40 px-3 py-1.5 text-xs">
          <code className="whitespace-pre-wrap break-all text-muted-foreground">
            {parsed.stdout}
          </code>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "px-4 py-4 md:px-6",
        isUser ? "flex justify-end" : "",
      )}
    >
      <div
        className={cn(
          "max-w-[80%]",
          isUser && "rounded-2xl rounded-tr-sm bg-accent px-3.5 py-2.5",
        )}
      >
        {parsed.type === "text" && (
          <div className="relative">
            {isLongMessage && !isExpanded ? (
              <ScrollArea className="h-[200px]">
                <div className="pr-3 text-sm leading-relaxed break-words">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={markdownComponents}
                  >
                    {parsed.text}
                  </ReactMarkdown>
                </div>
              </ScrollArea>
            ) : (
              <div className="text-sm leading-relaxed break-words">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={markdownComponents}
                >
                  {parsed.text}
                </ReactMarkdown>
              </div>
            )}

            {isLongMessage && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="size-3" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-3" />
                    Expand
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {hasToolUses && <ToolUses toolUses={message.toolUses!} />}
      </div>
    </div>
  );
});
