"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { CardLoading } from "@/components/card-loading";
import { CardError } from "@/components/card-error";
import { CardEmpty } from "@/components/card-empty";
import { useService } from "./use-service";

const chartConfig = {
  sessionCount: {
    label: "Sessions",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function SessionPatterns() {
  const { hourlyData, peakHour, avgDurationMin, totalSessions, isLoading, error, refetch } =
    useService();

  if (isLoading) return <CardLoading showTitle />;
  if (error) {
    return (
      <CardError
        title="Session Patterns"
        message="Failed to load session data"
        onRetry={() => refetch()}
      />
    );
  }
  if (totalSessions === 0) {
    return (
      <CardEmpty
        title="Session Patterns"
        message="No session data available"
      />
    );
  }

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle>Session Patterns</CardTitle>
        <CardDescription>
          Peak hour: {peakHour.toString().padStart(2, "0")}:00 &middot; Avg
          duration: {avgDurationMin.toFixed(0)}m &middot; {totalSessions}{" "}
          sessions
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4">
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart
            data={hourlyData}
            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--color-sessionCount)"
              strokeOpacity={0.15}
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              fontSize={11}
              interval={2}
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickMargin={5}
              fontSize={12}
              allowDecimals={false}
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <>
                      <span className="text-muted-foreground">
                        {chartConfig[name as keyof typeof chartConfig]?.label}
                      </span>
                      <span className="ml-auto font-medium">{value as number}</span>
                    </>
                  )}
                />
              }
            />
            <Bar dataKey="sessionCount" radius={[4, 4, 0, 0]}>
              {hourlyData.map((entry) => (
                <Cell
                  key={entry.hour}
                  fill={
                    entry.hour === peakHour
                      ? "hsl(var(--chart-2))"
                      : "var(--color-sessionCount)"
                  }
                  fillOpacity={entry.hour === peakHour ? 1 : 0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
