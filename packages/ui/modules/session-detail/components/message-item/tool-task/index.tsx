import {
  Bot,
  ListChecks,
  CircleCheck,
  CircleDot,
  PlayCircle,
  SquareCheck,
  Trash2,
  Map,
  LogOut,
  LogIn,
  Zap,
  Eye,
  StopCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ToolTaskProps {
  name: string;
  input: string;
}

export function ToolTask({ name, input }: ToolTaskProps) {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(input);
  } catch {
    parsed = {};
  }

  switch (name) {
    case "Task":
      return <TaskAgent parsed={parsed} />;
    case "TaskCreate":
      return <TaskCreate parsed={parsed} />;
    case "TaskUpdate":
      return <TaskUpdate parsed={parsed} />;
    case "TaskList":
      return <SimpleToolRow icon={ListChecks} label="TaskList" />;
    case "TaskGet":
      return (
        <SimpleToolRow icon={Eye} label="TaskGet">
          {parsed.taskId != null && (
            <Badge variant="outline" className="font-mono text-[10px]">
              #{String(parsed.taskId)}
            </Badge>
          )}
        </SimpleToolRow>
      );
    case "TaskOutput":
      return (
        <SimpleToolRow icon={Eye} label="TaskOutput">
          {parsed.task_id != null && (
            <Badge variant="outline" className="font-mono text-[10px]">
              #{String(parsed.task_id)}
            </Badge>
          )}
        </SimpleToolRow>
      );
    case "TaskStop":
      return (
        <SimpleToolRow icon={StopCircle} label="TaskStop">
          {parsed.task_id != null && (
            <Badge variant="outline" className="font-mono text-[10px]">
              #{String(parsed.task_id)}
            </Badge>
          )}
        </SimpleToolRow>
      );
    case "EnterPlanMode":
      return <SimpleToolRow icon={LogIn} label="EnterPlanMode" />;
    case "ExitPlanMode":
      return <ExitPlanMode parsed={parsed} />;
    case "Skill":
      return <SkillTool parsed={parsed} />;
    default:
      return null;
  }
}

// --- Task (subagent) ---

function TaskAgent({ parsed }: { parsed: Record<string, unknown> }) {
  const description = parsed.description as string | undefined;
  const subagentType = parsed.subagent_type as string | undefined;
  const prompt = parsed.prompt as string | undefined;

  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs">
      <div className="flex items-center gap-2">
        <Bot className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="font-medium">Task</span>
        {subagentType && (
          <Badge variant="outline" className="font-mono text-[10px]">
            {subagentType}
          </Badge>
        )}
        {description && (
          <span className="text-muted-foreground">{description}</span>
        )}
      </div>
      {prompt && (
        <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap pl-5.5 text-muted-foreground">
          {prompt}
        </p>
      )}
    </div>
  );
}

// --- TaskCreate ---

function TaskCreate({ parsed }: { parsed: Record<string, unknown> }) {
  const subject = parsed.subject as string | undefined;
  const description = parsed.description as string | undefined;

  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs">
      <div className="flex items-center gap-2">
        <ListChecks className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="font-medium">TaskCreate</span>
      </div>
      {subject && <p className="mt-1 pl-5.5 font-medium">{subject}</p>}
      {description && (
        <p className="mt-0.5 line-clamp-2 pl-5.5 text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

// --- TaskUpdate ---

const STATUS_CONFIG: Record<
  string,
  { icon: React.FC<{ className?: string }>; label: string }
> = {
  in_progress: { icon: PlayCircle, label: "In Progress" },
  completed: { icon: CircleCheck, label: "Completed" },
  deleted: { icon: Trash2, label: "Deleted" },
  pending: { icon: CircleDot, label: "Pending" },
};

function TaskUpdate({ parsed }: { parsed: Record<string, unknown> }) {
  const taskId = parsed.taskId as string | undefined;
  const status = parsed.status as string | undefined;
  const subject = parsed.subject as string | undefined;
  const config = status ? STATUS_CONFIG[status] : undefined;
  const StatusIcon = config?.icon ?? SquareCheck;

  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs">
      <div className="flex items-center gap-2">
        <StatusIcon className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="font-medium">TaskUpdate</span>
        {taskId && (
          <Badge variant="outline" className="font-mono text-[10px]">
            #{taskId}
          </Badge>
        )}
        {config && (
          <span className="text-muted-foreground">{config.label}</span>
        )}
      </div>
      {subject && (
        <p className="mt-1 pl-5.5 text-muted-foreground">{subject}</p>
      )}
    </div>
  );
}

// --- ExitPlanMode ---

function ExitPlanMode({ parsed }: { parsed: Record<string, unknown> }) {
  const allowedPrompts = parsed.allowedPrompts as
    | { tool?: string; prompt?: string }[]
    | undefined;

  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs">
      <div className="flex items-center gap-2">
        <Map className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="font-medium">ExitPlanMode</span>
      </div>
      {allowedPrompts && allowedPrompts.length > 0 && (
        <div className="mt-1.5 space-y-1 pl-5.5">
          {allowedPrompts.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              {p.tool && (
                <Badge variant="outline" className="font-mono text-[10px]">
                  {p.tool}
                </Badge>
              )}
              {p.prompt && (
                <span className="text-muted-foreground">{p.prompt}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Skill ---

function SkillTool({ parsed }: { parsed: Record<string, unknown> }) {
  const skill = parsed.skill as string | undefined;
  const args = parsed.args as string | undefined;

  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs">
      <div className="flex items-center gap-2">
        <Zap className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="font-medium">Skill</span>
        {skill && (
          <Badge variant="outline" className="font-mono text-[10px]">
            {skill}
          </Badge>
        )}
      </div>
      {args && (
        <p className="mt-1 line-clamp-2 pl-5.5 text-muted-foreground">
          {args}
        </p>
      )}
    </div>
  );
}

// --- Simple one-liner ---

function SimpleToolRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-1.5 text-xs">
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="font-medium">{label}</span>
      {children}
    </div>
  );
}
