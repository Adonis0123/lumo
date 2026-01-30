"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CardLoading } from "@/components/card-loading";
import { CardError } from "@/components/card-error";
import { EChart, resolveChartColor } from "@/components/echarts";
import type { EChartsOption } from "@/components/echarts";
import { useService } from "./use-service";
import type { CacheHitInsightProps } from "./types";

export function CacheHitInsight({ timeRange }: CacheHitInsightProps) {
  const { cachePercentage, isLoading, error, refetch } = useService(timeRange);

  if (isLoading) return <CardLoading showTitle />;
  if (error)
    return (
      <CardError
        title="Cache Hit Rate"
        message="Failed to load data"
        onRetry={() => refetch()}
      />
    );

  const option: EChartsOption = {
    series: [
      {
        type: "gauge",
        startAngle: 220,
        endAngle: -40,
        min: 0,
        max: 100,
        pointer: {
          show: true,
          length: "60%",
          width: 4,
          itemStyle: { color: resolveChartColor("--foreground") },
        },
        axisLine: {
          lineStyle: {
            width: 14,
            color: [
              [0.3, resolveChartColor("--chart-5")],
              [0.6, resolveChartColor("--chart-3")],
              [1, resolveChartColor("--chart-2")],
            ],
          },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          valueAnimation: true,
          formatter: "{value}%",
          fontSize: 18,
          fontWeight: "bold",
          color: resolveChartColor("--foreground"),
          offsetCenter: [0, "40%"],
        },
        data: [{ value: Math.round(cachePercentage * 10) / 10 }],
      },
    ],
  };

  return (
    <Card className="gap-3 py-4 flex-1 min-w-0 flex flex-col min-h-[200px]">
      <CardHeader className="px-4">
        <CardTitle>Cache Hit Rate</CardTitle>
      </CardHeader>
      <CardContent className="px-4 flex-1 min-h-0 flex flex-col items-center">
        <EChart option={option} className="h-full w-full" style={{ minHeight: 160 }} />
        <div className="flex gap-3 text-[10px] text-muted-foreground mt-1 shrink-0">
          <span className="flex items-center gap-1">
            <span className="inline-block size-2 rounded-full bg-[hsl(var(--chart-5))]" />
            0–30% Low
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block size-2 rounded-full bg-[hsl(var(--chart-3))]" />
            30–60% Mid
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block size-2 rounded-full bg-[hsl(var(--chart-2))]" />
            60–100% Good
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
