"use client";

import { Database, DollarSign, MousePointerClick } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardLoading } from "@/components/card-loading";
import { CardError } from "@/components/card-error";
import { cn } from "@/lib/utils";
import { useService } from "./use-service";
import type { EfficiencyScorecardProps } from "./types";

interface ScoreCardProps {
  title: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  color: "emerald" | "blue" | "violet";
}

const colors = {
  emerald: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  blue: {
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
  },
  violet: {
    bg: "bg-violet-500/10 dark:bg-violet-500/20",
    text: "text-violet-600 dark:text-violet-400",
  },
} as const;

function ScoreCard({ title, value, hint, icon, color }: ScoreCardProps) {
  const c = colors[color];
  return (
    <Card className="gap-3 py-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            c.bg
          )}
        >
          <div className={cn("size-4", c.text)}>{icon}</div>
        </div>
      </CardHeader>
      <CardContent className="px-4">
        <div className={cn("text-3xl font-bold tabular-nums tracking-tight", c.text)}>
          {value}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function getCacheHint(rate: number): string {
  if (rate >= 70) return "Excellent cache utilization";
  if (rate >= 40) return "Good — try reusing context to boost cache hits";
  return "Low cache usage — consider longer conversations for better caching";
}

function getAcceptHint(rate: number): string {
  if (rate >= 80) return "High adoption — Claude's suggestions align well";
  if (rate >= 50) return "Moderate — try refining your prompts for better results";
  return "Low adoption — consider providing more context in prompts";
}

export function EfficiencyScorecard({ timeRange }: EfficiencyScorecardProps) {
  const { scores, isLoading, error, refetch } = useService(timeRange);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardLoading key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <CardError
        title="Efficiency"
        message="Failed to load efficiency data"
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <ScoreCard
        title="Cache Efficiency"
        value={`${scores.cacheRate.toFixed(1)}%`}
        hint={getCacheHint(scores.cacheRate)}
        icon={<Database className="size-4" />}
        color="emerald"
      />
      <ScoreCard
        title="Cost per Session"
        value={`$${scores.costPerSession.toFixed(3)}`}
        hint="Average cost across all sessions"
        icon={<DollarSign className="size-4" />}
        color="blue"
      />
      <ScoreCard
        title="Code Accept Rate"
        value={`${scores.editAcceptRate.toFixed(1)}%`}
        hint={getAcceptHint(scores.editAcceptRate)}
        icon={<MousePointerClick className="size-4" />}
        color="violet"
      />
    </div>
  );
}
