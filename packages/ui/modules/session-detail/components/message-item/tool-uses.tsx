"use client";

import type { ClaudeToolUse } from "../../types";
import { ToolAskQuestion } from "./tool-ask-question";
import { ToolEditWrite } from "./tool-edit-write";
import { ToolGeneric } from "./tool-generic";
import { ToolTask } from "./tool-task";

interface ToolUsesProps {
  toolUses: ClaudeToolUse[];
}

const TASK_TOOLS = new Set([
  "Task",
  "TaskCreate",
  "TaskUpdate",
  "TaskList",
  "TaskGet",
  "TaskOutput",
  "TaskStop",
  "EnterPlanMode",
  "ExitPlanMode",
  "Skill",
]);

export function ToolUses({ toolUses }: ToolUsesProps) {
  return (
    <div className="space-y-2">
      {toolUses.map((tool) => (
        <ToolUseItem key={tool.id} tool={tool} />
      ))}
    </div>
  );
}

function ToolUseItem({ tool }: { tool: ClaudeToolUse }) {
  if (tool.name === "AskUserQuestion" && tool.input) {
    return <ToolAskQuestion input={tool.input} />;
  }

  if ((tool.name === "Edit" || tool.name === "Write") && tool.input) {
    return <ToolEditWrite tool={tool} />;
  }

  if (TASK_TOOLS.has(tool.name)) {
    return <ToolTask name={tool.name} input={tool.input ?? "{}"} />;
  }

  return <ToolGeneric tool={tool} />;
}
