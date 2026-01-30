"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CardLoading } from "@/components/card-loading";
import { CardError } from "@/components/card-error";
import { EChart, resolveChartColor, resolveChartColorAlpha } from "@/components/echarts";
import type { EChartsOption } from "@/components/echarts";
import "echarts-liquidfill";
import { useService } from "./use-service";
import type { ErrorRateLiquidProps } from "./types";

export function ErrorRateLiquid({ timeRange }: ErrorRateLiquidProps) {
  const { errorRate, totalErrors, totalRequests, isLoading, error, refetch } =
    useService(timeRange);

  if (isLoading) return <CardLoading showTitle />;
  if (error)
    return (
      <CardError
        title="Error Rate"
        message="Failed to load data"
        onRetry={() => refetch()}
      />
    );

  const option: EChartsOption = {
    series: [
      {
        type: "liquidFill",
        data: [errorRate, errorRate * 0.8, errorRate * 0.6],
        radius: "80%",
        color: [
          resolveChartColorAlpha("--chart-5", 0.6),
          resolveChartColorAlpha("--chart-5", 0.4),
          resolveChartColorAlpha("--chart-5", 0.2),
        ],
        outline: {
          borderDistance: 2,
          itemStyle: {
            borderWidth: 2,
            borderColor: resolveChartColor("--chart-5"),
          },
        },
        backgroundStyle: {
          color: "transparent",
        },
        label: {
          formatter: `${(errorRate * 100).toFixed(1)}%\nError Rate`,
          fontSize: 14,
          color: resolveChartColor("--foreground"),
        },
      },
    ],
  } as EChartsOption;

  return (
    <Card className="gap-3 py-4 flex-1 min-w-0 flex flex-col min-h-[200px]">
      <CardHeader className="px-4">
        <CardTitle>Error Rate</CardTitle>
      </CardHeader>
      <CardContent className="px-4 flex-1 min-h-0 flex flex-col items-center">
        <EChart option={option} className="h-full w-full [&_canvas]:!cursor-default" style={{ minHeight: 100 }} />
        <p className="text-xs text-muted-foreground mt-1 shrink-0">
          {totalErrors} errors / {totalRequests} requests
        </p>
      </CardContent>
    </Card>
  );
}
