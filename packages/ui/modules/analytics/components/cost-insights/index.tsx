"use client";

import { Lightbulb } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CardLoading } from "@/components/card-loading";
import { CardError } from "@/components/card-error";
import { CardEmpty } from "@/components/card-empty";
import { useService } from "./use-service";
import type { CostInsightsProps } from "./types";

export function CostInsights({ timeRange }: CostInsightsProps) {
  const { insights, isLoading, error, refetch } = useService(timeRange);

  if (isLoading) return <CardLoading showTitle className="h-full" />;
  if (error) {
    return (
      <CardError
        title="Cost Insights"
        message="Failed to load cost data"
        onRetry={() => refetch()}
        className="h-full"
      />
    );
  }
  if (insights.length === 0) {
    return (
      <CardEmpty
        title="Cost Insights"
        message="No cost data available"
        className="h-full"
      />
    );
  }

  return (
    <Card className="h-full gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle>Cost Insights</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="space-y-4">
          {insights.map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {item.label}
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {item.value}
                </span>
              </div>
              {item.tip && (
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Lightbulb className="mt-0.5 size-3 shrink-0 text-amber-500" />
                  <span>{item.tip}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
