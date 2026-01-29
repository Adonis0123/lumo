"use client";

import {
  FileCode,
  GitPullRequest,
  GitCommit,
  MousePointerClick,
  Plus,
  Minus,
  Check,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardLoading } from "@/components/card-loading";
import { CardError } from "@/components/card-error";
import { CardEmpty } from "@/components/card-empty";
import { fmt } from "@/lib/format";
import { useService } from "./use-service";
import type { ProductivityMetricsProps } from "./types";

interface MetricItemProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}

function MetricItem({ icon, label, children }: MetricItemProps) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}

export function ProductivityMetrics({ timeRange }: ProductivityMetricsProps) {
  const { data, isLoading, error, refetch } = useService(timeRange);

  if (isLoading) {
    return <CardLoading showTitle />;
  }

  if (error) {
    return (
      <CardError
        title="Productivity"
        message="Failed to load productivity data"
        onRetry={() => refetch()}
      />
    );
  }

  const hasData =
    data.linesAdded > 0 ||
    data.linesRemoved > 0 ||
    data.pullRequests > 0 ||
    data.commits > 0 ||
    data.codeEditsAccepted > 0 ||
    data.codeEditsRejected > 0;

  if (!hasData) {
    return (
      <CardEmpty title="Productivity" message="No productivity data available" />
    );
  }

  const metrics = [
    {
      key: "loc",
      icon: <FileCode className="size-5 text-muted-foreground" />,
      label: "Lines of Code",
      content: (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1 text-lg font-bold tabular-nums text-green-600 dark:text-green-500">
            <Plus className="size-3" />
            {fmt(data.linesAdded)}
          </span>
          <span className="flex items-center gap-1 text-lg font-bold tabular-nums text-red-600 dark:text-red-500">
            <Minus className="size-3" />
            {fmt(data.linesRemoved)}
          </span>
        </div>
      ),
    },
    {
      key: "pr",
      icon: <GitPullRequest className="size-5 text-muted-foreground" />,
      label: "Pull Requests",
      content: <p className="text-lg font-bold tabular-nums">{fmt(data.pullRequests)}</p>,
    },
    {
      key: "commits",
      icon: <GitCommit className="size-5 text-muted-foreground" />,
      label: "Commits",
      content: <p className="text-lg font-bold tabular-nums">{fmt(data.commits)}</p>,
    },
    {
      key: "edits",
      icon: <MousePointerClick className="size-5 text-muted-foreground" />,
      label: "Code Edit Decisions",
      content: (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1 text-lg font-bold tabular-nums text-green-600 dark:text-green-500">
            <Check className="size-3" />
            {fmt(data.codeEditsAccepted)}
          </span>
          <span className="flex items-center gap-1 text-lg font-bold tabular-nums text-red-600 dark:text-red-500">
            <X className="size-3" />
            {fmt(data.codeEditsRejected)}
          </span>
        </div>
      ),
    },
  ];

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle>Productivity</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col divide-y lg:flex-row lg:divide-x lg:divide-y-0">
          {metrics.map((metric) => (
            <div key={metric.key} className="flex-1 lg:px-4 lg:first:pl-0 lg:last:pr-0">
              <MetricItem icon={metric.icon} label={metric.label}>
                {metric.content}
              </MetricItem>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
