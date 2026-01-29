"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CardLoading } from "@/components/card-loading";
import { CardError } from "@/components/card-error";
import { cn } from "@/lib/utils";
import { fmt } from "@/lib/format";
import { useService } from "./use-service";
import type { WeekDelta } from "../../types";

function formatDeltaValue(delta: WeekDelta): string {
  switch (delta.format) {
    case "currency":
      return fmt(delta.current, "currency");
    case "duration":
      return fmt(delta.current, "duration");
    default:
      return fmt(delta.current, "number");
  }
}

export function WeeklySummary() {
  const { deltas, isLoading, error, refetch } = useService();

  if (isLoading) return <CardLoading showTitle className="h-full" />;
  if (error) {
    return (
      <CardError
        title="Weekly Summary"
        message="Failed to load weekly data"
        onRetry={() => refetch()}
        className="h-full"
      />
    );
  }

  return (
    <Card className="h-full gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle>This Week vs Last</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="space-y-4">
          {deltas.map((delta) => {
            const isUp = delta.changePercent > 0;
            const isFlat = delta.changePercent === 0;
            return (
              <div key={delta.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{delta.label}</p>
                  <p className="text-lg font-semibold tabular-nums">
                    {formatDeltaValue(delta)}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1 text-sm font-medium",
                    isFlat
                      ? "text-muted-foreground"
                      : isUp
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                  )}
                >
                  {isFlat ? (
                    <Minus className="size-3" />
                  ) : isUp ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  <span className="tabular-nums">
                    {isFlat ? "—" : `${Math.abs(delta.changePercent).toFixed(0)}%`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
