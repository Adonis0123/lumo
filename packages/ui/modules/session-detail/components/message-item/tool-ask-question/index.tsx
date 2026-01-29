import { MessageSquare, CircleDot } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AskQuestion {
  question: string;
  header?: string;
  options?: { label: string; description?: string }[];
  multiSelect?: boolean;
}

interface ToolAskQuestionProps {
  input: string;
}

export function ToolAskQuestion({ input }: ToolAskQuestionProps) {
  let questions: AskQuestion[];
  try {
    const parsed = JSON.parse(input);
    questions = parsed.questions ?? [];
  } catch {
    return null;
  }

  if (questions.length === 0) return null;

  return (
    <div className="space-y-2">
      {questions.map((q, i) => (
        <div
          key={i}
          className="rounded-lg border bg-muted/30 px-3 py-2 text-xs"
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="font-medium">{q.question}</span>
          </div>
          {q.options && q.options.length > 0 && (
            <div className="mt-2 space-y-1 pl-5.5">
              {q.options.map((opt, j) => (
                <div key={j} className="flex items-start gap-2">
                  <CircleDot className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                  <div>
                    <Badge
                      variant="outline"
                      className="font-mono text-[10px]"
                    >
                      {opt.label}
                    </Badge>
                    {opt.description && (
                      <span className="ml-1.5 text-muted-foreground">
                        {opt.description}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
