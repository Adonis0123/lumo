"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  EChart,
  resolveChartColor,
  resolveChartColorAlpha,
} from "@/components/echarts";
import type { EChartsOption } from "@/components/echarts";
import { CardLoading } from "@/components/card-loading";
import { CardError } from "@/components/card-error";
import { useService } from "./use-service";
import type { PerformanceRadarProps } from "./types";

const INDICATORS = [
  { name: "Cost Efficiency", max: 100 },
  { name: "Cache Hit Rate", max: 100 },
  { name: "Error Resilience", max: 100 },
  { name: "Session Activity", max: 100 },
  { name: "Code Output", max: 100 },
];

export function PerformanceRadar({ timeRange }: PerformanceRadarProps) {
  const { dimensions, isLoading, error, refetch } = useService(timeRange);

  if (isLoading) return <CardLoading showTitle />;
  if (error)
    return (
      <CardError
        title="Performance Radar"
        message="Failed to load data"
        onRetry={() => refetch()}
      />
    );

  const option: EChartsOption = {
    radar: {
      indicator: INDICATORS,
      shape: "polygon",
      splitArea: { show: false },
      axisLine: { lineStyle: { color: resolveChartColor("--border") } },
      splitLine: { lineStyle: { color: resolveChartColor("--border") } },
      axisName: {
        color: resolveChartColor("--muted-foreground"),
        fontSize: 11,
      },
    },
    series: [
      {
        type: "radar",
        data: [
          {
            value: dimensions,
            areaStyle: {
              color: resolveChartColorAlpha("--chart-1", 0.15),
            },
            lineStyle: {
              color: resolveChartColor("--chart-1"),
              width: 2,
            },
            itemStyle: {
              color: resolveChartColor("--chart-1"),
            },
          },
        ],
      },
    ],
  };

  return (
    <Card className="gap-3 py-4 h-full">
      <CardHeader className="px-4">
        <CardTitle>Performance Radar</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <EChart option={option} style={{ height: 320 }} />
      </CardContent>
    </Card>
  );
}
